#!/usr/bin/env node
/**
 * Alchemy Solana mainnet RPC demo.
 *
 * Docs: https://www.alchemy.com/docs/solana/solana-api-overview
 *
 * 1. Copy .env.example to .env
 * 2. Set ALCHEMY_API_KEY=<your key>
 * 3. node scripts/demo-solana.js
 */
import { solanaRpc } from '../src/rpc.js';

async function main() {
  const [health, slot, version, blockhash] = await Promise.all([
    solanaRpc('getHealth'),
    solanaRpc('getSlot', [{ commitment: 'confirmed' }]),
    solanaRpc('getVersion'),
    solanaRpc('getLatestBlockhash', [{ commitment: 'confirmed' }]),
  ]);

  console.log(JSON.stringify({
    demo: 'alchemy-solana',
    http: 'https://solana-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY',
    health,
    slot,
    version,
    latestBlockhash: blockhash?.value?.blockhash,
    lastValidBlockHeight: blockhash?.value?.lastValidBlockHeight,
    note: 'Solana JSON-RPC through Alchemy. This is not the Alchemy Pay card rail and not Stellar settlement.',
  }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  console.error('\nCreate .env with ALCHEMY_API_KEY=<your key> and re-run: node scripts/demo-solana.js');
  process.exit(1);
});
