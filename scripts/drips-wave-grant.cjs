#!/usr/bin/env node
/**
 * Drips Wave grant CLI — human-runnable.
 * Default: status (GET grant). Mutating calls only when WAVE_LIVE=1.
 * Never prints tokens/secrets. Does not hold GC2SFZ2E… — Drips worker signs.
 *
 * Usage:
 *   node scripts/drips-wave-grant.cjs status
 *   node scripts/drips-wave-grant.cjs list
 *   WAVE_LIVE=1 node scripts/drips-wave-grant.cjs test
 *   WAVE_LIVE=1 node scripts/drips-wave-grant.cjs withdraw
 *   WAVE_LIVE=1 node scripts/drips-wave-grant.cjs cancel
 *
 * Auth: WAVE_ACCESS_TOKEN and/or WAVE_REFRESH_TOKEN (from browser cookies).
 * See docs/DRIPS-WAVE-GRANT.md
 */
try {
  require("dotenv").config();
} catch (_) {
  /* dotenv optional if env already set */
}

const WAVE_API_URL = (
  process.env.WAVE_API_URL || "https://wave-api.drips.network"
).replace(/\/$/, "");
const GRANT_ID =
  process.env.WAVE_GRANT_ID || "0ec90cda-a736-4efe-9e26-32a86776f0ab";
const STELLAR_ADDRESS =
  process.env.STELLAR_ADDRESS ||
  "GAMWMZHAWQWQYB2FDPP3F53DVEYLVNW3Y4Q5GKQXVEZH5OKNYMP3NZN7";
const MEMO_TYPE = process.env.MEMO_TYPE || "";
const MEMO_VALUE = process.env.MEMO_VALUE || "";
const live = process.env.WAVE_LIVE === "1";
const cmd = (process.argv[2] || "status").toLowerCase();

let accessToken = process.env.WAVE_ACCESS_TOKEN || "";
const refreshToken = process.env.WAVE_REFRESH_TOKEN || "";

function redact(s) {
  if (!s) return "";
  if (s.length <= 12) return "***";
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

async function http(method, path, body) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "alchemy-anchor-drips-wave-grant/1.0",
    Origin: "https://www.drips.network",
    Referer: `https://www.drips.network/wave/rewards/${GRANT_ID}`,
  };
  const cookies = [];
  if (refreshToken) cookies.push(`wave_refresh_token=${refreshToken}`);
  if (accessToken) cookies.push(`wave_access_token=${accessToken}`);
  if (cookies.length) headers.Cookie = cookies.join("; ");
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${WAVE_API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json, text };
}

async function refreshAccess() {
  if (!refreshToken) return false;
  const { status, json } = await http("POST", "/api/auth/token/refresh", {});
  if (status === 200 && json && json.accessToken) {
    accessToken = json.accessToken;
    return true;
  }
  return false;
}

async function withAuth(method, path, body) {
  let r = await http(method, path, body);
  if (r.status === 401 && (await refreshAccess())) {
    r = await http(method, path, body);
  }
  return r;
}

function bodyForPayout() {
  const b = { stellarAddress: STELLAR_ADDRESS };
  if (MEMO_TYPE && MEMO_VALUE) {
    b.memoType = MEMO_TYPE;
    b.memoValue = MEMO_VALUE;
  }
  return b;
}

function summarizeGrant(g) {
  if (!g || typeof g !== "object") return g;
  const txs = Array.isArray(g.transactions) ? g.transactions : [];
  return {
    id: g.id,
    waveProgramSlug: g.waveProgramSlug,
    waveNumber: g.waveNumber,
    type: g.type,
    initialAmountUSD: g.initialAmountUSD,
    currentAmountUSD: g.currentAmountUSD,
    status: g.status,
    expiresAt: g.expiresAt,
    transactions: txs.slice(0, 8).map((t) => ({
      type: t.type,
      amountUSD: t.amountUSD,
      status: t.status,
      stellarAddress: t.stellarAddress,
      memoType: t.memoType,
      memoValue: t.memoValue,
      transactionHash: t.transactionHash,
      requestedAt: t.requestedAt,
      completedAt: t.completedAt,
    })),
  };
}

