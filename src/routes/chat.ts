import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';
import { chatImageUpload } from '../middleware/upload';
import { getIO } from '../config/socket';

const router = Router();
router.use(authenticate);

// GET /orders/:orderId/messages - fetch chat messages for an order
router.get('/orders/:orderId/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify user has access to this order
    const orderCheck = await pool.query(
      "SELECT id FROM orders WHERE id=$1 AND (user_id=$2 OR $3='seller')",
      [req.params.orderId, req.user!.userId, req.user!.role]
    );
    if (!orderCheck.rows[0]) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await pool.query(
      'SELECT * FROM chat_messages WHERE order_id=$1 ORDER BY created_at ASC',
      [req.params.orderId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /orders/:orderId/messages - send a chat message
router.post('/orders/:orderId/messages', async (req: Request, res: Response): Promise<void> => {
  const { message, image_url, message_type = 'text' } = req.body;
  try {
    const orderCheck = await pool.query(
      "SELECT id FROM orders WHERE id=$1 AND (user_id=$2 OR $3='seller')",
      [req.params.orderId, req.user!.userId, req.user!.role]
    );
    if (!orderCheck.rows[0]) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const result = await pool.query(
      'INSERT INTO chat_messages (order_id, sender_id, sender_role, message, image_url, message_type) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [
        req.params.orderId,
        req.user!.userId,
        req.user!.role,
        message || null,
        image_url || null,
        message_type,
      ]
    );
    const newMessage = result.rows[0];

    // Emit real-time event via Socket.io
    try {
      const io = getIO();
      io.to(`order:${req.params.orderId}`).emit('new_message', newMessage);
    } catch {
      // Socket.io not initialized, skip
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /upload - upload chat image
router.post('/upload', chatImageUpload.single('image'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file' });
    return;
  }
  res.json({ url: `/uploads/chat-images/${req.file.filename}` });
});

export default router;
