const nodemailer = require('nodemailer');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { orderId, customerName, customerEmail, shippingAddress, totalAmount, items } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const itemsHtml = items.map(item => 
      `<li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <p style="margin: 0; font-weight: bold;">${item.name}</p>
        <p style="margin: 0; color: #666;">Quantity: ${item.quantity}</p>
        <p style="margin: 0; color: #666;">Price: ₹${item.price}</p>
      </li>`
    ).join('');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #C4A47C; margin: 0;">Alangaram Imitation Jewellery</h1>
          <p style="color: #666; margin-top: 5px;">Order Confirmation</p>
        </div>
        
        <p>Dear ${customerName},</p>
        <p>Thank you for your purchase! We have successfully received your order.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Order Details</h3>
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${totalAmount}</p>
          <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> 10 - 15 Business Days</p>
          <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> 10 - 15 Business Days</p>
          <p style="margin: 5px 0;"><strong>Shipping Address:</strong><br>${shippingAddress}</p>
        </div>
        
        <h3 style="color: #333;">Items Ordered</h3>
        <ul style="list-style-type: none; padding: 0;">
          ${itemsHtml}
        </ul>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; text-align: center;">
          If you have any questions about your order, please contact us at alangaramimitationjewellery@gmail.com
        </p>
      </div>
    `;

    const mailOptions = {
      from: '"Alangaram Jewellery" <' + process.env.EMAIL_USER + '>',
      to: customerEmail,
      subject: `Order Confirmation - ${orderId}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);

    return res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ error: 'Failed to send email receipt' });
  }
}
