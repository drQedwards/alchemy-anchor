#!/usr/bin/env node
import { ANCHOR, ASSETS, PMLL_ANCHOR, SCF } from './constants.js';
import { wrapAlchemyPay } from './alchemy-pay.js';
import { info } from './sep24.js';
import { commitFromTxHash } from './stellar-watcher.js';
import { commitCardTrail } from './hash.js';
import { storeCommand } from './store-cmd.js';

const [cmd, ...rest] = process.argv.slice(2);
const flags = Object.fromEntries(
  rest
    .map((a, i, arr) => (a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true] : null))
    .filter(Boolean),
);

async function main() {
  if (!cmd || cmd === 'help' || cmd === '-h') {
    console.log(`alchemy-anchor — official SCF #45 product. Wrap Alchemy Pay, settle Circle USDC, commit XDR to pmll_anchor

  node src/cli.js ids
  node src/cli.js info
  node src/cli.js wrap --account G... --amount 25
  node src/cli.js commit --tx HASH
  node src/cli.js commit --xdr BASE64 [--tx HASH]

The CLI never signs store/bump. A human must.
`);
    return;
  }

  if (cmd === 'ids') {
    console.log(JSON.stringify({
      anchor: ANCHOR,
      primitive: PMLL_ANCHOR,
      terminus: ASSETS.usdc,
      rail: 'alchemy-pay',
      firstSettlement: 'stellar-circle-usdc',
      ethWatcher: 'optional Circle USDC Transfer logs — not a card rail',
      scf: SCF,
    }, null, 2));
    return;
  }

  if (cmd === 'info') {
    console.log(JSON.stringify(info(), null, 2));
    return;
  }

  if (cmd === 'wrap') {
    console.log(JSON.stringify(wrapAlchemyPay({ account: flags.account, amount: flags.amount }), null, 2));
    return;
  }

  if (cmd === 'commit') {
    if (flags.tx) {
      console.log(JSON.stringify(await commitFromTxHash(flags.tx, { account: flags.account, amount: flags.amount }), null, 2));
      return;
    }
    if (flags.xdr) {
      const trail = commitCardTrail({
        xdrBase64: flags.xdr,
        txHash: flags.hash,
        account: flags.account,
        amount: flags.amount,
      });
      console.log(JSON.stringify({ ...trail, store: storeCommand({ id: trail.id, commitment: trail.commitment }) }, null, 2));
      return;
    }
    throw new Error('pass --tx <horizon hash> or --xdr <base64 envelope>');
  }

  throw new Error(`unknown command ${cmd}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
