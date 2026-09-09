import { ethHttpUrl, solanaHttpUrl } from './config.js';

export async function jsonRpc(url, method, params = [], id = 1) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
  const body = await res.json();
  if (body.error) {
    const err = new Error(body.error.message || JSON.stringify(body.error));
    err.code = body.error.code;
    throw err;
  }
  return body.result;
}

export function ethRpc(method, params = []) {
  return jsonRpc(ethHttpUrl(), method, params);
}

export function solanaRpc(method, params = []) {
  return jsonRpc(solanaHttpUrl(), method, params);
}
