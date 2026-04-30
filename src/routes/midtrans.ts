import { Router } from 'express';
// @ts-ignore
import midtransClient from 'midtrans-client';
import pool from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

router.post('/create-snap', authenticate, async (req, res) => {
  const { orderId, amount, customerDetails, itemDetails } = req.body;

  try {
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: customerDetails,
      item_details: itemDetails,
      credit_card: {
        secure: true,
      },
    };

    const transaction = await snap.createTransaction(parameter);
    
    await pool.query(
      'UPDATE public.orders SET snap_token = $1 WHERE id = $2',
      [transaction.token, orderId]
    );

    res.json(transaction);
  } catch (error: any) {
    console.error('Midtrans Snap Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment transaction' });
  }
});

router.post('/webhook', async (req, res) => {
  const notification = req.body;

  try {
    const statusResponse = await snap.transaction.notification(notification);
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    let paymentStatus = 'pending';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        paymentStatus = 'pending';
      } else if (fraudStatus === 'accept') {
        paymentStatus = 'paid';
      }
    } else if (transactionStatus === 'settlement') {
      paymentStatus = 'paid';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      paymentStatus = 'failed';
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending';
    }

    await pool.query(
      'UPDATE public.orders SET payment_status = $1, updated_at = now() WHERE id = $2',
      [paymentStatus, orderId]
    );

    res.status(200).send('OK');
  } catch (error: any) {
    console.error('Midtrans Webhook Error:', error);
    res.status(500).json({ error: error.message || 'Webhook processing failed' });
  }
});

export default router;
