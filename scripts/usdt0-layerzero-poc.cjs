#!/usr/bin/env node
/**
 * USDT0 LayerZero OFT PoC — human-runnable.
 * Default: dry plan + optional on-chain quote_send via `stellar` CLI.
 * Live send only when USDT0_BRIDGE_LIVE=1 and STELLAR_SOURCE_SECRET is set.
 * Never prints secrets.
 */
const { spawnSync } = require("child_process");
const {
  USDT0,
  USDT0_SAC,
  USDT0_OFT,
  LZ_EID_STELLAR,
  USDT0_OFT_PEERS,
} = require("../src/config");

const live = process.env.USDT0_BRIDGE_LIVE === "1";
const dstEid = Number(process.env.DST_EID || "30110"); // Arbitrum hub default
const amountLd = process.env.AMOUNT_LD || "5000000"; // 0.5 USDT0 (7 dec)
const minAmountLd = process.env.MIN_AMOUNT_LD || amountLd;
const to =
  process.env.TO_BYTES32 ||
  "000000000000000000000000000000000000000000000000000000000000dead";
const from =
  process.env.STELLAR_FROM ||
  "GAMWMZHAWQWQYB2FDPP3F53DVEYLVNW3Y4Q5GKQXVEZH5OKNYMP3NZN7";
const rpc = process.env.STELLAR_RPC_URL || "https://mainnet.sorobanrpc.com";
const passphrase =
  process.env.STELLAR_NETWORK_PASSPHRASE ||
  "Public Global Stellar Network ; September 2015";

function peerNote(eid) {
  const p = USDT0_OFT_PEERS[eid];
  if (eid === 30168) {
    return "NO direct OFT peer — Solana uses Legacy Mesh via Arbitrum (30110)";
  }
  return p ? `peer ${p}` : "no peer configured on Stellar OFT";
}

const sendParam = {
  amount_ld: String(amountLd),
  compose_msg: "",
  dst_eid: dstEid,
  extra_options: "",
  min_amount_ld: String(minAmountLd),
  oft_cmd: "",
  to,
};

console.log(
  JSON.stringify(
    {
      mode: live ? "LIVE" : "dry",
      rail: "USDT0-LayerZero-OFT",
      asset: USDT0,
      sac: USDT0_SAC,
      oft: USDT0_OFT,
      stellarEid: LZ_EID_STELLAR,
      dstEid,
      peer: peerNote(dstEid),
      sendParam,
      solanaNote:
        "Stellar OFT peer(30168)=null. For Solana USDT, OFT to Arbitrum 30110 then Legacy Mesh.",
      humanCli: "stellar contract invoke — see docs/USDT0-LAYERZERO-BRIDGE.md",
    },
    null,
    2
  )
);

if (!(dstEid in USDT0_OFT_PEERS) && dstEid !== 30168) {
  console.error(`\
Blocked: dst_eid ${dstEid} has no known peer on Stellar USDT0 OFT.`);
  process.exit(2);
}
if (dstEid === 30168) {
  console.error("\
Blocked: cannot OFT-send directly to Solana. Use DST_EID=30110 (Arbitrum) first.");
  process.exit(2);
}

function stellarInvoke(args, { send = false } = {}) {
  const base = [
    "contract",
    "invoke",
    "--id",
    USDT0_OFT,
    "--rpc-url",
    rpc,
    "--network-passphrase",
    passphrase,
    "--source-account",
    live && process.env.STELLAR_SOURCE_SECRET
      ? process.env.STELLAR_SOURCE_SECRET
      : from,
  ];
  if (send) base.push("--send=yes");
  base.push("--", ...args);
  const r = spawnSync("stellar", base, { encoding: "utf8" });
  const out = (r.stdout || "") + (r.stderr || "");
  return { code: r.status ?? 1, out: out.replace(/S[A-Z0-9]{50,}/g, "S***") };
}

console.log("\
— quote_send (read-only simulation) —");
const quote = stellarInvoke([
  "quote_send",
  "--from",
  from,
  "--send_param",
  JSON.stringify(sendParam),
  "--pay_in_zro",
  "false",
]);
process.stdout.write(quote.out);
if (quote.code !== 0) process.exit(quote.code);

if (!live) {
  console.log("\
Dry run only. Set USDT0_BRIDGE_LIVE=1 and STELLAR_SOURCE_SECRET to send.");
  process.exit(0);
}

if (!process.env.STELLAR_SOURCE_SECRET) {
  console.error("USDT0_BRIDGE_LIVE=1 requires STELLAR_SOURCE_SECRET.");
  process.exit(1);
}

// Parse native_fee from quote output JSON line
const feeMatch = quote.out.match(/\\{\\s*"native_fee"\\s*:\\s*"(\\d+)"/);
const nativeFee = feeMatch ? feeMatch[1] : null;
if (!nativeFee) {
  console.error("Could not parse native_fee from quote_send.");
  process.exit(1);
}
const fee = { native_fee: nativeFee, zro_fee: "0" };

console.log("\
— send (LIVE) —");
const sent = stellarInvoke(
  [
    "send",
    "--from",
    from,
    "--send_param",
    JSON.stringify(sendParam),
    "--fee",
    JSON.stringify(fee),
    "--refund_address",
    from,
  ],
  { send: true }
);
process.stdout.write(sent.out);
process.exit(sent.code);
