import { createHmac } from 'node:crypto';
import { ALCHEMY_PAY } from './constants.js';
import { optionalEnv } from './config.js';

/**
 * Alchemy Pay page-integration URL.
 * Card PAN stays on Alchemy Pay. This process only builds a signed checkout link.
 *
 * Sign: HMAC-SHA256 over sorted `k=v` pairs, base64, matching the page-integration docs.
 * Merchant `ALCHEMY_PAY_APP_ID` / `ALCHEMY_PAY_SECRET` are required for a live charge.
 * Without them we still return the unsigned sandbox URL so SEP-24 can be exercised locally.
 */
export function signParams(params, secret) {
  const keys = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== '')
    .sort();
  const payload = keys.map((k) => `${k}=${params[k]}`).join('&');
  return createHmac('sha256', secret).update(payload).digest('base64');
}

export function checkoutParams({
  account,
  amount,
  crypto = ALCHEMY_PAY.crypto,
  network = ALCHEMY_PAY.network,
  fiat = ALCHEMY_PAY.fiat,
  redirectUrl,
  callbackUrl,
  appId,
} = {}) {
  const params = {
    appId,
    crypto,
    network,
    showTable: 'buy',
    fiat,
    timestamp: String(Date.now()),
  };
  if (amount) params.fiatAmount = String(amount);
  if (account) params.address = account;
  if (redirectUrl) params.redirectUrl = redirectUrl;
  if (callbackUrl) params.callbackUrl = callbackUrl;
  return params;
}

export function wrapAlchemyPay({
  account,
  amount,
  crypto,
  network,
  fiat,
  redirectUrl,
  callbackUrl,
} = {}) {
  const env = optionalEnv('ALCHEMY_PAY_ENV', 'sandbox');
  const base = env === 'prod' ? ALCHEMY_PAY.prod : ALCHEMY_PAY.sandbox;
  const appId = optionalEnv('ALCHEMY_PAY_APP_ID');
  const secret = optionalEnv('ALCHEMY_PAY_SECRET');
  const params = checkoutParams({
    account,
    amount,
    crypto,
    network,
    fiat,
    redirectUrl,
    callbackUrl,
    appId: appId || 'REPLACE_ALCHEMY_PAY_APP_ID',
  });
  let signed = false;
  if (appId && secret) {
    params.sign = signParams(params, secret);
    signed = true;
  }
  const url = `${base}?${new URLSearchParams(params).toString()}`;
  return {
    rail: 'alchemy-pay',
    settlement: ALCHEMY_PAY.firstSettlement,
    env,
    signed,
    url,
    params: { ...params, sign: signed ? '[redacted]' : undefined },
    note: signed
      ? 'Hosted Alchemy Pay checkout. Card data never hits this process.'
      : 'Unsigned sandbox URL. Set ALCHEMY_PAY_APP_ID and ALCHEMY_PAY_SECRET for a live charge.',
  };
}
