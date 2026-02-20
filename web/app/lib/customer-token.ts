import { createHmac } from 'crypto';

export type CustomerQrPayload = {
  cid: string;
  iat: number;
  v: 1;
};

function b64url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

export function generateCustomerToken(customerId: string) {
  const cid = String(customerId || '').trim();
  if (!cid) throw new Error('customerId requerido');

  const payload: CustomerQrPayload = {
    cid,
    iat: Math.floor(Date.now() / 1000),
    v: 1,
  };

  const encodedPayload = b64url(JSON.stringify(payload));
  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) throw new Error('QR_TOKEN_SECRET no configurado');

  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}
