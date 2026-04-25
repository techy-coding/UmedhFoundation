import { createHmac, randomUUID } from 'node:crypto'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

async function readJsonBody(req: import('node:http').IncomingMessage) {
  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(res: import('node:http').ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function razorpayApiPlugin(env: Record<string, string>) {
  const keyId = env.RAZORPAY_KEY_ID || env.VITE_RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  const registerMiddleware = (middlewares: { use: (path: string, handler: (req: any, res: any, next: () => void) => void | Promise<void>) => void }) => {
    middlewares.use('/api/razorpay/order', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }

      if (!keyId || !keySecret) {
        sendJson(res, 500, {
          message: 'Razorpay keys are missing. Add VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your env.',
        });
        return;
      }

      try {
        const body = await readJsonBody(req);
        const amount = Number(body.amount || 0);

        if (!Number.isFinite(amount) || amount <= 0) {
          sendJson(res, 400, { message: 'A valid order amount is required.' });
          return;
        }

        const response = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency: body.currency || 'INR',
            receipt: body.receipt || `receipt_${randomUUID()}`,
            notes: body.notes || {},
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          sendJson(res, response.status, {
            message: payload?.error?.description || 'Unable to create Razorpay order.',
          });
          return;
        }

        sendJson(res, 200, payload);
      } catch (error) {
        console.error('Razorpay order creation failed:', error);
        sendJson(res, 500, { message: 'Could not create Razorpay order.' });
      }
    });

    middlewares.use('/api/razorpay/verify', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }

      if (!keySecret) {
        sendJson(res, 500, { message: 'Razorpay secret is missing.' });
        return;
      }

      try {
        const body = await readJsonBody(req);
        const orderId = body.razorpay_order_id;
        const paymentId = body.razorpay_payment_id;
        const signature = body.razorpay_signature;

        if (!orderId || !paymentId || !signature) {
          sendJson(res, 400, { message: 'Razorpay verification payload is incomplete.', verified: false });
          return;
        }

        const expectedSignature = createHmac('sha256', keySecret)
          .update(`${orderId}|${paymentId}`)
          .digest('hex');

        const verified = expectedSignature === signature;

        sendJson(res, verified ? 200 : 400, {
          verified,
          message: verified ? 'Payment verified successfully.' : 'Payment signature verification failed.',
        });
      } catch (error) {
        console.error('Razorpay verification failed:', error);
        sendJson(res, 500, { verified: false, message: 'Could not verify Razorpay payment.' });
      }
    });
  };

  return {
    name: 'razorpay-dev-api',
    configureServer(server: { middlewares: any }) {
      registerMiddleware(server.middlewares);
    },
    configurePreviewServer(server: { middlewares: any }) {
      registerMiddleware(server.middlewares);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      figmaAssetResolver(),
      razorpayApiPlugin(env),
      // The React and Tailwind plugins are both required for Make, even if
      // Tailwind is not being actively used – do not remove them
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        // Alias @ to the src directory
        '@': path.resolve(__dirname, './src'),
      },
    },

    // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
    assetsInclude: ['**/*.svg', '**/*.csv'],
  };
})
