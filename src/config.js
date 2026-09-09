import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const envPath = resolve(root, '.env');
if (existsSync(envPath)) loadDotenv({ path: envPath });
else loadDotenv();

export function requireEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(
      `Missing ${name}. Create ${envPath} with ${name}=<value> and never commit it.`,
    );
  }
  return String(value).trim();
}

export function optionalEnv(name, fallback = '') {
  const value = process.env[name];
  return value && String(value).trim() ? String(value).trim() : fallback;
}

export function alchemyApiKey() {
  return requireEnv('ALCHEMY_API_KEY');
}

export function ethHttpUrl() {
  return `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey()}`;
}

export function ethWsUrl() {
  return `wss://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey()}`;
}

export function solanaHttpUrl() {
  return `https://solana-mainnet.g.alchemy.com/v2/${alchemyApiKey()}`;
}

export const ROOT = root;
