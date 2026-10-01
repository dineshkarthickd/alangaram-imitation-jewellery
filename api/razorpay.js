export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount, receipt } = req.body;
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_TiX7zTCljpZoiL';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '1QlU8BwTlpTfJaN06f1dyaq4';

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(key_id + ':' + key_secret).toString('base64')
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Razorpay accepts paise, so multiply INR by 100
        currency: 'INR',
        receipt: receipt
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      res.status(200).json(data);
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    console.error('Razorpay API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
