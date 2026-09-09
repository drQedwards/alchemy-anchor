import test from 'node:test';
import assert from 'node:assert/strict';
import { planInterchainRoute, assertHopAsset, HOP_ASSETS } from '../src/interchainer.js';
import { INTERCHAINER, PMLL_ANCHOR, ROBINHOOD_CHAIN } from '../src/constants.js';
import { hashMoonPayUuid, recordMoonPayConfirmation, assertMoonPayCompleted, assertMoonPayUuid } from '../src/moonpay.js';
import { planMintedDisbursement, assertNotDollarMint } from '../src/disburse.js';

const UUID = 'fd43b900-593b-4125-9616-7d721ecbe875';

test('Robinhood Chain id is 4663', () => {
  assert.equal(ROBINHOOD_CHAIN.chainId, 4663);
  assert.equal(Number.parseInt(ROBINHOOD_CHAIN.chainIdHex, 16), 4663);
});

test('interchainer hops USDC BTC SOL XLM ETH and commits to live pmll_anchor', () => {
  assert.deepEqual([...HOP_ASSETS], ['USDC', 'BTC', 'SOL', 'XLM', 'ETH']);
  const plan = planInterchainRoute({
    assets: 'USDC,ETH',
    account: 'GTEST',
    amount: '25',
    moonpayUuid: UUID,
  });
  assert.equal(plan.tool, 'pmll_anchor_interchainer');
  assert.equal(plan.primitive, PMLL_ANCHOR.contractId);
  assert.equal(plan.mints, false);
  assert.equal(plan.hops.length, 2);
  assert.equal(plan.hops[0].store.contractId, INTERCHAINER.contractId);
  assert.equal(plan.hops[0].store.sends, false);
  assert.equal(plan.payrail.onto, 'alchemy-card');
  assert.match(plan.payrail.checkout.url, /alchemypay\.org/);
  assert.equal(plan.moonpayUuidHash, hashMoonPayUuid(UUID));
});

test('MoonPay UUID hash is 32 bytes and confirmation gates minted disbursement', () => {
  assert.equal(assertMoonPayUuid(UUID), UUID);
  const h = hashMoonPayUuid(UUID);
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.throws(() => assertMoonPayCompleted(UUID), /not confirmed/);
  recordMoonPayConfirmation({ uuid: UUID, status: 'completed' });
  const d = planMintedDisbursement({ asset: 'Q', amount: '1', dest: 'GAMWMZ', moonpayUuid: UUID });
  assert.equal(d.mints, false);
  assert.equal(d.sends, false);
  assert.equal(d.uuidHash, h);
  assert.equal(d.store.humanMustSign, true);
});

test('never mint Circle USDC / BTC / SOL / XLM / ETH', () => {
  for (const asset of ['USDC', 'BTC', 'SOL', 'XLM', 'ETH', 'USDT']) {
    assert.throws(() => assertNotDollarMint(asset), /does not mint|transfer\/on-ramp/);
  }
  assert.equal(assertHopAsset('sol'), 'SOL');
});
