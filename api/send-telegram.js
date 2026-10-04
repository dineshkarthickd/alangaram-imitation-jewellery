module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end();
  }

  try {
    const { orderId, amount, customerInfo, shippingCost, items } = req.body;
    
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      throw new Error("Missing Telegram credentials in Environment variables.");
    }

    const itemsList = items.map(item => `Product ID: ${item.id || item.sku || 'N/A'}\n• ${item.name} (x${item.quantity})`).join('\n\n');
    const productPrice = amount - (shippingCost || 0);

    const message = `🚨 *NEW ORDER RECEIVED!* 🚨
    
*Order ID:* ${orderId}
*Customer:* ${customerInfo.name}
*Mobile Number:* ${customerInfo.phone}
*Email:* ${customerInfo.email}
*Address:* ${customerInfo.address}
*State:* ${customerInfo.state}
*Pincode:* ${customerInfo.pincode}
*Product Price:* ₹${productPrice}
*Shipping Charges:* ₹${shippingCost || 0}
*Total Amount:* ₹${amount}

*Items:*
${itemsList}

⚡ _Check the Admin Dashboard for full details!_`;

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
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
    res.end(JSON.stringify({ error: 'Failed to send telegram notification' }));
  }
};
