# Drips Wave grant CLI (human-operable)

Enqueue Wave grant reads / payouts against `https://wave-api.drips.network` without an AI agent.

This is **not** a Stellar signer. Drips’ custodial worker holds treasury `GC2SFZ2E…` and builds/signs the Horizon USDC payment after your request.

Frontend reference: [drips-network/app](https://github.com/drips-network/app) → `src/lib/utils/wave/grants.ts`.

## Setup

```bash
cp .env.example .env
# set WAVE_REFRESH_TOKEN and/or WAVE_ACCESS_TOKEN from your logged-in drips.network cookies
# optional: WAVE_GRANT_ID, STELLAR_ADDRESS, MEMO_TYPE, MEMO_VALUE
```

Get tokens from Chrome DevTools → Application → Cookies → `.drips.network`:

- `wave_access_token` (short-lived JWT)
- `wave_refresh_token` (used to mint a new access token)

Never commit `.env`.

## Commands

```bash
# dry plan (no auth needed for the plan printout; status needs tokens)
node scripts/drips-wave-grant.cjs status

node scripts/drips-wave-grant.cjs list

# $1 test payment — LIVE only with WAVE_LIVE=1
WAVE_LIVE=1 node scripts/drips-wave-grant.cjs test

# withdraw remaining balance
WAVE_LIVE=1 node scripts/drips-wave-grant.cjs withdraw

# cancel a pending withdrawal
WAVE_LIVE=1 node scripts/drips-wave-grant.cjs cancel
```

Without `WAVE_LIVE=1`, `test` / `withdraw` / `cancel` print a dry-run and exit 0.

## What the HTTP calls do

| Cmd | HTTP | Effect |
|-----|------|--------|
| status | `GET /api/grants/{id}` | Read allotment (`initialAmountUSD`, `currentAmountUSD`, `transactions[]`) |
| list | `GET /api/grants` | List your grants |
| test | `POST /api/grants/{id}/test-transaction` | Enqueue **$1** USDC to `STELLAR_ADDRESS` |
| withdraw | `POST /api/grants/{id}/withdraw` | Enqueue **remaining** balance |
| cancel | `POST /api/grants/{id}/cancel-withdrawal` | Cancel pending withdraw |

Body for test/withdraw:

```json
{
  "stellarAddress": "G…",
  "memoType": "text",
  "memoValue": "400252686"
}
```

`memoType` / `memoValue` are optional (use for CEX deposits like Binance).

## Curl equivalents

```bash
# refresh
curl -sS -X POST "$WAVE_API_URL/api/auth/token/refresh" \
  -H "content-type: application/json" \
  -H "cookie: wave_refresh_token=$WAVE_REFRESH_TOKEN"

# status
curl -sS "$WAVE_API_URL/api/grants/$WAVE_GRANT_ID" \
  -H "authorization: Bearer $WAVE_ACCESS_TOKEN"

# test ($1)
curl -sS -X POST "$WAVE_API_URL/api/grants/$WAVE_GRANT_ID/test-transaction" \
  -H "authorization: Bearer $WAVE_ACCESS_TOKEN" \
  -H "content-type: application/json" \
  -d "{\"stellarAddress\":\"$STELLAR_ADDRESS\"}"
```

## Hard rules (alchemy-anchor)

- Do not mint.
- Do not broadcast a `pmll_anchor` store from this script.
- Allotment lives in Wave’s DB, not Horizon `…/data/{key}`.
- Assistants may streamline; a human with Node + cookies can run the full path alone.

## Docs

- [Withdrawing Your Rewards](https://docs.drips.network/wave/withdrawing-rewards/)
- [Points & Rewards](https://docs.drips.network/wave/points-and-rewards/)
