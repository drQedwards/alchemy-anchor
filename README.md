# alchemy-anchor

**Stellar SEP-24 payment anchor that wraps Alchemy Pay cards.**

Honors existing Circle USDC. Never mints a dollar. After the Stellar payment
lands, hash the XDR envelope and commit that 32-byte digest to
[`pmll_anchor`](https://stellar.expert/explorer/public/contract/CCF3B64AXLS4OLY5RN4H4K2CFZAYNZCJQY5MKCKCVAKMZNH7G7F7XUUF).

Alchemy Pay's 2023 Stellar ramp is a hosted plugin, not a directory listing a
wallet can point at. This repo is the SEP-24 host.

| | |
|---|---|
| Rail | Alchemy Pay hosted checkout (cards stay on the processor) |
| First settlement | Circle USDC on Stellar (`GA5ZSEJY…KZVN`) |
| Optional hop | Stellar USDT0, XLM |
| Ethereum RPC | Watcher only — `eth-mainnet.g.alchemy.com` is **not** the card API |
| Primitive | `CCF3B64AXLS4OLY5RN4H4K2CFZAYNZCJQY5MKCKCVAKMZNH7G7F7XUUF` |
| Repo | https://github.com/drQedwards/alchemy-anchor |

## 1. Create `.env`

Never hard-code the key. Copy the example and fill it in:

```bash
cp .env.example .env
```

Then edit `.env`:

```
ALCHEMY_API_KEY=<your Alchemy dashboard key>
STELLAR_SIGNING_SECRET=<S… matching SIGNING_KEY in stellar.toml>
JWT_SECRET=<long random>
```

`ALCHEMY_API_KEY` is the **node** key (`eth-mainnet.g.alchemy.com` /
`solana-mainnet.g.alchemy.com`). It does not charge a card.

Alchemy Pay merchant credentials are separate:

```
ALCHEMY_PAY_APP_ID=<from merchants.alchemypay.org>
ALCHEMY_PAY_SECRET=<ramp signing secret>
ALCHEMY_PAY_ENV=sandbox
```

Without those two, `/wrap` still returns an unsigned sandbox URL so SEP-24 can
be exercised locally.

## 2. Install and test

```bash
npm install
npm test
node src/cli.js ids
```

## 3. Alchemy demos (key from `.env`)

```bash
node demo-script.js              # Smart Websockets: newHeads + USDC Transfer logs
node scripts/demo-rpc.js         # Ethereum mainnet node RPCs
node scripts/demo-solana.js      # Solana mainnet JSON-RPC
```

Keep the websocket open:

```bash
ALCHEMY_WATCH=1 node demo-script.js
```

### What the websocket response is

`eth_subscribe` first returns a subscription id:

```json
{"jsonrpc":"2.0","id":1,"result":"0x…"}
```

Each new block is an `eth_subscription` notification whose `result` is a
header: `number`, `hash`, `parentHash`, `timestamp`, `miner`, `gasUsed`.
`logs` notifications are ERC-20 `Transfer` events on Circle USDC
(`0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`). That stream is the Ethereum
watcher, not a card charge.

### What the RPC response is

`eth_chainId` must be `0x1` (Ethereum mainnet). `eth_blockNumber` is the latest
head. `eth_call` `totalSupply()` on Circle USDC is a sanity check that the node
sees the token the watcher will later filter.

### What the Solana response is

`getHealth` should be `"ok"`. `getSlot` is the confirmed slot.
`getLatestBlockhash` is what a later Solana tx would freeze. This is unrelated
to Stellar settlement.

## 4. Run the SEP-24 host

```bash
npm start
```

- Info: http://127.0.0.1:8787/sep24/info
- TOML: http://127.0.0.1:8787/.well-known/stellar.toml
- Wrap preview: http://127.0.0.1:8787/wrap?account=G…&amount=25

Wallet flow: SEP-10 `/auth` → `POST /sep24/transactions/deposit/interactive` →
open the returned URL → Alchemy Pay iframe.

When a Stellar tx lands:

```bash
node src/cli.js commit --tx <horizon_tx_hash>
```

That prints a HITL `stellar contract invoke … store` line. **The CLI does not
send it.** Review the digest, then a human signs.

## 5. Alchemy CLI (already on this machine)

The CLI is `@alchemy/cli` 0.24.0 and needs Node 22+.

```bash
npm i -g @alchemy/cli@latest
alchemy auth login --device-code    # if a browser cannot reach this host
alchemy wallet connect --mode session
alchemy wallet address
alchemy --json --no-interactive evm rpc eth_chainId
```

A session Agent Wallet is already connected here:

| Chain | Address |
|---|---|
| EVM | `0x94ab6cfeb70c62e08e1a085630bfeb1ec769163c` |
| Solana | `6pfso8YuDG3XqibUa7Kc9BZRDrfLovj1wmwjZnpuatei` |

`alchemy wallet connect --mode local` would create a *new* local keypair. Do
not do that unless you want a second wallet. The session wallet is the one
approved in the Alchemy dashboard.

## Hard rules

- Do not hard-code `ALCHEMY_API_KEY`. Read `process.env.ALCHEMY_API_KEY`.
- Do not commit `.env`.
- Do not put card data, KYC, or Alchemy Pay order JSON on-chain.
- Do not invent a `pmll_anchor` contract ID.
- Ethereum RPC ≠ Alchemy Pay. One watches USDC; the other charges the card.

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Alchemy Subscription API](https://www.alchemy.com/docs/reference/subscription-api)
- [Alchemy Solana](https://www.alchemy.com/docs/solana/solana-api-overview)
- [SEP-24](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md)
- [Alchemy Pay page integration](https://alchemypay.readme.io/docs/page-integration-2)
