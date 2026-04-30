import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requireSeller } from '../middleware/auth';

const router = Router();

// GET / - list all products (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT p.*, json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
      FROM products p LEFT JOIN categories c ON c.id = p.category_id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /:id - get single product (public)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT p.*, json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Get reviews
    const reviews = await pool.query(
      'SELECT rating FROM product_reviews WHERE product_id = $1',
      [req.params.id]
    );
    res.json({ ...result.rows[0], reviews: reviews.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST / - create product (seller only)
router.post('/', authenticate, requireSeller, async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, stock, category_id, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, description || null, price, stock || 0, category_id || null, image_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /:id - update product (seller only)
router.put('/:id', authenticate, requireSeller, async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, stock, category_id, image_url } = req.body;
  try {
    await pool.query(
      'UPDATE products SET name=$1,description=$2,price=$3,stock=$4,category_id=$5,image_url=$6,updated_at=now() WHERE id=$7',
      [name, description || null, price, stock, category_id || null, image_url || null, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /:id - delete product (seller only)
router.delete('/:id', authenticate, requireSeller, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
