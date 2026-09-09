/**
 * Live IDs from interchain-auditor / pmll. Do not invent a contract ID.
 * This app wraps Alchemy Pay cards. It does not mint a dollar.
 */

export const NETWORK = {
  passphrase: 'Public Global Stellar Network ; September 2015',
  horizon: 'https://horizon.stellar.org',
  rpc: 'https://soroban-rpc.mainnet.stellar.gateway.fm',
  name: 'pubnet',
};

export const PMLL_ANCHOR = {
  contractId: 'CCF3B64AXLS4OLY5RN4H4K2CFZAYNZCJQY5MKCKCVAKMZNH7G7F7XUUF',
  admin: 'GBFOFCD3XDANQWSGMHKJJ2V3YXS2QQD7RNC4LMDBVNBTUJOQZ3RLSB3E',
  methods: Object.freeze(['init', 'store', 'get', 'bump']),
  expert:
    'https://stellar.expert/explorer/public/contract/CCF3B64AXLS4OLY5RN4H4K2CFZAYNZCJQY5MKCKCVAKMZNH7G7F7XUUF',
  role: 'primitive: 32-byte SHA-256 commitments only. Payloads stay off-chain.',
};

export const ASSETS = {
  xlm: 'native',
  usdc: {
    code: 'USDC',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    label: 'Circle USDC (Stellar)',
  },
  usdt0: {
    code: 'USDT0',
    issuer: 'GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q',
    label: 'Stellar USDT0 (optional hop, not the terminus)',
  },
};

/** Circle USDC on Ethereum mainnet. Watcher only — not a second card rail. */
export const ETH_USDC = {
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  transferTopic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  decimals: 6,
  chainId: 1,
};

export const ALCHEMY_PAY = {
  prod: 'https://ramp.alchemypay.org',
  sandbox: 'https://ramptest.alchemypay.org',
  firstSettlement: 'stellar-circle-usdc',
  crypto: 'USDC',
  network: 'XLM',
  fiat: 'USD',
};

/** Robinhood Chain mainnet. Read endpoint only — this process does not sign. */
export const ROBINHOOD_CHAIN = {
  chainId: 4663,
  chainIdHex: '0x1237',
  name: 'robinhood-mainnet',
  http: 'https://rpc.mainnet.chain.robinhood.com',
  explorer: 'https://robinhoodchain.blockscout.com',
  testnetChainId: 46630,
  testnetHttp: 'https://rpc.testnet.chain.robinhood.com',
  note: 'Read RPC. Not a wallet. Not brokerage 3088. Not a mint.',
};

export const INTERCHAINER = {
  contractId: PMLL_ANCHOR.contractId,
  admin: PMLL_ANCHOR.admin,
  hop: 'GAMWMZHAWQWQYB2FDPP3F53DVEYLVNW3Y4Q5GKQXVEZH5OKNYMP3NZN7',
  methods: PMLL_ANCHOR.methods,
  role: 'pmll_anchor_interchainer: each USDC/BTC/SOL/XLM/ETH hop commits 32 bytes, then payrails fund the Alchemy card',
  forge: 'CD6AQDVCZUTKN2HOJ6UEMYCOT72TNM4CQLV2YNT7VFPIHN7UJFDQAFS7',
  assets: Object.freeze(['USDC', 'BTC', 'SOL', 'XLM', 'ETH']),
};

/** Printer-minted assets only. Circle USDC is never minted here. */
export const MINTER = {
  mayMint: Object.freeze(['Q', 'QI']),
  neverMint: Object.freeze(['USDC', 'USDT', 'USDT0', 'BTC', 'SOL', 'XLM', 'ETH']),
  note: 'Disburse of minted Q/QI requires a completed MoonPay transaction UUID. Do not mint a dollar.',
};

export const MOONPAY = {
  transactions: 'https://api.moonpay.com/v1/transactions',
  sandboxTransactions: 'https://api.moonpay.com/v1/transactions',
  completed: 'completed',
  note: 'UUID confirmation is the gate. Secret key stays in .env as MOONPAY_SECRET_KEY.',
};

export const ANCHOR = {
  name: 'alchemy-anchor',
  signingKey: 'GB5SDDZW5LIHIIEAZIVQWNVQDGDV4JJRFCWAU64QW4J2PWO6ZD3PALGJ',
  note: 'Official SCF #45 product. SEP-24 wrap of Alchemy Pay. Card PAN never touches this process. Circle USDC is the terminus.',
};

export const SCF = {
  officialProduct: 'alchemy-anchor',
  repo: 'https://github.com/drQedwards/alchemy-anchor',
  round: 45,
  track: 'Open Track',
  title: 'Secure Memory Persistence in Agentic Wallets',
  interestForm: 'filed',
  award: false,
  dashboard:
    'https://communityfund.stellar.org/dashboard/award-rounds/reccaFUJmN4HNQxvo',
  requestedUsd: 125000,
  capUsd: 150000,
  primitive: 'pmll_anchor',
  auditor: 'https://github.com/drQedwards/interchain-auditor',
  note: 'This repo is the official SCF product. pmll_anchor is the live primitive. interchain-auditor keeps digest books. Not an award.',
};
