/**
 * Cloudflare Worker — EP Survey admin proxy
 *
 * Lets admin.html publish, list, and revert edits to data-countries.json
 * without exposing a GitHub token to the browser.
 *
 * Required secrets (set in Cloudflare dashboard → Worker → Settings → Variables):
 *   GH_TOKEN        Fine-grained PAT scoped to this repo, Contents: Read & Write
 *   REPO            "runsleepdesign/GCC-EP-Survey-main-3"
 *   ADMIN_PASSWORD  Shared password the admin enters in admin.html
 *
 * Endpoints (all CORS-enabled):
 *   POST /publish   { password, data, country?, message? }
 *                   Writes data-countries.json on main.
 *   GET  /history?password=...
 *                   Returns last 10 commits to data-countries.json.
 *   POST /revert    { password, sha }
 *                   Restores data-countries.json to its state at the given commit.
 */

const FILE_PATH = 'data-countries.json';
const BRANCH = 'main';

// ── CORS ─────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// ── Auth ─────────────────────────────────────────────────────────────
function checkAuth(env, password) {
  return !!env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD;
}

// ── UTF-8 safe base64 ────────────────────────────────────────────────
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// ── GitHub helpers ───────────────────────────────────────────────────
function ghHeaders(env) {
  return {
    'Authorization': `Bearer ${env.GH_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ep-survey-admin-proxy',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function getCurrentFile(env) {
  const url = `https://api.github.com/repos/${env.REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const r = await fetch(url, { headers: ghHeaders(env) });
  if (r.status === 404) return { sha: null, content: '' };
  if (!r.ok) throw new Error('GitHub GET failed: ' + r.status);
  const j = await r.json();
  return { sha: j.sha, content: base64ToUtf8(j.content) };
}

async function putContent(env, content, message, baseSha) {
  const body = {
    message,
    branch: BRANCH,
    content: utf8ToBase64(content),
  };
  if (baseSha) body.sha = baseSha;
  const url = `https://api.github.com/repos/${env.REPO}/contents/${FILE_PATH}`;
  return fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ── Handlers ─────────────────────────────────────────────────────────
async function handlePublish(req, env) {
  let body;
  try { body = await req.json(); } catch { return json({ error: 'invalid json body' }, 400); }
  if (!checkAuth(env, body.password)) return json({ error: 'unauthorized' }, 401);
  if (!body.data || typeof body.data !== 'object') return json({ error: 'missing data' }, 400);

  const text = JSON.stringify(body.data, null, 2) + '\n';
  const msg = body.message || (body.country ? `admin: update ${body.country}` : 'admin: update countries data');

  let baseSha = null;
  try { ({ sha: baseSha } = await getCurrentFile(env)); } catch (e) { return json({ error: 'github error', detail: e.message }, 502); }

  const r = await putContent(env, text, msg, baseSha);
  if (!r.ok) {
    const detail = await r.text();
    return json({ error: 'github PUT failed', status: r.status, detail }, 502);
  }
  const result = await r.json();
  return json({ ok: true, commit: result.commit?.sha, html_url: result.commit?.html_url });
}

async function handleHistory(req, env) {
  const url = new URL(req.url);
  const password = url.searchParams.get('password');
  if (!checkAuth(env, password)) return json({ error: 'unauthorized' }, 401);

  const ghUrl = `https://api.github.com/repos/${env.REPO}/commits?path=${encodeURIComponent(FILE_PATH)}&sha=${BRANCH}&per_page=10`;
  const r = await fetch(ghUrl, { headers: ghHeaders(env) });
  if (!r.ok) return json({ error: 'github commits failed', status: r.status }, 502);
  const commits = await r.json();
  return json({
    commits: commits.map(c => ({
      sha: c.sha,
      short: c.sha.slice(0, 7),
      message: c.commit.message,
      author: c.commit.author.name,
      date: c.commit.author.date,
      html_url: c.html_url,
    })),
  });
}

async function handleRevert(req, env) {
  let body;
  try { body = await req.json(); } catch { return json({ error: 'invalid json body' }, 400); }
  if (!checkAuth(env, body.password)) return json({ error: 'unauthorized' }, 401);
  if (!body.sha) return json({ error: 'missing sha' }, 400);

  // Get the file content at the target commit
  const targetUrl = `https://api.github.com/repos/${env.REPO}/contents/${FILE_PATH}?ref=${body.sha}`;
  const tr = await fetch(targetUrl, { headers: ghHeaders(env) });
  if (!tr.ok) return json({ error: 'commit content not found' }, 404);
  const blob = await tr.json();
  const oldContent = base64ToUtf8(blob.content);

  // Get current SHA so we can PUT cleanly
  let currentSha;
  try { ({ sha: currentSha } = await getCurrentFile(env)); } catch (e) { return json({ error: 'github error', detail: e.message }, 502); }

  const msg = `admin: revert data to ${body.sha.slice(0, 7)}`;
  const r = await putContent(env, oldContent, msg, currentSha);
  if (!r.ok) {
    const detail = await r.text();
    return json({ error: 'github revert failed', status: r.status, detail }, 502);
  }
  const result = await r.json();
  return json({ ok: true, commit: result.commit?.sha });
}

// ── Router ───────────────────────────────────────────────────────────
export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    const url = new URL(req.url);
    if (url.pathname === '/publish' && req.method === 'POST') return handlePublish(req, env);
    if (url.pathname === '/history' && req.method === 'GET')  return handleHistory(req, env);
    if (url.pathname === '/revert'  && req.method === 'POST') return handleRevert(req, env);
    if (url.pathname === '/' || url.pathname === '') return json({ ok: true, service: 'ep-survey-admin-proxy' });
    return json({ error: 'not found' }, 404);
  },
};
