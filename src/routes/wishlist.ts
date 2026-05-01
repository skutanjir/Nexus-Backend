import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET / - list wishlist items
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT w.*, json_build_object(
        'id', p.id, 'name', p.name, 'price', p.price, 'image_url', p.image_url, 'stock', p.stock, 'is_archived', p.is_archived,
        'category', json_build_object('name', c.name)
      ) as product
      FROM wishlists w
      JOIN products p ON p.id = w.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE w.user_id=$1 ORDER BY w.created_at DESC`,
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST / - add to wishlist
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { product_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO wishlists (user_id, product_id) VALUES ($1,$2) ON CONFLICT (user_id, product_id) DO NOTHING RETURNING *',
      [req.user!.userId, product_id]
    );
    res.status(201).json(result.rows[0] || { message: 'Already in wishlist' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /:id - remove from wishlist
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM wishlists WHERE id=$1 AND user_id=$2', [
      req.params.id,
      req.user!.userId,
    ]);
    res.json({ message: 'Removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

export default router;
