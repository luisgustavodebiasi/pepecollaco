#!/usr/bin/env node
/**
 * listar_posts_ig.mjs — Lista os posts publicados do Instagram (e opcionalmente
 * da Página do Facebook) do Pepê via Graph API, do mesmo jeito que o painel
 * Next.js faz (lib/meta/content.ts). Serve para pegar o `ig_media_id` de cada
 * post e depois direcionar o impulsionamento pelo MCP oficial da Meta
 * (ads_boost_ig_post).
 *
 * NÃO gasta nada e NÃO cria nada — é só LEITURA (GET).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMO RODAR (em outro terminal)
 *
 *   cd "/Users/luisgustavodebiasi/TRABALHOS/Projetos Externo/PEPE/IMPULSIONAMENTOS/scripts"
 *   node listar_posts_ig.mjs
 *
 * O token é resolvido nesta ordem (o primeiro que existir vence):
 *   1) --token=EA;...              (passado direto no comando)
 *   2) variável de ambiente META_TOKEN
 *   3) arquivo token.txt na mesma pasta do script
 *   4) META_SYSTEM_USER_TOKEN do .env.local do credenciamento-next
 *
 * OPÇÕES:
 *   --token=<TOKEN>   Token de acesso da Graph API (System User ou usuário).
 *   --limit=<N>       Quantos posts por página (padrão 25).
 *   --all             Pagina até o fim (pega tudo, não só a 1ª página).
 *   --source=ig|page|both   O que listar (padrão: ig).
 *   --json            Imprime JSON cru em vez da tabela.
 *   --csv=<arquivo>   Salva o resultado em CSV nesse caminho.
 *   --env=<arquivo>   Caminho do .env.local (padrão: o do credenciamento-next).
 *   --no-proof        Não envia appsecret_proof (use se o token for de outro app).
 *
 * EXEMPLOS:
 *   node listar_posts_ig.mjs --token=EAxxxx --all
 *   node listar_posts_ig.mjs --source=both --csv=../dados/posts_ig.csv
 *   META_TOKEN=EAxxxx node listar_posts_ig.mjs --limit=50
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

// ── argumentos ──────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
};

const DEFAULT_ENV = path.resolve(
  SCRIPT_DIR,
  "../../PEPECOPY/credenciamento-next/.env.local",
);
const ENV_PATH = opt("env", DEFAULT_ENV);
const LIMIT = Number(opt("limit", "25"));
const ALL = flag("all");
const SOURCE = opt("source", "ig"); // ig | page | both
const AS_JSON = flag("json");
const CSV_PATH = opt("csv", null);
const NO_PROOF = flag("no-proof");

// ── .env.local (parse simples KEY=VALUE) ────────────────────
function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}
const env = loadEnv(ENV_PATH);

// ── token (ordem de prioridade) ─────────────────────────────
function resolveToken() {
  const fromArg = opt("token", null);
  if (fromArg) return fromArg.trim();
  if (process.env.META_TOKEN) return process.env.META_TOKEN.trim();
  const tokenFile = path.join(SCRIPT_DIR, "token.txt");
  if (fs.existsSync(tokenFile)) return fs.readFileSync(tokenFile, "utf8").trim();
  if (env.META_SYSTEM_USER_TOKEN) return env.META_SYSTEM_USER_TOKEN.trim();
  return null;
}
const TOKEN = resolveToken();

const VERSION = env.META_GRAPH_VERSION || "v23.0";
const SECRET = env.META_APP_SECRET || null;
const IG_USER_ID = env.META_IG_USER_ID;
const PAGE_ID = env.META_PAGE_ID;

if (!TOKEN) {
  console.error(
    "✖ Sem token. Passe --token=, ou defina META_TOKEN, ou crie token.txt, ou preencha META_SYSTEM_USER_TOKEN no .env.local.",
  );
  process.exit(1);
}

// ── chamada à Graph API ─────────────────────────────────────
function proofFor(token) {
  if (NO_PROOF || !SECRET) return null;
  return crypto.createHmac("sha256", SECRET).update(token).digest("hex");
}

async function graphGet(pathPart, params) {
  const url = new URL(`https://graph.facebook.com/${VERSION}/${pathPart}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  url.searchParams.set("access_token", TOKEN);
  const proof = proofFor(TOKEN);
  if (proof) url.searchParams.set("appsecret_proof", proof);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    const msg = e.error_user_msg || e.message || `HTTP ${res.status}`;
    throw new Error(`Graph API: ${msg}${e.code ? ` (code ${e.code}` + (e.error_subcode ? `/${e.error_subcode}` : "") + ")" : ""}`);
  }
  return json;
}

// pagina seguindo paging.next enquanto --all
async function fetchPaged(pathPart, fields) {
  const out = [];
  let params = { fields, limit: LIMIT };
  let cursor = null;
  do {
    if (cursor) params = { fields, limit: LIMIT, after: cursor };
    const json = await graphGet(pathPart, params);
    out.push(...(json.data || []));
    cursor = ALL ? json.paging?.cursors?.after ?? null : null;
    if (cursor && json.paging?.next == null) cursor = null;
  } while (cursor);
  return out;
}

// ── normalização ────────────────────────────────────────────
function short(s, n = 70) {
  return (s || "").replace(/\s+/g, " ").trim().slice(0, n);
}

async function listIg() {
  if (!IG_USER_ID) {
    console.error("✖ META_IG_USER_ID não está no .env.local — pulei o Instagram.");
    return [];
  }
  const fields =
    "id,caption,media_type,media_product_type,permalink,timestamp";
  const media = await fetchPaged(`${IG_USER_ID}/media`, fields);
  return media.map((m) => ({
    fonte: "instagram",
    ig_media_id: m.id,
    object_story_id: "",
    tipo: m.media_product_type || m.media_type || "",
    data: m.timestamp || "",
    permalink: m.permalink || "",
    legenda: short(m.caption),
  }));
}

async function listPage() {
  if (!PAGE_ID) {
    console.error("✖ META_PAGE_ID não está no .env.local — pulei a Página.");
    return [];
  }
  const fields = "id,message,created_time,permalink_url";
  const posts = await fetchPaged(`${PAGE_ID}/published_posts`, fields);
  return posts.map((p) => ({
    fonte: "page",
    ig_media_id: "",
    object_story_id: p.id, // '<pageId>_<postId>' — usado no boost de FB
    tipo: "post",
    data: p.created_time || "",
    permalink: p.permalink_url || "",
    legenda: short(p.message),
  }));
}

// ── saída ───────────────────────────────────────────────────
function toCsv(rows) {
  const cols = ["fonte", "ig_media_id", "object_story_id", "tipo", "data", "permalink", "legenda"];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

function printTable(rows) {
  console.log(`\n${rows.length} post(s) — versão ${VERSION}\n`);
  for (const r of rows) {
    const id = r.fonte === "instagram" ? r.ig_media_id : r.object_story_id;
    const data = r.data ? r.data.slice(0, 10) : "?";
    console.log(`• [${r.fonte}] ${data}  ${r.tipo.padEnd(8)}  id=${id}`);
    console.log(`    ${r.legenda}`);
    if (r.permalink) console.log(`    ${r.permalink}`);
  }
  console.log("");
}

// ── main ────────────────────────────────────────────────────
(async () => {
  try {
    let rows = [];
    if (SOURCE === "ig" || SOURCE === "both") rows.push(...(await listIg()));
    if (SOURCE === "page" || SOURCE === "both") rows.push(...(await listPage()));

    if (AS_JSON) {
      console.log(JSON.stringify(rows, null, 2));
    } else {
      printTable(rows);
      console.log("Para impulsionar pelo MCP (ads_boost_ig_post), use:");
      console.log(`  ad_account_id = ${env.META_AD_ACCOUNT_ID || "1700449990528437"}`);
      console.log(`  ig_account_id = ${IG_USER_ID || "(META_IG_USER_ID)"}`);
      console.log(`  ig_media_id   = <o id do post escolhido acima>\n`);
    }

    if (CSV_PATH) {
      const dest = path.resolve(process.cwd(), CSV_PATH);
      fs.writeFileSync(dest, toCsv(rows), "utf8");
      console.error(`✔ CSV salvo em ${dest}`);
    }
  } catch (err) {
    console.error(`✖ ${err.message}`);
    if (/expired|code 190/i.test(err.message)) {
      console.error("  → O token venceu. Gere um novo e passe com --token= ou atualize o .env.local.");
    }
    process.exit(2);
  }
})();
