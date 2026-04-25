import { createHmac } from 'node:crypto';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed.', verified: false }),
    };
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Razorpay secret is missing.', verified: false }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const orderId = payload.razorpay_order_id;
    const paymentId = payload.razorpay_payment_id;
    const signature = payload.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          verified: false,
          message: 'Razorpay verification payload is incomplete.',
        }),
      };
    }

    const expectedSignature = createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const verified = expectedSignature === signature;

    return {
      statusCode: verified ? 200 : 400,
      body: JSON.stringify({
        verified,
        message: verified ? 'Payment verified successfully.' : 'Payment signature verification failed.',
      }),
    };
  } catch (error) {
    console.error('Netlify Razorpay verify error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ verified: false, message: 'Could not verify Razorpay payment.' }),
    };
  }
}
