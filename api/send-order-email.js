const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end();
  }

  try {
    const orderData = req.body;
    
    // Create HTML Template for the email
    const htmlTemplate = `
      <div style="font-family: 'Georgia', serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0d5c1; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #fcfbf9; padding: 30px; text-align: center; border-bottom: 1px solid #e0d5c1;">
          <h1 style="color: #c4a47c; margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase;">Alangaram</h1>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 12px; letter-spacing: 2px;">IMITATION JEWELLERY</p>
        </div>
        
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="font-size: 22px; color: #333; margin-top: 0; font-weight: normal;">Order Confirmed!</h2>
          <p style="font-size: 15px; color: #555; line-height: 1.6;">Dear ${orderData.customerName},</p>
          <p style="font-size: 15px; color: #555; line-height: 1.6;">Thank you for shopping with Alangaram. Your beautiful jewellery order has been successfully placed and is being processed.</p>
          
          <div style="background-color: #fcfbf9; border: 1px solid #e0d5c1; border-radius: 6px; padding: 20px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;"><strong>Order ID:</strong> ${orderData.orderId}</p>
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;"><strong>Amount Paid:</strong> ₹${orderData.totalAmount}</p>
            <p style="margin: 0; font-size: 14px; color: #666;"><strong>Shipping Address:</strong><br/>
              <span style="font-family: sans-serif; line-height: 1.5;">${orderData.shippingAddress}</span>
            </p>
          </div>
          
          <h3 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 30px; font-weight: normal;">Order Summary</h3>
          <ul style="list-style-type: none; padding: 0; margin: 0; font-family: sans-serif;">
            ${orderData.items.map(item => `
              <li style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 14px; display: flex; justify-content: space-between;">
                <span style="color: #555;">${item.quantity}x ${item.name}</span>
                <span style="font-weight: bold; color: #333;">₹${item.price * item.quantity}</span>
              </li>
            `).join('')}
          </ul>
          
          <p style="font-size: 14px; color: #555; line-height: 1.6; margin-top: 30px;">
            If you have any questions about your order, please reply directly to this email or contact our support team via WhatsApp at <strong>+91 63742 92001</strong>.
          </p>
        </div>
        
        <div style="background-color: #2b2b2b; color: #fff; text-align: center; padding: 20px; font-size: 12px; font-family: sans-serif; letter-spacing: 0.5px;">
          <p style="margin: 0; color: #aaa;">© ${new Date().getFullYear()} Alangaram Imitation Jewellery.<br/>All rights reserved.</p>
        </div>
      </div>
    `;

    // Resend currently requires sending from onboarding@resend.dev unless a custom domain is verified
    const data = await resend.emails.send({
      from: 'Alangaram Jewellery <onboarding@resend.dev>',
      to: orderData.customerEmail,
      subject: `Order Confirmation - ${orderData.orderId}`,
      html: htmlTemplate,
    });

    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message }));
  }
};
