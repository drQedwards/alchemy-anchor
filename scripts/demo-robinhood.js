#!/usr/bin/env node
/**
 * Robinhood Chain mainnet read probe (chain id 4663).
 *
 * Optional: ROBINHOOD_RPC_URL in .env (never hard-code a key).
 * Defaults to the public RPC. This script does not sign or send.
 */
import { probeRobinhoodChain } from '../src/robinhood.js';

probeRobinhoodChain()
  .then((out) => {
    console.log(JSON.stringify(out, null, 2));
  })
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
