import { createHash } from 'node:crypto';
import { ANCHOR } from './constants.js';

export function sha256Hex(data) {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  return createHash('sha256').update(buf).digest('hex');
}

export function sha256Bytes(data) {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : Buffer.from(data);
  return createHash('sha256').update(buf).digest();
}

/** SHA-256 of a Stellar transaction envelope (XDR, base64). 32 bytes. */
export function hashEnvelopeXdr(xdrBase64) {
  const xdr = String(xdrBase64).replace(/\s+/g, '');
  const digest = createHash('sha256').update(Buffer.from(xdr, 'base64')).digest();
  return { commitment: digest.toString('hex'), envelopeChars: xdr.length };
}

/**
 * Canonical off-chain episode. Payload never goes on-chain.
 * id = SHA-256(commitment) unless an id hint is supplied.
 */
export function commitCardTrail({ xdrBase64, txHash, account, amount, asset, orderId }) {
  const { commitment, envelopeChars } = hashEnvelopeXdr(xdrBase64);
  const iso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const payload = [
    `episode:${iso} agent=${ANCHOR.name} event=alchemy-pay-card`,
    `account=${account || ''} amount=${amount || ''} asset=${asset || 'USDC'}`,
    `tx=${txHash || ''} order=${orderId || ''} envelopeChars=${envelopeChars}`,
  ].join('\n');
  const id = sha256Hex(Buffer.from(commitment, 'hex'));
  return { payload, commitment, id, envelopeChars };
}

export function as0x(hex) {
  const h = String(hex).replace(/^0x/, '').toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(h)) {
    throw new Error(`expected 32-byte hex, got ${hex}`);
  }
  return `0x${h}`;
}
