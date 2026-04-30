import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate, requireSeller } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET / - user's own orders
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT o.*,
        (SELECT json_agg(json_build_object(
          'id', oi.id, 'quantity', oi.quantity, 'price_at_purchase', oi.price_at_purchase,
          'product', json_build_object('id', p.id, 'name', p.name, 'image_url', p.image_url)
        )) FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = o.id) as order_items
      FROM orders o WHERE o.user_id = $1 ORDER BY o.created_at DESC LIMIT 50`,
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /admin - all orders (seller only)
router.get('/admin', requireSeller, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT o.*,
        json_build_object('full_name', pr.full_name, 'email', pr.email) as profile,
        (SELECT json_agg(json_build_object(
          'id', oi.id, 'quantity', oi.quantity, 'price_at_purchase', oi.price_at_purchase,
          'product', json_build_object('id', p.id, 'name', p.name, 'image_url', p.image_url)
        )) FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = o.id) as order_items
      FROM orders o JOIN profiles pr ON pr.id = o.user_id ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /admin/stats - dashboard statistics (seller only)
router.get('/admin/stats', requireSeller, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [revData, orderCount, productCount, userCount, recentOrders] = await Promise.all([
      pool.query("SELECT SUM(total_amount) as total FROM orders WHERE status != 'cancelled'"),
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query("SELECT COUNT(*) FROM profiles WHERE role = 'user'"),
      pool.query(`
        SELECT o.id, o.created_at, o.total_amount, o.status,
          json_build_object('full_name', pr.full_name) as profile
        FROM orders o JOIN profiles pr ON pr.id = o.user_id
        ORDER BY o.created_at DESC LIMIT 5
      `),
    ]);
    res.json({
      totalRevenue: Number(revData.rows[0]?.total || 0),
      totalOrders: Number(orderCount.rows[0]?.count || 0),
      totalProducts: Number(productCount.rows[0]?.count || 0),
      totalUsers: Number(userCount.rows[0]?.count || 0),
      recentOrders: recentOrders.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /:id - single order
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT o.*,
        (SELECT json_agg(json_build_object(
          'id', oi.id, 'quantity', oi.quantity, 'price_at_purchase', oi.price_at_purchase,
          'product', json_build_object('id', p.id, 'name', p.name, 'image_url', p.image_url, 'description', p.description)
        )) FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = o.id) as order_items
      FROM orders o WHERE o.id = $1 AND (o.user_id = $2 OR $3 = 'seller')`,
      [req.params.id, req.user!.userId, req.user!.role]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST / - create order
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { total_amount, status, payment_status, shipping_address, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderRes = await client.query(
      'INSERT INTO orders (user_id, total_amount, status, payment_status, shipping_address) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [
        req.user!.userId,
        total_amount,
        status || 'pending',
        payment_status || 'unpaid',
        shipping_address || null,
      ]
    );
    const order = orderRes.rows[0];
    if (items?.length > 0) {
      for (const item of items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES ($1,$2,$3,$4)',
          [order.id, item.product_id, item.quantity, item.price_at_purchase]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// PUT /:id/status - update order status (seller only)
router.put('/:id/status', requireSeller, async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE orders SET status=$1, updated_at=now() WHERE id=$2', [
      status,
      req.params.id,
    ]);
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PUT /:id/payment - update payment info
router.put('/:id/payment', async (req: Request, res: Response): Promise<void> => {
  const { payment_status, status, snap_token } = req.body;
  const fields: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (payment_status !== undefined) {
    fields.push(`payment_status=$${i++}`);
    vals.push(payment_status);
  }
  if (status !== undefined) {
    fields.push(`status=$${i++}`);
    vals.push(status);
  }
  if (snap_token !== undefined) {
    fields.push(`snap_token=$${i++}`);
    vals.push(snap_token);
  }
  fields.push(`updated_at=now()`);
  vals.push(req.params.id);

  try {
    await pool.query(`UPDATE orders SET ${fields.join(',')} WHERE id=$${i}`, vals);
    res.json({ message: 'Payment updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// PUT /:id/cancel - cancel order
router.put('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query(
      "UPDATE orders SET status='cancelled', updated_at=now() WHERE id=$1 AND (user_id=$2 OR $3='seller')",
      [req.params.id, req.user!.userId, req.user!.role]
    );
    res.json({ message: 'Cancelled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

export default router;
