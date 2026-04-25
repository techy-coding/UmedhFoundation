export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed.' }),
    };
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Razorpay keys are missing. Add VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Netlify environment variables.',
      }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const amount = Number(payload.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'A valid order amount is required.' }),
      };
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: payload.currency || 'INR',
        receipt: payload.receipt || `receipt_${Date.now()}`,
        notes: payload.notes || {},
      }),
    });

    const body = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          message: body?.error?.description || 'Unable to create Razorpay order.',
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(body),
    };
  } catch (error) {
    console.error('Netlify Razorpay order error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Could not create Razorpay order.' }),
    };
  }
}
