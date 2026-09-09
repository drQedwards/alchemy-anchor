import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANCHOR, ASSETS, PMLL_ANCHOR, SCF } from './constants.js';
import { ROOT, optionalEnv } from './config.js';
import { challengeTx, tokenFromSignedChallenge, verifyJwt } from './sep10.js';
import { info, startDeposit, startWithdraw, getTx, listTx, markPending } from './sep24.js';
import { wrapAlchemyPay } from './alchemy-pay.js';
import { commitFromTxHash } from './stellar-watcher.js';

const web = join(ROOT, 'web');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.toml': 'text/plain; charset=utf-8',
  '.svg': 'image/svg-xml',
};

const port = Number(optionalEnv('PORT', '8787'));

function cors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, authorization');
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) return raw ? JSON.parse(raw) : {};
  return Object.fromEntries(new URLSearchParams(raw));
}

function json(res, code, body) {
  cors(res);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body, null, 2));
}

function accountFromAuth(req) {
  const header = req.headers.authorization;
  return verifyJwt(header).sub;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
    if (req.method === 'OPTIONS') {
      cors(res);
      res.writeHead(204);
      res.end();
      return;
    }

    if (url.pathname === '/.well-known/stellar.toml' || url.pathname === '/stellar.toml') {
      const body = await readFile(join(ROOT, 'stellar.toml'));
      cors(res);
      res.writeHead(200, {
        'content-type': 'text/plain; charset=utf-8',
        'access-control-allow-origin': '*',
      });
      res.end(body);
      return;
    }

    if (url.pathname === '/health') {
      json(res, 200, {
        ok: true,
        anchor: ANCHOR.name,
        primitive: PMLL_ANCHOR.contractId,
        terminus: ASSETS.usdc.label,
        rail: 'alchemy-pay',
        scf: {
          officialProduct: SCF.officialProduct,
          round: SCF.round,
          track: SCF.track,
          award: SCF.award,
        },
      });
      return;
    }

    if (url.pathname === '/auth' && req.method === 'GET') {
      const account = url.searchParams.get('account');
      if (!account) return json(res, 400, { error: 'account is required' });
      const tx = challengeTx(account, url.searchParams.get('client_domain') || undefined);
      return json(res, 200, { transaction: tx, network_passphrase: 'Public Global Stellar Network ; September 2015' });
    }

    if (url.pathname === '/auth' && req.method === 'POST') {
      const body = await readBody(req);
      const out = tokenFromSignedChallenge(body.transaction);
      return json(res, 200, out);
    }

    if (url.pathname === '/sep24/info' && req.method === 'GET') {
      return json(res, 200, info());
    }

    if (url.pathname === '/sep24/transactions/deposit/interactive' && req.method === 'POST') {
      const account = accountFromAuth(req);
      const body = await readBody(req);
      const started = startDeposit({
        account: body.account || account,
        assetCode: body.asset_code,
        amount: body.amount,
        lang: body.lang,
      });
      return json(res, 200, started);
    }

    if (url.pathname === '/sep24/transactions/withdraw/interactive' && req.method === 'POST') {
      const account = accountFromAuth(req);
      const body = await readBody(req);
      return json(res, 200, startWithdraw({ account: body.account || account, assetCode: body.asset_code, amount: body.amount }));
    }

    if (url.pathname === '/sep24/transaction' && req.method === 'GET') {
      accountFromAuth(req);
      const tx = getTx(url.searchParams.get('id'));
      if (!tx) return json(res, 404, { error: 'not found' });
      return json(res, 200, { transaction: tx });
    }

    if (url.pathname === '/sep24/transactions' && req.method === 'GET') {
      const account = accountFromAuth(req);
      return json(res, 200, { transactions: listTx(account) });
    }

    if (url.pathname === '/sep24/interactive' && req.method === 'GET') {
      const html = await readFile(join(web, 'checkout.html'), 'utf8');
      cors(res);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (url.pathname.startsWith('/sep24/tx/') && req.method === 'GET') {
      const id = url.pathname.slice('/sep24/tx/'.length);
      const tx = getTx(id);
      if (!tx) return json(res, 404, { error: 'not found' });
      return json(res, 200, tx);
    }

    if (url.pathname === '/webhooks/alchemypay' && req.method === 'POST') {
      const body = await readBody(req);
      const id = body.id || body.merchantOrderNo || body.orderNo;
      if (id && getTx(id)) markPending(id, { status: 'pending_anchor', alchemyPay: { orderNo: body.orderNo, status: body.status } });
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/commit' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.txHash) return json(res, 400, { error: 'txHash is required' });
      const trail = await commitFromTxHash(body.txHash, body);
      if (body.id) markPending(body.id, { status: 'pending_stellar', trail });
      return json(res, 200, trail);
    }

    if (url.pathname === '/wrap' && req.method === 'GET') {
      return json(res, 200, wrapAlchemyPay({
        account: url.searchParams.get('account'),
        amount: url.searchParams.get('amount'),
        crypto: url.searchParams.get('crypto') || undefined,
      }));
    }

    let path = url.pathname === '/' ? '/index.html' : url.pathname;
    const abs = normalize(join(web, path));
    if (!abs.startsWith(web)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    const body = await readFile(abs);
    cors(res);
    res.writeHead(200, { 'content-type': types[extname(abs)] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    json(res, err.message?.includes('JWT') || err.message?.includes('missing') ? 401 : 400, {
      error: err.message || String(err),
    });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`alchemy-anchor SEP-24 → http://127.0.0.1:${port}`);
  console.log(`stellar.toml          → http://127.0.0.1:${port}/.well-known/stellar.toml`);
  console.log(`wrap Alchemy Pay      → http://127.0.0.1:${port}/wrap`);
  console.log(`primitive             → ${PMLL_ANCHOR.contractId}`);
});
