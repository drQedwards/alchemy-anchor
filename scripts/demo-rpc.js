#!/usr/bin/env node
/**
 * Alchemy Ethereum mainnet Node RPC demo.
 *
 * Docs: https://www.alchemy.com/docs
 *
 * 1. Copy .env.example to .env
 * 2. Set ALCHEMY_API_KEY=<your key>
 * 3. node scripts/demo-rpc.js
 */
import { ethRpc } from '../src/rpc.js';
import { ETH_USDC } from '../src/constants.js';

async function main() {
  const [chainId, blockNumber, gasPrice, clientVersion] = await Promise.all([
    ethRpc('eth_chainId'),
    ethRpc('eth_blockNumber'),
    ethRpc('eth_gasPrice'),
    ethRpc('web3_clientVersion'),
  ]);

  const latest = Number.parseInt(blockNumber, 16);
  const block = await ethRpc('eth_getBlockByNumber', [blockNumber, false]);
  const usdcSupply = await ethRpc('eth_call', [
    { to: ETH_USDC.address, data: '0x18160ddd' },
    'latest',
  ]);

  console.log(JSON.stringify({
    demo: 'alchemy-node-rpc',
    http: 'https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY',
    chainId: Number.parseInt(chainId, 16),
    clientVersion,
    latestBlock: latest,
    blockHash: block.hash,
    timestamp: Number.parseInt(block.timestamp, 16),
    txCount: Array.isArray(block.transactions) ? block.transactions.length : block.transactions,
    gasPriceWei: BigInt(gasPrice).toString(),
    circleUsdc: {
      address: ETH_USDC.address,
      totalSupply: (Number.parseInt(usdcSupply, 16) / 10 ** ETH_USDC.decimals).toFixed(0),
    },
    note: 'Node RPC watches Ethereum. Alchemy Pay cards settle first on Stellar Circle USDC. This watcher is optional.',
  }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  console.error('\nCreate .env with ALCHEMY_API_KEY=<your key> and re-run: node scripts/demo-rpc.js');
  process.exit(1);
});
