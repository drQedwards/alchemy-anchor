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

export const ANCHOR = {
  name: 'alchemy-anchor',
  signingKey: 'GB5SDDZW5LIHIIEAZIVQWNVQDGDV4JJRFCWAU64QW4J2PWO6ZD3PALGJ',
  note: 'SEP-24 wrap of Alchemy Pay. Card PAN never touches this process. Circle USDC is the terminus.',
};
