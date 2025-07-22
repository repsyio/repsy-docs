const crypto = require('crypto');

function validateSignature(payload, signature, timestamp, secretKey) {
  try {
    const timestampedData = timestamp + "." + payload;

    const base64urlToBase64 = (str) => str.replace(/-/g, '+').replace(/_/g, '/');
    const keyBuffer = Buffer.from(base64urlToBase64(secretKey), 'base64');

    const hmac = crypto.createHmac('sha256', keyBuffer);
    hmac.update(timestampedData, 'utf8');
    const rawHmac = hmac.digest();

    const expectedSignature = rawHmac.toString('base64');

    return expectedSignature === signature;
  } catch (e) {
    return false;
  }
}
