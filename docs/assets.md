# Assets

Official SCF #45 product: **alchemy-anchor**.
Repo: https://github.com/drQedwards/alchemy-anchor
Round: https://communityfund.stellar.org/dashboard/award-rounds/reccaFUJmN4HNQxvo

Settlement honors existing issued assets. This process does **not** mint.

## Stellar assets (SEP-1 / stellar.toml)

| Code | Issuer | Role | Mint here? |
|------|--------|------|------------|
| **USDC** | `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN` | First settlement path for Alchemy Pay card deposits. Circle-issued. | No |
| **XLM** | native | Optional Alchemy Pay Stellar ramp output. Terminus remains Circle USDC. | No |
| **USDT0** (optional hop) | `GATISXX6BZ6NC7IKQBY37CJD4SOZL3CYZJWXEDG6JVIY4WBS6KXJHN6Q` | Optional pathway hop only. Not the fundraiser terminus. | No |

Attestation of reserve (USDC): https://www.circle.com/en/usdc

## On-chain primitives (not assets)

| ID | Role |
|----|------|
| `pmll_anchor` `CCF3B64AXLS4OLY5RN4H4K2CFZAYNZCJQY5MKCKCVAKMZNH7G7F7XUUF` | Stores 32-byte XDR digests only. Human signs `store`. |
| forge `CD6AQDVCZUTKN2HOJ6UEMYCOT72TNM4CQLV2YNT7VFPIHN7UJFDQAFS7` | Chains pathway crumbs. |

## Architecture (summary)

See [ARCHITECTURE.md](./ARCHITECTURE.md).

1. Wallet authenticates with SEP-10.
2. SEP-24 deposit opens the Alchemy Pay hosted checkout (card PAN stays with the processor).
3. Stellar payment lands as Circle USDC (or XLM).
4. SHA-256 of the envelope XDR is eligible for HITL `pmll_anchor.store`.
5. Ethereum Alchemy RPC is a Circle USDC watcher only — not a card rail.

## Directory listing

Payload: [`directory/listing.json`](../directory/listing.json).
Filter: https://anchors.stellar.org/?payment=Card&s=Alchemy

## Related docs

- [SCF.md](./SCF.md) — Open Track brief, tranche map
- [ARCHITECTURE.md](./ARCHITECTURE.md) — rails diagram
- [DIRECTORY.md](./DIRECTORY.md) — listing constraints
