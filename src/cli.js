#!/usr/bin/env node
import { ANCHOR, ASSETS, INTERCHAINER, PMLL_ANCHOR, ROBINHOOD_CHAIN, SCF } from './constants.js';
import { wrapAlchemyPay } from './alchemy-pay.js';
import { info } from './sep24.js';
import { commitFromTxHash } from './stellar-watcher.js';
import { commitCardTrail } from './hash.js';
import { storeCommand } from './store-cmd.js';
import { probeRobinhoodChain } from './robinhood.js';
import { planInterchainRoute } from './interchainer.js';
import { recordMoonPayConfirmation, fetchMoonPayTransaction } from './moonpay.js';
import { planMintedDisbursement } from './disburse.js';

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
  node src/cli.js rh
  node src/cli.js route --assets USDC,ETH --account G... --amount 25 [--uuid UUID]
  node src/cli.js confirm --uuid UUID [--status completed]
  node src/cli.js disburse --asset Q --amount 1 --dest G... --uuid UUID
  node src/cli.js commit --tx HASH
  node src/cli.js commit --xdr BASE64 [--tx HASH]

The CLI never signs store/bump. A human must. USDC is never minted.
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
      robinhood: ROBINHOOD_CHAIN,
      interchainer: INTERCHAINER,
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

  if (cmd === 'rh') {
    console.log(JSON.stringify(await probeRobinhoodChain(), null, 2));
    return;
  }

  if (cmd === 'route') {
    console.log(JSON.stringify(planInterchainRoute({
      assets: flags.assets,
      account: flags.account,
      amount: flags.amount,
      moonpayUuid: flags.uuid,
    }), null, 2));
    return;
  }

  if (cmd === 'confirm') {
    if (!flags.uuid) throw new Error('pass --uuid <moonpay-transaction-uuid>');
    const row = flags.status
      ? recordMoonPayConfirmation({ uuid: flags.uuid, status: flags.status === true ? 'completed' : flags.status })
      : await fetchMoonPayTransaction(flags.uuid);
    console.log(JSON.stringify(row, null, 2));
    return;
  }

  if (cmd === 'disburse') {
    console.log(JSON.stringify(planMintedDisbursement({
      asset: flags.asset,
      amount: flags.amount,
      dest: flags.dest,
      moonpayUuid: flags.uuid,
    }), null, 2));
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
