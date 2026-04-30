import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// POST /snap - create Midtrans Snap transaction
router.post('/snap', async (req: Request, res: Response): Promise<void> => {
  const { order_id, gross_amount, customer_details, item_details, finish_url } = req.body;

  try {
    const midtransServerKey = process.env.MIDTRANS_SERVER_KEY!;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const baseUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const authString = Buffer.from(`${midtransServerKey}:`).toString('base64');

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id,
          gross_amount,
        },
        customer_details,
        item_details,
        callbacks: {
          finish: finish_url,
        },
      }),
    });

    const data = (await response.json()) as {
      token?: string;
      redirect_url?: string;
      error_messages?: string[];
    };

    if (!response.ok || !data.token) {
      console.error('Midtrans error:', data);
      res.status(400).json({ error: data.error_messages?.join(', ') || 'Midtrans error' });
      return;
    }

    // Save snap_token to order if order_id matches a real order (not repay suffix)
    const realOrderId = order_id.replace(/-r$/, '');
    await pool
      .query('UPDATE orders SET snap_token=$1 WHERE id=$2', [data.token, realOrderId])
      .catch(() => {});

    res.json({ token: data.token, redirect_url: data.redirect_url });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment service error' });
  }
});

export default router;
