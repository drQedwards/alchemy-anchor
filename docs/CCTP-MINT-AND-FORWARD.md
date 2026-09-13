# CCTP inbound: `mint_and_forward` (human-operable)

Complete a **CCTP V2 mint on Stellar** after a burn on another domain. Dry-run by default.

## Contracts (mainnet, domain 27)

| Role | Address |
|------|---------|
| **CctpForwarder** (invoke here) | `CBZL2IH7F6BIDAA3WBNXYKIXSATJGMSW7K5P5MJ6STX5RXN47TZJDF5T` |
| TokenMessengerMinter | `CAE2G5Z77UP7GYPYGFOWFGW7C7J6I4YP2AFGSADRKQY62SYUFLPNFTXL` |
| MessageTransmitter | `CACMENFFJPJMSDAJQLX4R7K3SFZIW2LJSE3R2UMLGSWHFHS353FVXAZV` |
| Circle USDC SAC | `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| CCTP bookkeeping asset | `USDCALLCCTP:GB3UMCNE…` (contract-held; not a wallet rail) |

## Spec

```text
mint_and_forward(message: Bytes, attestation: Bytes)
```

Atomic: verify Iris attestation → `receive_message` (mint to forwarder) → transfer Circle USDC to `forwardRecipient` from hook data.

## Dry run

```bash
node scripts/cctp-mint-and-forward.cjs
```

Prints the invoke plan and exits. No network submit.

## Live (after Iris)

```bash
export MESSAGE=…          # hex from Iris
export ATTESTATION=…      # hex from Iris
export STELLAR_SOURCE_ACCOUNT=G…   # fee payer
export CCTP_LIVE=1
node scripts/cctp-mint-and-forward.cjs
```

Or raw CLI:

```bash
stellar contract invoke \
  --network Public \
  --source-account "$STELLAR_SOURCE_ACCOUNT" \
  --id CBZL2IH7F6BIDAA3WBNXYKIXSATJGMSW7K5P5MJ6STX5RXN47TZJDF5T \
  -- \
  mint_and_forward \
  --message "$MESSAGE" \
  --attestation "$ATTESTATION"
```

## Source-burn prerequisites (fund-loss if wrong)

On the **other** chain’s `depositForBurnWithHook`:

1. `destinationDomain` = **27**
2. `mintRecipient` = **CctpForwarder** (32-byte contract encoding) — never a `G…`
3. `destinationCaller` = same forwarder encoding
4. Hook data = real recipient strkey (`GAMWMZHA…` etc.)

## Hard rules

- Alchemy-anchor does **not** mint; CCTP mints Circle USDC only.
- Not used by Drips Wave (Horizon payments).
- Assistants optional; human + `stellar` CLI is enough.

## Refs

- https://developers.circle.com/cctp/references/stellar
- https://developers.circle.com/cctp/references/stellar-contracts
- https://stellar.expert/explorer/public/contract/CBZL2IH7F6BIDAA3WBNXYKIXSATJGMSW7K5P5MJ6STX5RXN47TZJDF5T
