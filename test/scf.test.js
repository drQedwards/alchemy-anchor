import test from 'node:test';
import assert from 'node:assert/strict';
import { ANCHOR, PMLL_ANCHOR, SCF } from '../src/constants.js';

test('alchemy-anchor is the official SCF product and is not an award', () => {
  assert.equal(SCF.officialProduct, 'alchemy-anchor');
  assert.equal(SCF.officialProduct, ANCHOR.name);
  assert.equal(SCF.round, 45);
  assert.equal(SCF.track, 'Open Track');
  assert.equal(SCF.award, false);
  assert.equal(SCF.interestForm, 'filed');
  assert.equal(SCF.requestedUsd, 125000);
  assert.equal(SCF.capUsd, 150000);
  assert.equal(SCF.primitive, 'pmll_anchor');
  assert.equal(PMLL_ANCHOR.contractId, 'CCF3B64AXLS4OLY5RN4H4K2CFZAYNZCJQY5MKCKCVAKMZNH7G7F7XUUF');
  assert.match(SCF.repo, /alchemy-anchor/);
});
