import test from 'node:test';
import assert from 'node:assert/strict';
import { signParams, wrapAlchemyPay, checkoutParams } from '../src/alchemy-pay.js';
import { ALCHEMY_PAY } from '../src/constants.js';

test('sign is HMAC-SHA256 over sorted k=v and omits empty fields', () => {
  const secret = 'test-secret';
  const a = signParams({ b: '2', a: '1', sign: 'nope', empty: '' }, secret);
  const b = signParams({ a: '1', b: '2' }, secret);
  assert.equal(a, b);
  assert.equal(a, '7H/m4VJGMOG78zO/ZAvVvP3bJ/4tEi8YMu5Gvhf+ybc=');
});

test('wrap defaults to Stellar Circle USDC sandbox and never embeds a node key', () => {
  const wrap = wrapAlchemyPay({ account: 'GTEST', amount: '25' });
  assert.equal(wrap.rail, 'alchemy-pay');
  assert.equal(wrap.settlement, ALCHEMY_PAY.firstSettlement);
  assert.match(wrap.url, /^https:\/\/ramptest\.alchemypay\.org\?/);
  assert.match(wrap.url, /crypto=USDC/);
  assert.match(wrap.url, /network=XLM/);
  assert.match(wrap.url, /address=GTEST/);
  assert.doesNotMatch(wrap.url, /alch_/);
  assert.equal(wrap.signed, false);
});

test('checkout params include timestamp and buy table', () => {
  const p = checkoutParams({ account: 'GTEST', amount: 10, appId: 'app' });
  assert.equal(p.showTable, 'buy');
  assert.equal(p.fiat, 'USD');
  assert.ok(p.timestamp);
});
