#!/usr/bin/env node
/**
 * Alchemy Smart Websockets demo (Ethereum mainnet).
 *
 * Docs: https://www.alchemy.com/docs/reference/subscription-api
 *
 * 1. Copy .env.example to .env
 * 2. Set ALCHEMY_API_KEY=<your key>  (never hard-code it)
 * 3. node demo-script.js
 *
 * Optional: ALCHEMY_WATCH=1 keeps the socket open.
 * Optional: WATCH_ETH_ADDRESS=0x… filters Circle USDC Transfer `to`.
 */
import { ethRpc } from './src/rpc.js';
import { ETH_USDC } from './src/constants.js';
import { watchUsdcTransfers } from './src/eth-watcher.js';

const keepOpen = process.env.ALCHEMY_WATCH === '1';
const maxHeads = Number(process.env.HEADS || 2);
const maxLogs = Number(process.env.LOGS || 3);

async function main() {
  const chainId = await ethRpc('eth_chainId');
  const blockHex = await ethRpc('eth_blockNumber');
  console.log(JSON.stringify({
    demo: 'alchemy-smart-websockets',
    http: 'https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY',
    ws: 'wss://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY',
    chainId: Number.parseInt(chainId, 16),
    latestBlock: Number.parseInt(blockHex, 16),
    note: 'The HTTP URL is the node. The websocket is the subscription API. Neither charges a card.',
  }, null, 2));

  let heads = 0;
  let logs = 0;
  const started = Date.now();

  const sub = watchUsdcTransfers({
    onOpen() {
      console.log('\nsubscribed: newHeads + logs(Circle USDC Transfer)');
      console.log(`USDC ${ETH_USDC.address}`);
    },
    onHead(head) {
      heads += 1;
      console.log('\n--- newHeads ---');
      console.log(JSON.stringify({
        number: Number.parseInt(head.number, 16),
        hash: head.hash,
        parentHash: head.parentHash,
        timestamp: Number.parseInt(head.timestamp, 16),
        gasUsed: Number.parseInt(head.gasUsed, 16),
        miner: head.miner,
      }, null, 2));
      if (!keepOpen && heads >= maxHeads) {
        console.log(`\nGot ${heads} newHeads in ${Date.now() - started}ms. Exiting.`);
        console.log('Set ALCHEMY_WATCH=1 to keep listening for USDC Transfer logs.');
        sub.close();
      }
    },
    onLog(log) {
      logs += 1;
      if (!keepOpen && logs > maxLogs) return;
      const from = log.topics?.[1] ? `0x${log.topics[1].slice(26)}` : '';
      const to = log.topics?.[2] ? `0x${log.topics[2].slice(26)}` : '';
      const value = log.data ? Number.parseInt(log.data, 16) / 10 ** ETH_USDC.decimals : 0;
      console.log('\n--- Circle USDC Transfer (Ethereum watcher, not a card charge) ---');
      console.log(JSON.stringify({
        tx: log.transactionHash,
        from,
        to,
        value,
        blockNumber: Number.parseInt(log.blockNumber, 16),
      }, null, 2));
    },
  });

  sub.ws.addEventListener('error', (err) => {
    console.error('websocket error', err.message || err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(err.message || err);
  console.error('\nCreate .env with ALCHEMY_API_KEY=<your key> and re-run: node demo-script.js');
  process.exit(1);
});