async function main() {
  console.log(
    JSON.stringify(
      {
        mode: live ? "LIVE" : "dry",
        cmd,
        waveApi: WAVE_API_URL,
        grantId: GRANT_ID,
        stellarAddress: STELLAR_ADDRESS,
        memo:
          MEMO_TYPE && MEMO_VALUE
            ? { type: MEMO_TYPE, value: MEMO_VALUE }
            : null,
        auth: {
          access: accessToken ? redact(accessToken) : null,
          refresh: refreshToken ? redact(refreshToken) : null,
        },
        note:
          "Mutations enqueue Drips custodial worker (GC2SFZ2E…). This CLI never signs Stellar txs.",
      },
      null,
      2
    )
  );

  if (["test", "withdraw", "cancel"].includes(cmd) && !live) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          wouldCall:
            cmd === "test"
              ? `POST /api/grants/${GRANT_ID}/test-transaction`
              : cmd === "withdraw"
                ? `POST /api/grants/${GRANT_ID}/withdraw`
                : `POST /api/grants/${GRANT_ID}/cancel-withdrawal`,
          body: cmd === "cancel" ? null : bodyForPayout(),
          hint: "Re-run with WAVE_LIVE=1 to execute",
        },
        null,
        2
      )
    );
    return;
  }

  if (!accessToken && !refreshToken) {
    console.error(
      "Missing WAVE_ACCESS_TOKEN or WAVE_REFRESH_TOKEN. See docs/DRIPS-WAVE-GRANT.md"
    );
    process.exit(2);
  }

  if (cmd === "status") {
    const r = await withAuth("GET", `/api/grants/${GRANT_ID}`);
    if (r.status !== 200) {
      console.error("status failed", r.status, r.text.slice(0, 400));
      process.exit(1);
    }
    console.log(JSON.stringify(summarizeGrant(r.json), null, 2));
    return;
  }

  if (cmd === "list") {
    const r = await withAuth("GET", "/api/grants?limit=20");
    if (r.status !== 200) {
      console.error("list failed", r.status, r.text.slice(0, 400));
      process.exit(1);
    }
    const data = r.json?.data || r.json;
    const rows = Array.isArray(data)
      ? data.map((g) => ({
          id: g.id,
          waveNumber: g.waveNumber,
          initialAmountUSD: g.initialAmountUSD,
          currentAmountUSD: g.currentAmountUSD,
          status: g.status,
        }))
      : data;
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  if (cmd === "test") {
    const r = await withAuth(
      "POST",
      `/api/grants/${GRANT_ID}/test-transaction`,
      bodyForPayout()
    );
    console.log(JSON.stringify({ http: r.status, body: r.json }, null, 2));
    if (r.status < 200 || r.status >= 300) process.exit(1);
    return;
  }

  if (cmd === "withdraw") {
    const r = await withAuth(
      "POST",
      `/api/grants/${GRANT_ID}/withdraw`,
      bodyForPayout()
    );
    console.log(JSON.stringify({ http: r.status, body: r.json }, null, 2));
    if (r.status < 200 || r.status >= 300) process.exit(1);
    return;
  }

  if (cmd === "cancel") {
    const r = await withAuth(
      "POST",
      `/api/grants/${GRANT_ID}/cancel-withdrawal`,
      {}
    );
    console.log(JSON.stringify({ http: r.status, body: r.json }, null, 2));
    if (r.status < 200 || r.status >= 300) process.exit(1);
    return;
  }

  console.error(
    `Unknown cmd "${cmd}". Use: status | list | test | withdraw | cancel`
  );
  process.exit(2);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
