require("dotenv").config();

function requireApiKey() {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    console.error("Missing ALCHEMY_API_KEY.");
    console.error("Create a .env file with ALCHEMY_API_KEY=<your-key> (see .env.example).");
    process.exit(1);
  }
  return apiKey;
}

function rpcUrl() {
  return `https://eth-mainnet.g.alchemy.com/v2/${requireApiKey()}`;
}

const PMLL_ANCHOR = "CCF3B64AXLS4OLY5RN4H4K2CFZAYNZCJQY5MKCKCVAKMZNH7G7F7XUUF";
const PMLL_FORGE = "CD6AQDVCZUTKN2HOJ6UEMYCOT72TNM4CQLV2YNT7VFPIHN7UJFDQAFS7";

/** Classic Stellar asset (code:issuer). Humans honor this; the anchor never mints it. */
const USDT0 = "USDT0:GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q";
const USDT0_ISSUER = "GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q";
const USDT0_SAC = "CBSJZEIO5C7KC2SF3MKSNXXJSW5G3VTNBX4ATMKUI3B2MR4JKM4R26YF";
/** LayerZero OFT on Stellar — quote_send / send. Not Circle CCTP. */
const USDT0_OFT = "CBOWOLFSDM5PZXNFIVDMP5NZ7U2GSIHED6H6R446QOHF266XINKUMMF6";
const LZ_ENDPOINT_STELLAR = "CCQLLRE5JBAWYCW3KTWOIWLMFDUOKROQVZNSALQMGOSXNW3ERUOWVZGK";
const LZ_EID_STELLAR = 30600;
/** Verified OFT peers on mainnet (null = no peer). Solana 30168 has no direct peer. */
const USDT0_OFT_PEERS = {
  30101: "0x6C96De32CEa08842dCc4058c14d3aaAd7FA41dEe", // Ethereum
  30110: "0x14e4A1b13bf7F943c8Ff7c51fb60fA964A298d92", // Arbitrum (Legacy Mesh hub)
  30109: "0x6Ba10300f0dC58B7a1e4C0e41f5daBb7D7829E13",
  30111: "0xf03b4d9ac1d5d1e7c4cef54c2a313b9fe051a0ad",
  30320: "0xc07be8994d035631c36fb4a89c918cefb2f03ec3",
  30367: "0x904861a24f30ec96ea7cfc3be9ea4b476d237e98",
};

module.exports = {
  requireApiKey,
  rpcUrl,
  PMLL_ANCHOR,
  PMLL_FORGE,
  USDT0,
  USDT0_ISSUER,
  USDT0_SAC,
  USDT0_OFT,
  LZ_ENDPOINT_STELLAR,
  LZ_EID_STELLAR,
  USDT0_OFT_PEERS,
};
