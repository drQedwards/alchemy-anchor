# Anchor directory listing

This is the SEP-24 listing payload for Alchemy on the Stellar Anchor Directory.

`anchors.stellar.org/?payment=Card&s=Alchemy` currently has no listing and no generate-card action. This file is the merge request, not a claim that the directory already shows the facet.

## What a wallet should call

- SEP-10 `/auth`
- `POST /sep24/transactions/deposit/interactive`
- open the returned interactive URL, which is the Alchemy card facet

Card data stays with Alchemy Pay. This repo does not generate a PAN.

## Hard rules

- Do not mint.
- Do not broadcast a `pmll_anchor` store. A digest is eligible only after a human signs `store`.
- Circle USDC (`GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`) is transfer-only.
- Minted disbursements still require a completed MoonPay transaction UUID. That gate landed on `main` in PR #1.

## Not ready to appear as live

- `stellar.toml` still uses `localhost` for `WEB_AUTH_ENDPOINT` and `TRANSFER_SERVER_SEP0024`.
- `ALCHEMY_PAY_APP_ID` and the Alchemy Pay card PAGE URL are not provisioned.
