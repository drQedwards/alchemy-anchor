import test from 'node:test';
import assert from 'node:assert/strict';
import { commitCardTrail, hashEnvelopeXdr, sha256Hex, as0x } from '../src/hash.js';
import { storeCommand } from '../src/store-cmd.js';
import { PMLL_ANCHOR } from '../src/constants.js';

test('sha256Hex is 64 hex chars', () => {
  const h = sha256Hex('alchemy-anchor');
  assert.match(h, /^[0-9a-f]{64}$/);
});

test('envelope hash is 32 bytes and stable', () => {
  const xdr = Buffer.from('stellar-envelope-fixture').toString('base64');
  const a = hashEnvelopeXdr(xdr);
  const b = hashEnvelopeXdr(` ${xdr}\n`);
  assert.equal(a.commitment, b.commitment);
  assert.match(a.commitment, /^[0-9a-f]{64}$/);
});

test('card trail never puts PAN on the commitment input', () => {
  const xdr = Buffer.from('payment-envelope').toString('base64');
  const trail = commitCardTrail({
    xdrBase64: xdr,
    txHash: 'aa'.repeat(32),
    account: 'GABC',
    amount: '25',
    orderId: 'ord-1',
  });
  assert.doesNotMatch(trail.payload, /4[0-9]{12,15}/);
  assert.equal(trail.commitment, hashEnvelopeXdr(xdr).commitment);
  assert.match(trail.id, /^[0-9a-f]{64}$/);
});

test('HITL store command points at live pmll_anchor and does not send', () => {
  const id = '11'.repeat(32);
  const commitment = '22'.repeat(32);
  const cmd = storeCommand({ id, commitment });
  assert.equal(cmd.sends, false);
  assert.equal(cmd.humanMustSign, true);
  assert.equal(cmd.contractId, PMLL_ANCHOR.contractId);
  assert.match(cmd.command, /store/);
  assert.match(cmd.command, new RegExp(PMLL_ANCHOR.contractId));
  assert.equal(as0x(id), cmd.id);
});
