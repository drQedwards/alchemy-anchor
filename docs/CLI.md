# Alchemy CLI on this machine

Node 22+ is required (`fnm` currently provides v22.23.2).

```bash
npm i -g @alchemy/cli@latest
alchemy --version                 # 0.24.0 at scaffold time
alchemy auth login                # browser; use --device-code on SSH
alchemy auth status
alchemy wallet connect --mode session
alchemy wallet address
```

`--mode session` asks the Alchemy dashboard to approve an Agent Wallet. That is
the wallet we want. `--mode local` writes a new key file; skip it unless you
intentionally want a second signer.

The session already connected during scaffold:

- EVM `0x94ab6cfeb70c62e08e1a085630bfeb1ec769163c`
- Solana `6pfso8YuDG3XqibUa7Kc9BZRDrfLovj1wmwjZnpuatei`
- expires 2026-09-15

RPC still reads `ALCHEMY_API_KEY` from the environment / `.env` for the Node
demos. The CLI has its own selected app (`X-Wallet`). Do not paste either key
into git.
