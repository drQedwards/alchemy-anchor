import { jsonRpc } from './rpc.js';
import { robinhoodHttpUrl } from './config.js';
import { ROBINHOOD_CHAIN } from './constants.js';

export function rhRpc(method, params = []) {
  return jsonRpc(robinhoodHttpUrl(), method, params);
}

/** Read-only probe. Does not sign or send. */
export async function probeRobinhoodChain() {
  const url = robinhoodHttpUrl();
  const [chainIdHex, blockHex] = await Promise.all([
    rhRpc('eth_chainId'),
    rhRpc('eth_blockNumber'),
  ]);
  const chainId = Number.parseInt(chainIdHex, 16);
  if (chainId !== ROBINHOOD_CHAIN.chainId) {
    throw new Error(`expected Robinhood Chain ${ROBINHOOD_CHAIN.chainId}, got ${chainId}`);
  }
  return {
    demo: 'robinhood-chain-rpc',
    http: url.includes('/v2/') ? url.replace(/\/v2\/[^/]+$/, '/v2/$ROBINHOOD_OR_ALCHEMY_KEY') : ROBINHOOD_CHAIN.http,
    chainId,
    chainIdHex,
    latestBlock: Number.parseInt(blockHex, 16),
    explorer: ROBINHOOD_CHAIN.explorer,
    signs: false,
    sends: false,
    note: ROBINHOOD_CHAIN.note,
  };
}
