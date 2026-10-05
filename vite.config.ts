import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'razorpay-and-email-local-api',
        configureServer(server) {
          server.middlewares.use('/api/razorpay', async (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });
              req.on('end', async () => {
                try {
                  const parsedBody = JSON.parse(body);
                  const key_id = env.RAZORPAY_KEY_ID;
                  const key_secret = env.RAZORPAY_KEY_SECRET;
                  
                  if (!key_id || !key_secret) {
                    throw new Error("Razorpay keys missing in local .env");
                  }
                
                const response = await fetch('https://api.razorpay.com/v1/orders', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + Buffer.from(key_id + ':' + key_secret).toString('base64')
                  },
                  body: JSON.stringify({
                    amount: Math.round(parsedBody.amount * 100),
                    currency: 'INR',
                    receipt: parsedBody.receipt
                  })
                });
                
                const data = await response.json();
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = response.status;
                res.end(JSON.stringify(data));
              } catch (e: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end();
          }
        });

        // LOCAL TEST PROXY FOR VERIFY PAYMENT
        server.middlewares.use('/api/verify-payment', async (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
              try {
                // In local dev, we just simulate a success because we can't easily spin up firebase-admin
                // without the service account key. 
                // We will return success so the frontend continues to work in dev mode.
                console.log("[VERIFY PAYMENT PROXY] Simulating signature verification success!");
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, message: 'Payment verified locally.' }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(e) }));
              }
            });
          }
        });

        // LOCAL TEST PROXY FOR EMAIL (NODEMAILER)
        server.middlewares.use('/api/send-order-email', async (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
              try {
                const orderData = JSON.parse(body);
                const EMAIL_USER = env.EMAIL_USER;
                const EMAIL_PASS = env.EMAIL_PASS;
                
                if (!EMAIL_USER || !EMAIL_PASS) {
                  throw new Error("Missing EMAIL_USER or EMAIL_PASS in local .env");
                }

                const nodemailer = await import('nodemailer');
                
                const transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                    user: EMAIL_USER,
                    pass: EMAIL_PASS
                  }
                });

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
                    </div>
                  </div>
                `;

                const info = await transporter.sendMail({
                  from: '"Alangaram Jewellery" <' + EMAIL_USER + '>',
                  to: orderData.customerEmail,
                  subject: `Order Confirmation - ${orderData.orderId}`,
                  html: htmlTemplate
                });

                console.log("[EMAIL SUCCESS] Sent to:", orderData.customerEmail);
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, messageId: info.messageId }));
              } catch (e: any) {
                console.error("[EMAIL ERROR]:", e.message);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          }
        });

        // LOCAL TEST PROXY FOR TELEGRAM
        server.middlewares.use('/api/send-telegram', async (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', async () => {
              try {
                const reqBody = JSON.parse(body);
                const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
                const CHAT_ID = env.TELEGRAM_CHAT_ID;
                if (!BOT_TOKEN || !CHAT_ID) throw new Error("Missing Telegram Env");

                const cInfo = reqBody.customerInfo || {};
                const sCost = reqBody.shippingCost || 0;
                const pPrice = reqBody.amount - sCost;
                
                const itemsList = reqBody.items.map((item: any) => `Product ID: ${item.id || item.sku || 'N/A'}\n• ${item.name} (x${item.quantity})`).join('\n\n');
                
                const message = `🚨 *NEW ORDER RECEIVED!* 🚨\n\n*Order ID:* ${reqBody.orderId}\n*Customer:* ${cInfo.name || 'N/A'}\n*Mobile Number:* ${cInfo.phone || 'N/A'}\n*Email:* ${cInfo.email || 'N/A'}\n*Address:* ${cInfo.address || 'N/A'}\n*State:* ${cInfo.state || 'N/A'}\n*Pincode:* ${cInfo.pincode || 'N/A'}\n*Product Price:* ₹${pPrice}\n*Shipping Charges:* ₹${sCost}\n*Total Amount:* ₹${reqBody.amount}\n\n*Items:*\n${itemsList}\n\n⚡ _Check the Admin Dashboard for full details!_`;

                const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })
                });

                const tgData = await tgRes.json();
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = tgRes.status;
                res.end(JSON.stringify(tgData));
              } catch (e: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          }
        });
      }
    }
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    }
  }
  }
})
