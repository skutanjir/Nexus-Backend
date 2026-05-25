import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requireSeller } from '../middleware/auth';

const router = Router();

// GET / - list all products (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT p.*, json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
      (SELECT COALESCE(json_agg(json_build_object('rating', pr.rating)), '[]') FROM product_reviews pr WHERE pr.product_id = p.id) as reviews
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
      `       SELECT p.*, json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Get reviews (with user names if not anonymous)
    const reviews = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.seller_reply, r.is_anonymous,
              CASE WHEN r.is_anonymous THEN 'Pengguna Anonim' ELSE u.full_name END as user_name,
              CASE WHEN r.is_anonymous THEN '' ELSE u.avatar_url END as user_avatar
       FROM product_reviews r
       JOIN profiles u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json({ ...result.rows[0], reviews: reviews.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /:id/reviews - submit a review
router.post('/:id/reviews', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { rating, comment, is_anonymous } = req.body;
  const userId = req.user!.userId;
  
  try {
    // Basic validation
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }

    // Verify user actually bought this product and order is completed
    const orderCheck = await pool.query(
      `SELECT o.id FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status = 'completed'`,
      [userId, req.params.id]
    );

    if (!orderCheck.rows[0]) {
      res.status(403).json({ error: 'You can only review products you have purchased and received.' });
      return;
    }

    // Upsert review
    const result = await pool.query(
      `INSERT INTO product_reviews (product_id, user_id, rating, comment, is_anonymous) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (product_id, user_id) 
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, is_anonymous = EXCLUDED.is_anonymous, created_at = now()
       RETURNING *`,
      [req.params.id, userId, rating, comment || null, is_anonymous || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// POST / - create product (seller only)
router.post('/', authenticate, requireSeller, async (req: Request, res: Response): Promise<void> => {
  const { name, description, price, stock, category_id, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock, category_id, image_url, seller_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [name, description || null, price, stock || 0, category_id || null, image_url || null, req.user!.userId]
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

// DELETE /:id - Soft delete product (seller only)
router.delete('/:id', authenticate, requireSeller, async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('UPDATE products SET is_archived = true, updated_at = now() WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});


// PUT /:id/reviews/:reviewId/reply - reply to a review (seller only)
router.put('/:id/reviews/:reviewId/reply', authenticate, requireSeller, async (req: Request, res: Response): Promise<void> => {
  const { reply } = req.body;
  try {
    // Verify product belongs to this seller
    const prodCheck = await pool.query('SELECT seller_id FROM products WHERE id = $1', [req.params.id]);
    if (prodCheck.rows[0]?.seller_id !== req.user!.userId) {
      res.status(403).json({ error: 'Only the product seller can reply to reviews.' });
      return;
    }

    const result = await pool.query(
      'UPDATE product_reviews SET seller_reply = $1 WHERE id = $2 AND product_id = $3 RETURNING *',
      [reply, req.params.reviewId, req.params.id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save reply' });
  }
});

// DELETE /:id/reviews/:reviewId - delete a review (seller only)
router.delete('/:id/reviews/:reviewId', authenticate, requireSeller, async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify product belongs to this seller
    const prodCheck = await pool.query('SELECT seller_id FROM products WHERE id = $1', [req.params.id]);
    if (prodCheck.rows[0]?.seller_id !== req.user!.userId) {
      res.status(403).json({ error: 'Only the product seller can delete reviews.' });
      return;
    }

    const result = await pool.query(
      'DELETE FROM product_reviews WHERE id = $1 AND product_id = $2 RETURNING *',
      [req.params.reviewId, req.params.id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
