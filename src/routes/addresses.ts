import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET / - list addresses
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC',
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST / - create address
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { label, full_name, phone, address_line, city, province, postal_code } = req.body;
  try {
    const countRes = await pool.query(
      'SELECT COUNT(*) FROM addresses WHERE user_id=$1',
      [req.user!.userId]
    );
    const isFirst = countRes.rows[0].count === '0';
    const result = await pool.query(
      'INSERT INTO addresses (user_id, label, full_name, phone, address_line, city, province, postal_code, is_default) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [
        req.user!.userId,
        label,
        full_name,
        phone,
        address_line,
        city || null,
        province || null,
        postal_code || null,
        isFirst,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create address' });
  }
});

// PUT /:id - update address
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const { label, full_name, phone, address_line, city, province, postal_code } = req.body;
  try {
    await pool.query(
      'UPDATE addresses SET label=$1,full_name=$2,phone=$3,address_line=$4,city=$5,province=$6,postal_code=$7 WHERE id=$8 AND user_id=$9',
      [
        label,
        full_name,
        phone,
        address_line,
        city || null,
        province || null,
        postal_code || null,
        req.params.id,
        req.user!.userId,
      ]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// DELETE /:id - delete address
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [
      req.params.id,
      req.user!.userId,
    ]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// PUT /:id/default - set as default address
router.put('/:id/default', async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE addresses SET is_default=false WHERE user_id=$1', [req.user!.userId]);
    await pool.query('UPDATE addresses SET is_default=true WHERE id=$1 AND user_id=$2', [
      req.params.id,
      req.user!.userId,
    ]);
    res.json({ message: 'Default set' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to set default address' });
  }
});

export default router;
