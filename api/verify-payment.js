import crypto from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin (Singleton)
if (!getApps().length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      initializeApp({
        credential: cert(serviceAccount)
      });
    }
  } catch (error) {
    console.error("Firebase Admin Init Error (Check FIREBASE_SERVICE_ACCOUNT_KEY):", error);
  }
}

const db = getApps().length ? getFirestore() : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, firebase_order_id } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !firebase_order_id) {
    return res.status(400).json({ error: 'Missing required payment verification fields' });
  }

  try {
    // 1. Verify Razorpay Signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Missing RAZORPAY_KEY_SECRET");

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature. Payment forged.' });
    }

    // 2. If Firestore Admin is available on the backend, update order & stock
    if (db) {
      const orderRef = db.collection('orders').doc(firebase_order_id);
      const orderDoc = await orderRef.get();

      if (orderDoc.exists) {
        const orderData = orderDoc.data();

        // Update Order Status
        await orderRef.update({
          status: 'Order Confirmed',
          transactionId: razorpay_payment_id,
          updatedAt: FieldValue.serverTimestamp()
        });

        // Decrement Stock for all items safely on the backend
        if (orderData.items && Array.isArray(orderData.items)) {
          const batch = db.batch();
          for (const item of orderData.items) {
            const productId = item.productId || item.id;
            if (productId) {
              const productRef = db.collection('products').doc(productId.toString());
              batch.update(productRef, {
                stock: FieldValue.increment(-item.quantity)
              });
            }
          }
          await batch.commit();
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Payment verified and order confirmed.' });

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: 'Internal server error during payment verification.' });
  }
}
