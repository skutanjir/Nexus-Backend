import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requireSeller } from '../middleware/auth';

const router = Router();

// GET / - list all categories (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(p.id)::int AS product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST / - create category (seller only)
router.post('/', authenticate, requireSeller, async (req: Request, res: Response): Promise<void> => {
  const { name, slug, icon, description, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, slug, icon, description, image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, slug, icon || null, description || null, image_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /:id - update category (seller only)
router.put('/:id', authenticate, requireSeller, async (req: Request, res: Response): Promise<void> => {
  const { name, slug, icon, description, image_url } = req.body;
  try {
    await pool.query(
      'UPDATE categories SET name=$1,slug=$2,icon=$3,description=$4,image_url=$5 WHERE id=$6',
      [name, slug, icon || null, description || null, image_url || null, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /:id - delete category (seller only)
router.delete('/:id', authenticate, requireSeller, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
