# USDT0 bridge rail (LayerZero OFT)

Human-operable bridge path for **Stellar USDT0**. No AI, no cloud agent required — CLI + docs only. Grok Bot (or any assistant) may streamline; the rail stands alone.

## Two rails in this repo

| Rail | Asset | Protocol | Stellar ↔ Solana |
|------|-------|----------|------------------|
| **CCTP** | Circle USDC | Circle burn/mint | **Direct** (domains 27 ↔ 5) — see `docs/CCTP-SOLANA-POC.md` |
| **USDT0 OFT** | USDT0 (Tether via LayerZero) | LayerZero OFT `quote_send` / `send` | **Not direct** — Stellar OFT has **no Solana peer** (`peer(30168)=null`). Path is Stellar → **Arbitrum** (OFT peer) → USDT0 **Legacy Mesh** → Solana native USDT |

Hard rules (same as CCTP rail):

- Do **not** mint USDT0 / USDT from the anchor.
- Pathway crumbs = digests only; do not `store` unless a human signs.
- Secrets stay in `.env` / the shell — never commit.

## Mainnet addresses (Stellar)

| Surface | Address |
|---------|---------|
| Classic asset | `USDT0:GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q` |
| SAC | `CBSJZEIO5C7KC2SF3MKSNXXJSW5G3VTNBX4ATMKUI3B2MR4JKM4R26YF` |
| OFT | `CBOWOLFSDM5PZXNFIVDMP5NZ7U2GSIHED6H6R446QOHF266XINKUMMF6` |
| EndpointV2 | `CCQLLRE5JBAWYCW3KTWOIWLMFDUOKROQVZNSALQMGOSXNW3ERUOWVZGK` (EID `30600`) |

Verified OFT peers (queried on-chain via `peer(eid)`):

| EID | Chain (LZ V2) | Peer |
|-----|---------------|------|
| `30101` | Ethereum | `0x6C96De32CEa08842dCc4058c14d3aaAd7FA41dEe` |
| `30110` | Arbitrum | `0x14e4A1b13bf7F943c8Ff7c51fb60fA964A298d92` |
| `30168` | Solana | **none** — use Legacy Mesh after Arbitrum |

Solana native USDT (mesh terminus): `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`.

## Precision

- Stellar SAC: **7** decimals.
- OFT shared decimals: **6** (`decimal_conversion_rate = 10`).
- Cross-chain amounts are normalized to 6 decimals; dust in the 7th place stays on Stellar.

## Human flow (outbound Stellar → Arbitrum hop)

1. Trustline already open to `USDT0:GATISXX6…`.
2. Hold USDT0 + XLM for OFT messaging fee.
3. Dry-run quote (no secret required for plan mode):

```bash
node scripts/usdt0-layerzero-poc.cjs
```

4. Live send (human provides secret locally):

```bash
USDT0_BRIDGE_LIVE=1 STELLAR_SOURCE_SECRET=S… \
  DST_EID=30110 TO_BYTES32=<32-byte hex recipient on dest> \
  AMOUNT_LD=5000000 \
  node scripts/usdt0-layerzero-poc.cjs
```

Or with Stellar CLI only (no Node agent):

```bash
stellar contract invoke --id CBOWOLFSDM5PZXNFIVDMP5NZ7U2GSIHED6H6R446QOHF266XINKUMMF6 \
  --source-account S… --network <your-mainnet> -- \
  quote_send --from G… --send_param '\''{...}'\'' --pay_in_zro false

stellar contract invoke … -- send --from G… --send_param '\''{...}'\'' --fee '\''{...}'\'' --refund_address G…
```

5. Track on [LayerZero Scan](https://layerzeroscan.com) by Stellar tx hash.
6. For **Solana**: after USDT0 arrives on Arbitrum, complete Legacy Mesh → Solana USDT via [usdt0.to](https://usdt0.to) (or mesh contracts when wired). Do not pretend a direct OFT peer exists.

## Inbound to Stellar

Destination callers use the peer chain’s OFT `send` with `dstEid = 30600`. On Stellar, credit lands via OFT → SAC mint/burn adapter into the recipient trustline. Still not an alchemy-anchor mint.

## Why this belongs in alchemy-anchor

Alchemy cards / SEP-24 stay the **fiat rail**. Settlement honors existing assets:

- Circle USDC → CCTP when leaving Stellar for Solana (and back).
- USDT0 → LayerZero OFT when leaving Stellar for peer EIDs; Solana via mesh hub.

The anchor app wraps checkout and pathway digests. Humans can run every step with `stellar` CLI + a wallet; agents are optional glue.
