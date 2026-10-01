import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'razorpay-local-api',
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
                const key_id = 'rzp_test_TiX7zTCljpZoiL';
                const key_secret = '1QlU8BwTlpTfJaN06f1dyaq4';
                
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
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end();
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
})
