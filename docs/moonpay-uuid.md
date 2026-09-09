# MoonPay UUID confirmation

Minted-coin disbursements from a minter do not proceed until MoonPay transactions retrieve confirms the transaction UUID and status `completed`.

This is not an on-ramp mint. Circle USDC stays transfer-only. The retrieve result is a gate. It does not broadcast a Stellar or Robinhood Chain transaction.
