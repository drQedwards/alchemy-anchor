#!/usr/bin/env node
/**
 * CCTP inbound Stellar — mint_and_forward dry-run / live.
 * Default: dry plan only. Live only when CCTP_LIVE=1 + MESSAGE + ATTESTATION set.
 * Invokes CctpForwarder (not TokenMessengerMinter). Never prints secrets.
 *
 *   node scripts/cctp-mint-and-forward.cjs
 *   CCTP_LIVE=1 MESSAGE=0x… ATTESTATION=0x… STELLAR_SOURCE_SECRET=S… node scripts/cctp-mint-and-forward.cjs
 *
 * See docs/CCTP-MINT-AND-FORWARD.md
 */
try {
  require("dotenv").config();
} catch (_) {}

const { spawnSync } = require("child_process");

const live = process.env.CCTP_LIVE === "1";
const FORWARDER =
  process.env.CCTP_FORWARDER ||
  "CBZL2IH7F6BIDAA3WBNXYKIXSATJGMSW7K5P5MJ6STX5RXN47TZJDF5T";
const TOKEN_MESSENGER =
  process.env.CCTP_TOKEN_MESSENGER ||
  "CAE2G5Z77UP7GYPYGFOWFGW7C7J6I4YP2AFGSADRKQY62SYUFLPNFTXL";
const MESSAGE_TRANSMITTER =
  process.env.CCTP_MESSAGE_TRANSMITTER ||
  "CACMENFFJPJMSDAJQLX4R7K3SFZIW2LJSE3R2UMLGSWHFHS353FVXAZV";
const USDC_SAC =
  process.env.USDC_SAC ||
  "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
const USDCALLCCTP =
  process.env.USDCALLCCTP ||
  "USDCALLCCTP:GB3UMCNEOACBUEQVDASNHXR54QWPHC2YYRR2FT2RII23QUTTUNVXACIN";
const DOMAIN_STELLAR = 27;
const forwardRecipient =
  process.env.FORWARD_RECIPIENT ||
  "GAMWMZHAWQWQYB2FDPP3F53DVEYLVNW3Y4Q5GKQXVEZH5OKNYMP3NZN7";
const network = process.env.STELLAR_NETWORK || "Public";
const sourceAccount = process.env.STELLAR_SOURCE_ACCOUNT || "";
const hasMessage = Boolean(process.env.MESSAGE || process.env.CCTP_MESSAGE);
const hasAttestation = Boolean(
  process.env.ATTESTATION || process.env.CCTP_ATTESTATION
);
const message = process.env.MESSAGE || process.env.CCTP_MESSAGE || "";
const attestation =
  process.env.ATTESTATION || process.env.CCTP_ATTESTATION || "";

function strip0x(h) {
  return String(h || "").replace(/^0x/i, "");
}

const plan = {
  mode: live ? "LIVE" : "dry",
  rail: "CCTP-V2-inbound-Stellar",
  domain: DOMAIN_STELLAR,
  invoke: {
    contract: FORWARDER,
    method: "mint_and_forward",
    args: ["message: Bytes", "attestation: Bytes"],
  },
  related: {
    TokenMessengerMinter: TOKEN_MESSENGER,
    MessageTransmitter: MESSAGE_TRANSMITTER,
    usdcSac: USDC_SAC,
    usdcAllCctp: USDCALLCCTP,
  },
  prerequisites: {
    sourceBurn: {
      mintRecipient: "CctpForwarder (32-byte contract encoding)",
      destinationCaller: "same as mintRecipient",
      destinationDomain: DOMAIN_STELLAR,
      hookData: `forwardRecipient strkey UTF-8 (${forwardRecipient})`,
    },
    iris: "Poll Circle Iris for message + attestation after burn",
  },
  forwardRecipient,
  inputsPresent: { message: hasMessage, attestation: hasAttestation },
  humanCli: [
    "stellar contract invoke \\",
    `  --network ${network} \\`,
    "  --source-account <FEE_PAYER_G…> \\",
    `  --id ${FORWARDER} \\`,
    "  -- \\",
    "  mint_and_forward \\",
    "  --message $MESSAGE_HEX \\",
    "  --attestation $ATTESTATION_HEX",
  ].join("\n"),
  hardRules: [
    "Do not set mintRecipient to a G… account on the source burn — funds stuck forever.",
    "This script does not mint alchemy assets; Circle CCTP mints Circle USDC only.",
    "Fee payer only pays XLM fees; no Drips treasury secret.",
  ],
};

console.log(JSON.stringify(plan, null, 2));

if (!live) {
  console.log(
    JSON.stringify(
      {
        dryRun: true,
        hint: "Set CCTP_LIVE=1 MESSAGE=… ATTESTATION=… STELLAR_SOURCE_ACCOUNT=G… (or secret via stellar keys) to submit",
      },
      null,
      2
    )
  );
  process.exit(0);
}

if (!hasMessage || !hasAttestation) {
  console.error("LIVE requires MESSAGE and ATTESTATION (hex, optional 0x prefix).");
  process.exit(2);
}
if (!sourceAccount && !process.env.STELLAR_SOURCE_SECRET) {
  console.error(
    "LIVE requires STELLAR_SOURCE_ACCOUNT=G… (CLI identity) or a configured stellar key."
  );
  process.exit(2);
}

const msgHex = strip0x(message);
const attHex = strip0x(attestation);
const args = [
  "contract",
  "invoke",
  "--network",
  network,
  "--id",
  FORWARDER,
  "--",
  "mint_and_forward",
  "--message",
  msgHex,
  "--attestation",
  attHex,
];
if (sourceAccount) {
  args.splice(4, 0, "--source-account", sourceAccount);
}

console.log(
  JSON.stringify(
    { running: "stellar", args: args.map((a) => (a.length > 24 ? a.slice(0, 12) + "…" : a)) },
    null,
    2
  )
);

const r = spawnSync("stellar", args, {
  encoding: "utf8",
  env: process.env,
  stdio: ["ignore", "pipe", "pipe"],
});
if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
process.exit(r.status === null ? 1 : r.status);
