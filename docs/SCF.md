# SCF #45 — official product: alchemy-anchor

**This repository is the official SCF project.**

**Submitter:** Josef K. Edwards (`drQedwards`) · individual · no referral
**Interest-form title:** Secure Memory Persistence in Agentic Wallets
**Public product:** `alchemy-anchor` (this repo)
**Track:** Open Track
**Requested budget:** $125,000 worth of XLM (Build Award cap is $150,000)
**Round:** [SCF #45](https://communityfund.stellar.org/dashboard/award-rounds/reccaFUJmN4HNQxvo)
**Status:** interest form submitted. This file is the public technical brief.
This is **not** a claim that the project has been awarded.

## One sentence

A hosted Stellar SEP-24 payment anchor that wraps Alchemy Pay cards, settles
Circle USDC (never mints), and commits only a 32-byte XDR digest to the live
Soroban primitive `pmll_anchor` so an agentic wallet can cite the card trail
without putting payment details on-chain.

## Why this repo, not the auditor

| Repo | Role |
|---|---|
| **[alchemy-anchor](https://github.com/drQedwards/alchemy-anchor)** | **Official SCF product.** The app wallets open. |
| [pmll](https://github.com/drQedwards/pmll) | Live primitive `pmll_anchor` (`CCF3B64A…XUUF`). |
| [interchain-auditor](https://github.com/drQedwards/interchain-auditor) | Digest books. Horizon scout. Not the product. |

Alchemy Pay's 2023 Stellar ramp is a hosted plugin, not a directory listing a
wallet can point at. The SCF product is the SEP-24 host we build.

## Open Track fit

Handbook: *experienced builders exploring novel use cases on Stellar or
Soroban; financial protocols and primitives that unlock on-chain growth.*

This is not a wallet-SDK wrap of a listed Integration Track ramp. Alchemy Pay
is not on the current [Integration List](https://stellar.gitbook.io/scf-handbook/scf-awards/build-award/integration-track/integration-list).
The novel piece is a **card trail that can only persist as a human-authorized
32-byte commitment**.

What we *use* from the ecosystem, without calling this an Integration Track
submission:

- Circle USDC on Stellar (`GA5ZSEJY…KZVN`) as terminus
- SEP-24 / SEP-10 as the wallet protocol
- optional Stellar USDT0 hop (LayerZero OFT)
- already-live `pmll_anchor`

## How it drives on-chain growth

| Signal | Why it matters | How we measure |
|---|---|---|
| SEP-24 deposits completed | real card → Stellar USDC | `GET /sep24/transactions` + Horizon payments |
| XDR digests `store`d on CCF3 | auditable card trail, no PAN | events `(pmll, anchor)` + RPC `get` |
| Human-refused stores | HITL is working | operator log of `get` mismatches |
| Circle USDC received, not minted | honors existing issuer | Horizon asset + Circle attestation |

Grant settlement: SCF pays **XLM**. Pair that XLM on the live **XLM/USDC**
book (Circle issuer `GA5ZSEJY…KZVN`, prefer 0 hops). There is no `USDC0`.
`USDT0` stays an optional hop.

## Requested $125,000 — tranche map

Handbook structure 10 / 20 / 30 / 40. Timeline ≤ 6 months.

| Tranche | % | USD-eq | Deliverable |
|---|---|---|---|
| **#0** | 10% | $12,500 | Award acceptance. Operator runbook. Keys remain human-held. |
| **#1 MVP** | 20% | $25,000 | Public SEP-24 host (this repo): Alchemy Pay wrap, unsigned sandbox, HITL `store`. Threat-model draft. |
| **#2 Testnet+** | 30% | $37,500 | Signed Alchemy Pay sandbox, Horizon watcher, ETH USDC watcher, HITL certification (agent cannot `store`). |
| **#3 Mainnet** | 40% | $50,000 | Production `stellar.toml`, HTTPS origin, measured deposits + `store`/`get` volume. **`pmll_anchor` is already live**; this tranche is the payment app + safety, not a first contract deploy. |

## AI disclosure

Agents assist with documentation, demos, and repo hygiene. They do not hold
the admin key, do not invent contract IDs, do not charge cards, and do not
submit SCF forms.

## What we will not do

- Invent or placeholder a Soroban contract ID.
- Store card PAN, CVV, KYC, or Alchemy Pay order JSON on-chain.
- Mint a dollar. Circle USDC is the terminus.
- Treat `eth-mainnet.g.alchemy.com` as a card rail. It is a watcher.
- Hand the admin seed to an agent.
- Claim a $125,000 award that has not been voted.
