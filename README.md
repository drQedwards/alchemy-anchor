# Alchemy anchor

Stellar SEP-24 payment anchor app. Wallets authenticate with SEP-10, then open Alchemy checkout. Alchemy Pay charges the card. We honor existing issued assets and never mint.

## Setup

Create a `.env` file in this directory:

```bash
cp .env.example .env
```

Then set:

```
ALCHEMY_API_KEY=<your-key>
```

The Node RPC demo reads `process.env.ALCHEMY_API_KEY` via dotenv. Do not hard-code the key. `.env` is gitignored.

## Run the Node RPC demo

```bash
npm install
npm run demo
```

The script calls Ethereum mainnet at `https://eth-mainnet.g.alchemy.com/v2/$ALCHEMY_API_KEY` and prints:

- `eth_chainId` as hex and decimal. `0x1` / `1` means Ethereum mainnet.
- `eth_blockNumber` is the latest block the node sees. It only proves the endpoint is live.
- `eth_gasPrice` is a fee-market read. The script does not send a transaction.

## Anchor shape

- Card rail: wrap Alchemy Pay cards. Card data stays with the processor.
- First settlement: Alchemy Pay buys XLM or USDC on Stellar and sends it to the wallet.
- After the Stellar payment lands, hash the XDR envelope and store only that 32-byte digest on pmll-anchor `CCF3B64AXLS4OLY5RN4H4K2CFZAYNZCJQY5MKCKCVAKMZNH7G7F7XUUF`.
- The Ethereum RPC watches Circle USDC deposits. It is not a second card rail.
- Optional honored Stellar asset: `USDT0:GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q`.

`npm start` prints that contract. It does not deploy, spend, or open a public URL.

Alchemy Pay merchant credentials are placeholders (`ALCHEMY_PAY_APP_ID`, `ALCHEMY_PAY_APP_SECRET`) until those are provisioned.

## Bridge rails (USDC vs USDT0)

| Rail | Docs | Script |
|------|------|--------|
| Circle USDC ↔ Solana (CCTP) | [docs/CCTP-SOLANA-POC.md](docs/CCTP-SOLANA-POC.md) | `scripts/cctp-stellar-to-solana-poc.mjs` |
| USDT0 via LayerZero OFT | [docs/USDT0-LAYERZERO-BRIDGE.md](docs/USDT0-LAYERZERO-BRIDGE.md) | `scripts/usdt0-layerzero-poc.cjs` |
| Drips Wave grant (USDC payout enqueue) | [docs/DRIPS-WAVE-GRANT.md](docs/DRIPS-WAVE-GRANT.md) | `scripts/drips-wave-grant.cjs` |

Both rails are **human-operable** (`stellar` CLI + wallet). Assistants are optional glue; the anchor must not depend on cloud agents or AI to function.

