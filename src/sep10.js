import { createHmac } from 'node:crypto';
import { Keypair, Networks, WebAuth } from '@stellar/stellar-sdk';
import { ANCHOR } from './constants.js';
import { optionalEnv, requireEnv } from './config.js';

function signingKeypair() {
  return Keypair.fromSecret(requireEnv('STELLAR_SIGNING_SECRET'));
}

function homeDomain() {
  return optionalEnv('HOME_DOMAIN', 'localhost:8787');
}

function jwtSecret() {
  return requireEnv('JWT_SECRET');
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export function issueJwt(sub, extra = {}) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({
      iss: homeDomain(),
      sub,
      iat: now,
      exp: now + 15 * 60,
      ...extra,
    }),
  );
  const sig = b64url(createHmac('sha256', jwtSecret()).update(`${header}.${payload}`).digest());
  return `${header}.${payload}.${sig}`;
}

export function verifyJwt(token) {
  if (!token) throw new Error('missing JWT');
  const raw = String(token).replace(/^Bearer\s+/i, '');
  const [header, payload, sig] = raw.split('.');
  if (!header || !payload || !sig) throw new Error('malformed JWT');
  const expected = b64url(
    createHmac('sha256', jwtSecret()).update(`${header}.${payload}`).digest(),
  );
  if (expected !== sig) throw new Error('invalid JWT signature');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) throw new Error('JWT expired');
  return claims;
}

export function challengeTx(account, clientDomain) {
  const kp = signingKeypair();
  if (kp.publicKey() !== ANCHOR.signingKey) {
    throw new Error(
      `STELLAR_SIGNING_SECRET does not match SIGNING_KEY ${ANCHOR.signingKey} in stellar.toml`,
    );
  }
  return WebAuth.buildChallengeTx(
    kp,
    account,
    homeDomain(),
    300,
    Networks.PUBLIC,
    homeDomain(),
    null,
    clientDomain || null,
  );
}

export function tokenFromSignedChallenge(transactionXdr) {
  const kp = signingKeypair();
  const { clientAccountID } = WebAuth.readChallengeTx(
    transactionXdr,
    kp.publicKey(),
    Networks.PUBLIC,
    homeDomain(),
    homeDomain(),
  );
  WebAuth.verifyChallengeTxSigners(
    transactionXdr,
    kp.publicKey(),
    Networks.PUBLIC,
    [clientAccountID],
    homeDomain(),
    homeDomain(),
  );
  return { token: issueJwt(clientAccountID), account: clientAccountID };
}

export function bearerAccount(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  const claims = verifyJwt(header);
  return claims.sub;
}
