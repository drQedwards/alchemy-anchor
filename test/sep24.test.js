import test from 'node:test';
import assert from 'node:assert/strict';
import { info, startDeposit, getTx } from '../src/sep24.js';
import { ASSETS } from '../src/constants.js';

test('SEP-24 /info advertises USDC deposit with auth', () => {
  const i = info();
  assert.equal(i.deposit.USDC.enabled, true);
  assert.equal(i.deposit.USDC.authentication_required, true);
  assert.equal(i.features.account_creation, false);
});

test('deposit interactive returns hosted URL and stores wrap', () => {
  const started = startDeposit({ account: 'GTESTACCOUNT', assetCode: 'USDC', amount: '25' });
  assert.equal(started.type, 'interactive_customer_info_needed');
  assert.match(started.url, /\/sep24\/interactive\?id=/);
  const tx = getTx(started.id);
  assert.equal(tx.account, 'GTESTACCOUNT');
  assert.equal(tx.asset_issuer, ASSETS.usdc.issuer);
  assert.equal(tx.checkout.rail, 'alchemy-pay');
  assert.match(tx.checkout.url, /alchemypay\.org/);
});
