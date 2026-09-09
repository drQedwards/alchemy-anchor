import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MOONPAY } from './constants.js';
import { moonpaySecretKey, ROOT } from './config.js';

/** RFC 4122 UUID (MoonPay transaction id / externalTransactionId). */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const storePath = join(ROOT, '.moonpay-confirmations.json');

function loadConfirmed() {
  const map = new Map();
  if (!existsSync(storePath)) return map;
  try {
    const rows = JSON.parse(readFileSync(storePath, 'utf8'));
    for (const row of rows) {
      if (row?.uuid) map.set(row.uuid, row);
      if (row?.uuidHash) map.set(row.uuidHash, row);
    }
  } catch {
    /* ignore corrupt local cache */
  }
  return map;
}

const confirmed = loadConfirmed();

function persist() {
  const uniq = [...new Map([...confirmed.values()].map((r) => [r.uuid, r])).values()];
  writeFileSync(storePath, JSON.stringify(uniq, null, 2));
}

export function assertMoonPayUuid(uuid) {
  const id = String(uuid || '').trim();
  if (!UUID_RE.test(id)) {
    throw new Error(`expected MoonPay UUID, got ${uuid}`);
  }
  return id.toLowerCase();
}

/** 32-byte commitment of the UUID. Raw UUID stays off-chain. */
export function hashMoonPayUuid(uuid) {
  const id = assertMoonPayUuid(uuid);
  return createHash('sha256').update(`moonpay-uuid:${id}`).digest('hex');
}

export function recordMoonPayConfirmation({ uuid, status, source = 'hitl' }) {
  const id = assertMoonPayUuid(uuid);
  const normalized = String(status || '').toLowerCase();
  const ok = normalized === MOONPAY.completed;
  const row = {
    uuid: id,
    uuidHash: hashMoonPayUuid(id),
    status: normalized,
    confirmed: ok,
    source,
    at: new Date().toISOString(),
  };
  confirmed.set(id, row);
  confirmed.set(row.uuidHash, row);
  persist();
  return row;
}

export function getMoonPayConfirmation(uuidOrHash) {
  const key = String(uuidOrHash || '').trim().toLowerCase();
  return confirmed.get(key) || null;
}

export function clearMoonPayConfirmation(uuid) {
  const id = assertMoonPayUuid(uuid);
  const row = confirmed.get(id);
  if (row) {
    confirmed.delete(id);
    confirmed.delete(row.uuidHash);
    persist();
  }
}

export function assertMoonPayCompleted(uuid) {
  const id = assertMoonPayUuid(uuid);
  const row = confirmed.get(id);
  if (!row?.confirmed) {
    throw new Error(`MoonPay UUID ${id} is not confirmed completed. Refuse disbursement.`);
  }
  return row;
}

/**
 * Live lookup when MOONPAY_SECRET_KEY is set.
 * GET /v1/transactions/{uuid} — status must be completed.
 */
export async function fetchMoonPayTransaction(uuid) {
  const id = assertMoonPayUuid(uuid);
  const secret = moonpaySecretKey();
  if (!secret) {
    return {
      uuid: id,
      fetched: false,
      note: 'Set MOONPAY_SECRET_KEY to query MoonPay. Until then, HITL recordMoonPayConfirmation.',
    };
  }
  const res = await fetch(`${MOONPAY.transactions}/${id}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) {
    throw new Error(`MoonPay transaction ${id} → HTTP ${res.status}`);
  }
  const body = await res.json();
  const status = body.status || body.data?.status;
  return recordMoonPayConfirmation({ uuid: id, status, source: 'moonpay-api' });
}
