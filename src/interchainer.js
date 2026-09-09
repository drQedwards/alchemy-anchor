import { INTERCHAINER, ASSETS, ANCHOR, PMLL_ANCHOR } from './constants.js';
import { commitCardTrail, sha256Hex } from './hash.js';
import { storeCommand, getCommand } from './store-cmd.js';
import { wrapAlchemyPay } from './alchemy-pay.js';
import { hashMoonPayUuid, assertMoonPayUuid } from './moonpay.js';

export const HOP_ASSETS = INTERCHAINER.assets;

export function assertHopAsset(asset) {
  const code = String(asset || '').toUpperCase();
  if (!HOP_ASSETS.includes(code)) {
    throw new Error(`interchainer hops ${HOP_ASSETS.join('/')}. Got ${asset}`);
  }
  return code;
}

function hopEpisode({ asset, account, amount, moonpayUuid, index }) {
  const iso = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  return [
    `episode:${iso} agent=${ANCHOR.name} event=interchainer-hop`,
    `asset=${asset} account=${account || ''} amount=${amount || ''} index=${index}`,
    `moonpay=${moonpayUuid ? hashMoonPayUuid(moonpayUuid) : ''} primitive=${PMLL_ANCHOR.contractId}`,
  ].join('\n');
}

/**
 * Plan a USDC/BTC/SOL/XLM/ETH move through pmll_anchor, then payrails onto the Alchemy card.
 * Does not send. Does not mint. Each hop is a 32-byte HITL store.
 */
export function planInterchainRoute({
  assets = HOP_ASSETS,
  account,
  amount,
  moonpayUuid,
  xdrBase64,
} = {}) {
  const hops = (Array.isArray(assets) ? assets : String(assets).split(','))
    .map((a) => assertHopAsset(a.trim()))
    .map((asset, index) => {
      const payload = hopEpisode({ asset, account, amount, moonpayUuid, index });
      const commitment = sha256Hex(payload);
      const id = sha256Hex(Buffer.from(commitment, 'hex'));
      return {
        index,
        asset,
        payload,
        commitment,
        id,
        store: storeCommand({ id, commitment }),
        get: getCommand(id),
      };
    });

  const card = wrapAlchemyPay({ account, amount, crypto: 'USDC' });
  const envelope = xdrBase64
    ? commitCardTrail({ xdrBase64, account, amount, asset: 'USDC' })
    : null;

  return {
    tool: 'pmll_anchor_interchainer',
    primitive: INTERCHAINER.contractId,
    hopAccount: INTERCHAINER.hop,
    terminus: ASSETS.usdc,
    moonpayUuidHash: moonpayUuid ? hashMoonPayUuid(assertMoonPayUuid(moonpayUuid)) : null,
    hops,
    payrail: {
      rail: 'alchemy-pay',
      onto: 'alchemy-card',
      checkout: card,
    },
    envelope,
    sends: false,
    mints: false,
    note: INTERCHAINER.role,
  };
}
