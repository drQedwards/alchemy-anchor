import { MINTER, INTERCHAINER } from './constants.js';
import { assertMoonPayCompleted, hashMoonPayUuid } from './moonpay.js';
import { storeCommand, getCommand } from './store-cmd.js';
import { sha256Hex } from './hash.js';

export function assertNotDollarMint(asset) {
  const code = String(asset || '').toUpperCase();
  if (MINTER.neverMint.includes(code)) {
    throw new Error(`${code} is transfer/on-ramp only. alchemy-anchor does not mint it.`);
  }
  if (!MINTER.mayMint.includes(code)) {
    throw new Error(`unknown mint asset ${asset}. May mint ${MINTER.mayMint.join('/')}.`);
  }
  return code;
}

/**
 * Disburse coins that a minter already minted (Q / QI).
 * Requires a completed MoonPay UUID. Never mints Circle USDC.
 * Prints HITL store of the disbursement digest — does not send.
 */
export function planMintedDisbursement({
  asset,
  amount,
  dest,
  moonpayUuid,
} = {}) {
  const code = assertNotDollarMint(asset);
  const confirmation = assertMoonPayCompleted(moonpayUuid);
  const payload = [
    `disburse asset=${code} amount=${amount || ''} dest=${dest || ''}`,
    `moonpay=${confirmation.uuidHash} minter=onchain interchainer=${INTERCHAINER.contractId}`,
  ].join('\n');
  const commitment = sha256Hex(payload);
  const id = sha256Hex(Buffer.from(commitment, 'hex'));
  return {
    asset: code,
    amount: amount ? String(amount) : undefined,
    dest,
    moonpay: confirmation,
    uuidHash: hashMoonPayUuid(moonpayUuid),
    commitment,
    id,
    store: storeCommand({ id, commitment }),
    get: getCommand(id),
    sends: false,
    mints: false,
    note: 'MoonPay UUID completed. HITL store on pmll_anchor. Human signs. Not a dollar mint.',
  };
}
