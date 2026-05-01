import { Router, Request, Response } from 'express';
import { verifyToken, verifyRefreshToken, signToken, signRefreshToken } from '../utils/jwt';
import redis from '../config/redis';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { JwtPayload } from '../types';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import bcrypt from 'bcryptjs';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role = 'user' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const existingUser = await pool.query('SELECT id FROM profiles WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO profiles (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role`,
      [email, password_hash, full_name || '', role]
    );

    const newUser = result.rows[0];

    // Jangan gen token. Biarkan user login sendiri
    res.status(201).json({
      message: 'Registrasi berhasil, silakan login.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Gagal melakukan registrasi' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    const result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || (!user.password_hash && user.email)) {
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Kredensial tidak valid' });
    }

    const accessToken = signToken({
      userId: user.id,
      role: user.role,
      email: user.email
    });

    const refreshToken = signRefreshToken({
      userId: user.id,
      role: user.role,
      email: user.email
    });

    res.cookie('nexus_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
    });

    res.json({
      message: 'Login berhasil',
      accessToken,
      user: {
        userId: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Gagal melakukan login' });
  }
});

router.get('/me', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || (req.user as any)?.id;
    if (!userId) {
      return res.status(200).json({ user: null, profile: null });
    }

    const profileResult = await pool.query('SELECT * FROM profiles WHERE id = $1', [userId]);

    if (!profileResult.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profileData = profileResult.rows[0];

    res.json({
      user: {
        id: profileData.id,
        email: profileData.email,
        role: profileData.role
      },
      profile: profileData
    });
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

router.post('/refresh', (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.nexus_refresh;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const newAccessToken = signToken({
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const expiry = 60 * 60;
    await redis.set(`blacklist:${token}`, 'true', 'EX', expiry);
  }
  res.clearCookie('nexus_refresh');
  res.json({ message: 'Logged out' });
});

export default router;
