import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
    console.warn("Firebase Admin Init in Telegram Handler (fallback to env vars):", error.message);
  }
}

const db = getApps().length ? getFirestore() : null;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end();
  }

  try {
    const { orderId, amount, customerInfo, shippingCost, items, testAlert, customBotToken, customChatId } = req.body;
    
    // 1. Resolve Credentials: Custom Test Input > Firestore DB > Environment Variables
    let botToken = customBotToken || process.env.TELEGRAM_BOT_TOKEN;
    let chatId = customChatId || process.env.TELEGRAM_CHAT_ID;

    // Check dynamic Firestore settings if no direct override passed
    if (!customBotToken || !customChatId) {
      if (db) {
        try {
          const telegramSnap = await db.collection('settings').doc('telegram').get();
          if (telegramSnap.exists) {
            const data = telegramSnap.data();
            if (data.botToken && data.botToken.trim()) botToken = data.botToken.trim();
            if (data.chatId && data.chatId.trim()) chatId = data.chatId.trim();
          }
        } catch (dbErr) {
          console.warn("Could not read dynamic telegram settings, using env fallback:", dbErr.message);
        }
      }
    }

    if (!botToken || !chatId) {
      throw new Error("Missing Telegram credentials. Please configure them in the Admin Dashboard or Vercel Environment Variables.");
    }

    // 2. Handle Instant Test Alert from Admin Panel
    if (testAlert) {
      const testMessage = `🎉 *TELEGRAM NOTIFICATION CONNECTED!* ⚡\n\nYour *Alangaram Imitation Jewellery* store is successfully linked to this chat.\n\nYou will receive instant notifications here whenever a customer places an order!`;
      
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: testMessage,
          parse_mode: 'Markdown'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.description || 'Telegram API Test Error');
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ success: true, message: 'Test message sent successfully!' }));
    }

    // 3. Handle Real Customer Order Alert
    const itemsList = (items || []).map(item => `Product ID: ${item.id || item.sku || 'N/A'}\n• ${item.name}${item.size ? ` (Size: ${item.size})` : ''} (x${item.quantity})`).join('\n\n');
    const productPrice = (amount || 0) - (shippingCost || 0);
    const cInfo = customerInfo || {};

    const message = `🚨 *NEW ORDER RECEIVED!* 🚨
    
*Order ID:* ${orderId}
*Customer:* ${cInfo.name || 'N/A'}
*Mobile Number:* ${cInfo.phone || 'N/A'}
*Email:* ${cInfo.email || 'N/A'}
*Address:* ${cInfo.address || 'N/A'}
*State:* ${cInfo.state || 'N/A'}
*Pincode:* ${cInfo.pincode || 'N/A'}
*Product Price:* ₹${productPrice}
*Shipping Charges:* ₹${shippingCost || 0}
*Total Amount:* ₹${amount}

*Items:*
${itemsList}

⚡ _Check the Admin Dashboard for full details!_`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Telegram API Error:", data);
      throw new Error(data.description || 'Telegram API Error');
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (error) {
    console.error('Telegram Server Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.message || 'Failed to send telegram notification' }));
  }
}
