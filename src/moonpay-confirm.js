/**
 * MoonPay transaction-UUID confirmation for minter disbursements.
 *
 * Tooling: MoonPay transactions retrieve (transaction id is a UUID).
 * A minted-coin disbursement is refused unless that retrieve comes back
 * completed and the id matches. This module does not mint and does not send.
 * Circle USDC is transfer-only and is never a minted disbursement.
 */
"use strict";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const COMPLETED = new Set(["completed", "complete"]);

export function isMoonPayUuid(value) {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

export function confirmMintedDisbursement({ uuid, transaction, asset }) {
  const id = typeof uuid === "string" ? uuid.trim() : "";
  if (!isMoonPayUuid(id)) {
    return { ok: false, reason: "MoonPay transaction UUID is required before a minted disbursement" };
  }
  if (!transaction || typeof transaction !== "object") {
    return { ok: false, reason: "MoonPay transactions retrieve result is required" };
  }
  const got = String(transaction.id || transaction.transactionId || "").trim();
  if (got.toLowerCase() !== id.toLowerCase()) {
    return { ok: false, reason: "retrieved MoonPay id does not match the confirmation UUID" };
  }
  const status = String(transaction.status || "").trim().toLowerCase();
  if (!COMPLETED.has(status)) {
    return { ok: false, reason: `MoonPay transaction is not completed (${status || "missing"})` };
  }
  const code = String(asset || "").trim().toUpperCase();
  if (code === "USDC") {
    return { ok: false, reason: "Circle USDC is transfer-only and is not a minted disbursement" };
  }
  if (!code) {
    return { ok: false, reason: "minted asset code is required" };
  }
  return {
    ok: true,
    uuid: id,
    asset: code,
    status,
    externalTransactionId: transaction.externalTransactionId || null,
  };
}
