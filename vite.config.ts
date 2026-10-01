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
