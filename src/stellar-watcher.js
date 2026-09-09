import { ASSETS, NETWORK } from './constants.js';
import { commitCardTrail } from './hash.js';
import { storeCommand, getCommand } from './store-cmd.js';

export async function envelopeFromTx(hash, horizon = NETWORK.horizon) {
  const res = await fetch(`${horizon}/transactions/${hash}`);
  if (!res.ok) throw new Error(`horizon ${res.status} for tx ${hash}`);
  const json = await res.json();
  return json.envelope_xdr;
}

export async function commitFromTxHash(hash, extra = {}) {
  const xdr = await envelopeFromTx(hash);
  const trail = commitCardTrail({ xdrBase64: xdr, txHash: hash, ...extra });
  return {
    ...trail,
    txHash: hash,
    store: storeCommand({ id: trail.id, commitment: trail.commitment }),
    get: getCommand(trail.id),
  };
}

export function isCircleUsdc(assetType, assetCode, assetIssuer) {
  if (assetType === 'native') return false;
  return assetCode === ASSETS.usdc.code && assetIssuer === ASSETS.usdc.issuer;
}

/**
 * Poll Horizon payments for a destination. When Circle USDC lands, hash the XDR.
 */
export async function watchHorizonPayments(account, { onPayment, horizon = NETWORK.horizon, cursor = 'now' } = {}) {
  const url = `${horizon}/accounts/${account}/payments?cursor=${cursor}&order=asc&limit=50`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`horizon payments ${res.status}`);
  const body = await res.json();
  const records = body?._embedded?.records || [];
  for (const op of records) {
    if (op.type !== 'payment' && op.type !== 'path_payment_strict_send' && op.type !== 'path_payment_strict_receive') {
      continue;
    }
    const code = op.asset_code || (op.asset_type === 'native' ? 'XLM' : op.asset_code);
    const issuer = op.asset_issuer;
    onPayment?.({
      id: op.id,
      txHash: op.transaction_hash,
      from: op.from,
      to: op.to,
      amount: op.amount,
      asset: code,
      issuer,
      circleUsdc: isCircleUsdc(op.asset_type, code, issuer),
    });
  }
  return records;
}
