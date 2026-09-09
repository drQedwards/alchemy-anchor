import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import { challengeTx, tokenFromSignedChallenge, verifyJwt } from '../src/sep10.js';
import { ANCHOR } from '../src/constants.js';

test('SEP-10 challenge is signed by SIGNING_KEY and issues a JWT', () => {
  const client = Keypair.random();
  const xdr = challengeTx(client.publicKey());
  const tx = TransactionBuilder.fromXDR(xdr, Networks.PUBLIC);
  assert.equal(tx.source, ANCHOR.signingKey);
  tx.sign(client);
  const { token, account } = tokenFromSignedChallenge(tx.toXDR());
  assert.equal(account, client.publicKey());
  assert.equal(verifyJwt(token).sub, client.publicKey());
});
