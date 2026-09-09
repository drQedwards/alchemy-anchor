import { randomUUID } from 'node:crypto';
import { ASSETS } from './constants.js';
import { wrapAlchemyPay } from './alchemy-pay.js';
import { optionalEnv } from './config.js';

const txs = new Map();

const usdc = {
  enabled: true,
  min_amount: 5,
  max_amount: 20000,
  authentication_required: true,
};

export function info() {
  return {
    deposit: {
      USDC: { ...usdc },
      XLM: { enabled: true, min_amount: 5, authentication_required: true },
    },
    withdraw: {
      USDC: { ...usdc },
      XLM: { enabled: false },
    },
    fee: { enabled: false },
    features: {
      account_creation: false,
      claimable_balances: false,
    },
  };
}

function origin() {
  const home = optionalEnv('HOME_DOMAIN', 'localhost:8787');
  const scheme = home.startsWith('localhost') ? 'http' : 'https';
  return `${scheme}://${home}`;
}

export function startDeposit({ account, assetCode = 'USDC', amount, lang = 'en' }) {
  if (!account) throw new Error('account is required');
  if (!['USDC', 'XLM', 'native'].includes(assetCode)) {
    throw new Error(`unsupported asset_code ${assetCode}`);
  }
  const id = randomUUID();
  const crypto = assetCode === 'XLM' || assetCode === 'native' ? 'XLM' : 'USDC';
  const wrap = wrapAlchemyPay({
    account,
    amount,
    crypto,
    redirectUrl: `${origin()}/sep24/return?id=${id}`,
    callbackUrl: `${origin()}/webhooks/alchemypay`,
  });
  const tx = {
    id,
    kind: 'deposit',
    status: 'incomplete',
    account,
    asset_code: crypto === 'XLM' ? 'XLM' : ASSETS.usdc.code,
    asset_issuer: crypto === 'XLM' ? undefined : ASSETS.usdc.issuer,
    amount_in: amount ? String(amount) : undefined,
    amount_in_asset: 'iso4217:USD',
    amount_out_asset:
      crypto === 'XLM'
        ? 'stellar:native'
        : `stellar:USDC:${ASSETS.usdc.issuer}`,
    lang,
    more_info_url: `${origin()}/sep24/tx/${id}`,
    checkout: wrap,
    started_at: new Date().toISOString(),
  };
  txs.set(id, tx);
  return {
    type: 'interactive_customer_info_needed',
    id,
    url: `${origin()}/sep24/interactive?id=${id}`,
  };
}

export function startWithdraw({ account, assetCode = 'USDC', amount }) {
  if (!account) throw new Error('account is required');
  const id = randomUUID();
  const tx = {
    id,
    kind: 'withdrawal',
    status: 'incomplete',
    account,
    asset_code: assetCode,
    asset_issuer: assetCode === 'USDC' ? ASSETS.usdc.issuer : undefined,
    amount_in: amount ? String(amount) : undefined,
    started_at: new Date().toISOString(),
    more_info_url: `${origin()}/sep24/tx/${id}`,
  };
  txs.set(id, tx);
  return {
    type: 'interactive_customer_info_needed',
    id,
    url: `${origin()}/sep24/interactive?id=${id}`,
  };
}

export function getTx(id) {
  return txs.get(id) || null;
}

export function listTx(account) {
  return [...txs.values()].filter((t) => t.account === account);
}

export function markPending(id, patch = {}) {
  const tx = txs.get(id);
  if (!tx) return null;
  Object.assign(tx, patch, { status: patch.status || tx.status });
  txs.set(id, tx);
  return tx;
}

export function allTx() {
  return [...txs.values()];
}
