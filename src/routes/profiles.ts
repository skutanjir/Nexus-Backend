import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';
import { avatarUpload } from '../middleware/upload';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const router = Router();
router.use(authenticate);

// GET /me
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.user!.userId]);
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PUT /me
router.put('/me', async (req: Request, res: Response): Promise<void> => {
  const { full_name, phone, gender } = req.body;
  try {
    await pool.query(
      'UPDATE profiles SET full_name=$1, phone=$2, gender=$3, updated_at=now() WHERE id=$4',
      [full_name, phone || null, gender || null, req.user!.userId]
    );
    const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.user!.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /me/password
router.put('/me/password', async (req: Request, res: Response): Promise<void> => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'Password too short' });
    return;
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user!.userId]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// POST /me/avatar
router.post('/me/avatar', avatarUpload.single('avatar'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No file' });
    return;
  }
  try {
    const url = `/uploads/avatars/${req.file.filename}`;
    
    // Temukan dan hapus file lama jika ada (timpa dengan file baru)
    const oldAvatarResult = await pool.query('SELECT avatar_url FROM profiles WHERE id=$1', [req.user!.userId]);
    const oldAvatarUrl = oldAvatarResult.rows[0]?.avatar_url;
    
    if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = oldAvatarUrl.split('/').pop();
      if (oldFilename) {
        const oldFilePath = path.join(process.cwd(), process.env.UPLOAD_DIR || './uploads', 'avatars', oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath); // hapus dari disk
        }
      }
    }

    await pool.query('UPDATE profiles SET avatar_url=$1, updated_at=now() WHERE id=$2', [
      url,
      req.user!.userId,
    ]);
    res.json({ avatar_url: url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// PUT /me/avatar-url
router.put('/me/avatar-url', async (req: Request, res: Response): Promise<void> => {
  const { avatar_url } = req.body;
  try {
    await pool.query('UPDATE profiles SET avatar_url=$1, updated_at=now() WHERE id=$2', [
      avatar_url,
      req.user!.userId,
    ]);
    res.json({ avatar_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update avatar URL' });
  }
});

export default router;
