import { ETH_USDC } from './constants.js';
import { ethWsUrl, optionalEnv } from './config.js';

/**
 * Ethereum mainnet Smart Websocket watcher.
 * Subscribes to Circle USDC Transfer logs. This is not a card rail.
 */
export function watchUsdcTransfers({ onLog, onHead, onOpen, dest } = {}) {
  const url = ethWsUrl();
  const ws = new WebSocket(url);
  const destAddr = (dest || optionalEnv('WATCH_ETH_ADDRESS')).toLowerCase();
  let headsId;
  let logsId;

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_subscribe', params: ['newHeads'] }));
    ws.send(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_subscribe',
        params: [
          'logs',
          { address: ETH_USDC.address, topics: [ETH_USDC.transferTopic] },
        ],
      }),
    );
    onOpen?.();
  });

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id === 1) headsId = msg.result;
    if (msg.id === 2) logsId = msg.result;
    if (msg.method !== 'eth_subscription') return;
    const { subscription, result } = msg.params || {};
    if (subscription === headsId) {
      onHead?.(result);
      return;
    }
    if (subscription === logsId) {
      const to = result?.topics?.[2] ? `0x${result.topics[2].slice(26)}` : '';
      if (destAddr && to.toLowerCase() !== destAddr) return;
      onLog?.(result);
    }
  });

  return {
    ws,
    close() {
      try {
        if (headsId) ws.send(JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'eth_unsubscribe', params: [headsId] }));
        if (logsId) ws.send(JSON.stringify({ jsonrpc: '2.0', id: 10, method: 'eth_unsubscribe', params: [logsId] }));
      } catch {
        /* ignore */
      }
      ws.close();
    },
  };
}
