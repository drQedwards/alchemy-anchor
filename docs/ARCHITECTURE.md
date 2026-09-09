# Architecture

Official SCF #45 product: **alchemy-anchor**. Interest form filed. Not an award.

```
  Wallet                         alchemy-anchor                      Alchemy Pay
    │                                  │                                  │
    │  SEP-10 GET/POST /auth           │                                  │
    │─────────────────────────────────►│                                  │
    │  JWT                             │                                  │
    │◄─────────────────────────────────│                                  │
    │  POST /sep24/.../deposit         │                                  │
    │─────────────────────────────────►│  wrap checkout URL (signed)      │
    │  interactive URL                 │─────────────────────────────────►│
    │◄─────────────────────────────────│                                  │
    │  open hosted page / iframe       │          card PAN stays here     │
    │─────────────────────────────────►│◄─────────────────────────────────│
    │                                  │  Stellar USDC (or XLM) payment   │
    │                                  │◄──────── Horizon ────────────────│
    │                                  │  SHA-256(envelope XDR)           │
    │                                  │  HITL pmll_anchor.store          │
```

## Rails

| Piece | Role |
|---|---|
| Alchemy Pay hosted checkout | Card rail. PAN never hits this process. |
| Stellar Circle USDC (`GA5ZSEJY…KZVN`) | First settlement path. Not minted here. |
| `eth-mainnet.g.alchemy.com` | Optional Ethereum watcher for Circle USDC `Transfer` logs. Not a card rail. |
| `pmll_anchor` `CCF3B64A…XUUF` | 32-byte SHA-256 commitments only. Human signs `store`. |

## What is not on-chain

Card number, CVV, email, KYC documents, Alchemy Pay order JSON. Only the XDR digest is eligible for `store`.

## HITL

`src/store-cmd.js` prints `stellar contract invoke … store`. It does not send.
Always `get` after `store` and refuse a mismatched digest.

## Interchainer + payrails + MoonPay UUID

```
  USDC / BTC / SOL / XLM / ETH
            │
            ▼
  pmll_anchor_interchainer (plan hops, HITL store)
            │
            ▼
  Alchemy Pay wrap  →  Alchemy card
            │
  minted Q/QI only  →  MoonPay UUID must be completed
            │
            ▼
  alchemy_anchor.route  requires  pmll_anchor.get(id) == commitment
```

Robinhood Chain RPC (`4663`) is a **read** endpoint. This process does not sign
or send on that chain from the CLI.

Disbursement of minted coins (Quorum Q / Qinterchain QI) is gated by
`recordMoonPayConfirmation` / `GET /v1/transactions/{uuid}` with status
`completed`. Circle USDC is never minted.
