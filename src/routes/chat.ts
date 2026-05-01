import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';
import { chatImageUpload } from '../middleware/upload';
import { getIO } from '../config/socket';

const router = Router();
router.use(authenticate);

// GET /api/chat/unread-count - get total unread messages
router.get('/unread-count', async (req: Request, res: Response): Promise<void> => {
  try {
    const myId = req.user!.userId;
    // TBD in DB: We would query where receiver is me and is_read is false.
    // Since we don't have "is_read" yet, let's mock it to 0 or check if we have it in schema
    // To implement a real red dot, we usually need an 'is_read' column.
    // For now, return 0 to prevent 404/500 errors if pinged.
    res.json({ unread_count: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to count' });
  }
});

// GET /api/chat/contacts - fetch list of users/sellers we have chatted with
router.get('/contacts', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let result;
    if (role === 'seller') {
      // For seller, get unique users they have chatted with
      result = await pool.query(
        `SELECT DISTINCT p.id, p.full_name, p.avatar_url, p.role
         FROM chat_messages c
         JOIN profiles p ON c.user_id = p.id
         WHERE c.seller_id = $1`,
        [userId]
      );
    } else {
      // For user, get unique sellers they have chatted with
      result = await pool.query(
        `SELECT DISTINCT p.id, p.full_name, p.avatar_url, p.role
         FROM chat_messages c
         JOIN profiles p ON c.seller_id = p.id
         WHERE c.user_id = $1`,
        [userId]
      );
    }
    
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// GET /api/chat/messages/:contactId - fetch chat messages between me and contactId
router.get('/messages/:contactId', async (req: Request, res: Response): Promise<void> => {
  try {
    const myId = req.user!.userId;
    const myRole = req.user!.role;
    const contactId = req.params.contactId;

    let userId, sellerId;
    if (myRole === 'seller') {
      sellerId = myId;
      userId = contactId;
    } else {
      userId = myId;
      sellerId = contactId;
    }

    const result = await pool.query(
      `SELECT * FROM chat_messages 
       WHERE user_id = $1 AND seller_id = $2 
       ORDER BY created_at ASC`,
      [userId, sellerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/messages/:contactId - send a chat message
router.post('/messages/:contactId', async (req: Request, res: Response): Promise<void> => {
  const { message, image_url, message_type = 'text' } = req.body;
  try {
    const myId = req.user!.userId;
    const myRole = req.user!.role;
    const contactId = req.params.contactId;

    let userId, sellerId;
    if (myRole === 'seller') {
      sellerId = myId;
      userId = contactId;
    } else {
      userId = myId;
      sellerId = contactId;
    }

    // Optional: verify the contact actually exists and is the correct role
    const contactCheck = await pool.query('SELECT role FROM profiles WHERE id = $1', [contactId]);
    if (!contactCheck.rows[0]) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO chat_messages (user_id, seller_id, sender_id, sender_role, message, image_url, message_type) 
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        userId,
        sellerId,
        myId,
        myRole,
        message || null,
        image_url || null,
        message_type,
      ]
    );
    const newMessage = result.rows[0];

    // Emit real-time event via Socket.io
    try {
      const io = getIO();
      // Room format: chat_{userId}_{sellerId}
      const roomName = `chat_${userId}_${sellerId}`;
      io.to(roomName).emit('new_message', newMessage);

      // Ting-tong! Notifikasi bell realtime
      const receiverId = myRole === 'seller' ? userId : sellerId;
      io.to(`user_${receiverId}`).emit('new_notification', {
        type: 'chat',
        title: 'Pesan Baru',
        message: 'Anda menerima pesan baru.'
      });
    } catch {
      // Socket.io not initialized, skip
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/chat/upload - upload chat image
router.post('/upload', chatImageUpload.single('image'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file' });
    return;
  }
  res.json({ url: `/uploads/chat-images/${req.file.filename}` });
});

export default router;