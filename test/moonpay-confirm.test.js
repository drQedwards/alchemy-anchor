import test from "node:test";
import assert from "node:assert/strict";
import { confirmMintedDisbursement, isMoonPayUuid } from "../src/moonpay-confirm.js";

const UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

test("rejects a minted disbursement without a MoonPay UUID", () => {
  const result = confirmMintedDisbursement({
    uuid: "",
    transaction: { id: UUID, status: "completed" },
    asset: "Q",
  });
  assert.equal(result.ok, false);
});

test("confirms a completed MoonPay retrieve for a minted asset", () => {
  assert.equal(isMoonPayUuid(UUID), true);
  const result = confirmMintedDisbursement({
    uuid: UUID,
    transaction: { id: UUID, status: "completed", externalTransactionId: "hop-1" },
    asset: "Q",
  });
  assert.equal(result.ok, true);
  assert.equal(result.uuid, UUID);
  assert.equal(result.asset, "Q");
});

test("refuses Circle USDC as a minted disbursement", () => {
  const result = confirmMintedDisbursement({
    uuid: UUID,
    transaction: { id: UUID, status: "completed" },
    asset: "USDC",
  });
  assert.equal(result.ok, false);
});

test("refuses a pending MoonPay transaction", () => {
  const result = confirmMintedDisbursement({
    uuid: UUID,
    transaction: { id: UUID, status: "pending" },
    asset: "QI",
  });
  assert.equal(result.ok, false);
});
