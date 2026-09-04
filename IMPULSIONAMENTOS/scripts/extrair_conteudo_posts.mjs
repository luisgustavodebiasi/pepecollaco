#!/usr/bin/env node
/**
 * extrair_conteudo_posts.mjs — Extrai da Graph API a lista completa de posts
 * do Instagram (e opcionalmente da Página do Facebook) do Pepê, com LEGENDA
 * INTEIRA, LINK, DATA e DADOS DE ENGAJAMENTO.
 *
 * Objetivo: virar base de consulta do site — quando o texto citar algo
 * específico (ginásio de Sangão, enrocamento de Capivari, SC-370...), dá para
 * achar o post original e linkar.
 *
 * É SÓ LEITURA (GET). Não cria nada, não gasta nada.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMO RODAR
 *
 *   cd "/Users/luisgustavodebiasi/TRABALHOS/Projetos Externo/PEPE/IMPULSIONAMENTOS/scripts"
 *   node extrair_conteudo_posts.mjs --token=EAxxxx
 *
 * Token resolvido nesta ordem: --token= > META_TOKEN > token.txt > .env.local
 *
 * OPÇÕES
 *   --anos=3            Janela em anos (padrão 3). Use --since= para data fixa.
 *   --since=2023-09-01  Data inicial explícita (vence o --anos).
 *   --source=ig|page|both  Padrão: ig
 *   --insights          Busca alcance/visualizações/salvamentos/compartilhamentos
 *                       (1 request por post; mais lento, dado mais rico)
 *   --stories           Inclui stories (padrão: fora)
 *   --out=arquivo.csv   Onde salvar (padrão ../../REDES/posts_conteudo_3anos.csv)
 *   --no-proof          Não envia appsecret_proof (token de outro app)
 *   --env=caminho       Outro .env.local
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};

const ENV_PATH = opt("env", path.resolve(SCRIPT_DIR, "../../PEPECOPY/credenciamento-next/.env.local"));
const SOURCE = opt("source", "ig");
const WITH_INSIGHTS = flag("insights");
const WITH_STORIES = flag("stories");
const OUT_PATH = opt("out", path.resolve(SCRIPT_DIR, "../../REDES/posts_conteudo_3anos.csv"));
const NO_PROOF = flag("no-proof");
const ANOS = Number(opt("anos", "3"));

function computeSince() {
  const explicit = opt("since", null);
  if (explicit) return new Date(`${explicit}T00:00:00Z`);
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - ANOS);
  return d;
}
const SINCE = computeSince();

// ── .env.local ──────────────────────────────────────────────
function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}
const env = loadEnv(ENV_PATH);

const TOKEN = (() => {
  const a = opt("token", null);
  if (a) return a.trim();
  if (process.env.META_TOKEN) return process.env.META_TOKEN.trim();
  const f = path.join(SCRIPT_DIR, "token.txt");
  if (fs.existsSync(f)) return fs.readFileSync(f, "utf8").trim();
  if (env.META_SYSTEM_USER_TOKEN) return env.META_SYSTEM_USER_TOKEN.trim();
  return null;
})();

const VERSION = env.META_GRAPH_VERSION || "v23.0";
const SECRET = env.META_APP_SECRET || null;
const IG_USER_ID = env.META_IG_USER_ID;
const PAGE_ID = env.META_PAGE_ID;

if (!TOKEN) {
  console.error("✖ Sem token. Passe --token=, defina META_TOKEN, crie token.txt ou preencha META_SYSTEM_USER_TOKEN no .env.local.");
  process.exit(1);
}

function proofFor(token) {
  if (NO_PROOF || !SECRET) return null;
  return crypto.createHmac("sha256", SECRET).update(token).digest("hex");
}
const PROOF = proofFor(TOKEN);

async function graphGet(pathPart, params = {}, token = TOKEN) {
  const url = new URL(`https://graph.facebook.com/${VERSION}/${pathPart}`);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, String(v));
  url.searchParams.set("access_token", token);
  const proof = token === TOKEN ? PROOF : proofFor(token);
  if (proof) url.searchParams.set("appsecret_proof", proof);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    const err = new Error(`${e.error_user_msg || e.message || `HTTP ${res.status}`}${e.code ? ` (code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ""})` : ""}`);
    err.code = e.code;
    throw err;
  }
  return json;
}

// pagina até o fim OU até passar da data de corte (feed vem do mais novo pro mais velho)
async function fetchUntil(pathPart, fields, dateKey, token = TOKEN) {
  const out = [];
  let params = { fields, limit: 100 };
  let guard = 0;
  for (;;) {
    const json = await graphGet(pathPart, params, token);
    const batch = json.data || [];
    out.push(...batch);
    const oldest = batch.length ? new Date(batch[batch.length - 1][dateKey]) : null;
    const cursor = json.paging?.next ? json.paging?.cursors?.after : null;
    process.stderr.write(`\r  … ${out.length} itens lidos (mais antigo: ${oldest ? oldest.toISOString().slice(0, 10) : "?"})   `);
    if (!cursor || (oldest && oldest < SINCE) || ++guard > 200) break;
    params = { fields, limit: 100, after: cursor };
  }
  process.stderr.write("\n");
  return out;
}

// ── insights (concorrência limitada, falha-suave por post) ──
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      for (;;) {
        const idx = i++;
        if (idx >= items.length) return;
        out[idx] = await fn(items[idx], idx);
        done++;
        if (done % 10 === 0 || done === items.length)
          process.stderr.write(`\r  … insights ${done}/${items.length}   `);
      }
    }),
  );
  process.stderr.write("\n");
  return out;
}

const IG_METRICS = {
  REELS: "reach,saved,shares,total_interactions,views",
  FEED: "reach,saved,shares,total_interactions,views,profile_visits",
  STORY: "reach,replies,views",
  _fallback: "reach,saved,shares,total_interactions",
};

async function igInsights(media) {
  const kind = media.media_product_type || "FEED";
  const tries = [IG_METRICS[kind] || IG_METRICS.FEED, IG_METRICS._fallback, "reach"];
  for (const metric of tries) {
    try {
      const json = await graphGet(`${media.id}/insights`, { metric });
      const vals = {};
      for (const m of json.data || []) vals[m.name] = m.values?.[0]?.value ?? "";
      return vals;
    } catch {
      /* tenta o próximo conjunto de métricas */
    }
  }
  return {};
}

// ── coleta ──────────────────────────────────────────────────
function clean(s) {
  return (s || "").replace(/\r\n/g, "\n").trim();
}

async function listIg() {
  if (!IG_USER_ID) {
    console.error("✖ META_IG_USER_ID ausente — pulei o Instagram.");
    return [];
  }
  console.error("→ Instagram");
  const fields = "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,children{media_type}";
  let media = await fetchUntil(`${IG_USER_ID}/media`, fields, "timestamp");
  media = media.filter((m) => new Date(m.timestamp) >= SINCE);
  if (!WITH_STORIES) media = media.filter((m) => (m.media_product_type || "") !== "STORY");

  let insights = [];
  if (WITH_INSIGHTS) insights = await mapLimit(media, 8, igInsights);

  return media.map((m, i) => {
    const ins = insights[i] || {};
    const curtidas = m.like_count ?? "";
    const coment = m.comments_count ?? "";
    return {
      fonte: "instagram",
      id: m.id,
      data: (m.timestamp || "").slice(0, 10),
      hora: (m.timestamp || "").slice(11, 16),
      tipo: m.media_product_type || m.media_type || "",
      formato: m.media_type || "",
      permalink: m.permalink || "",
      curtidas,
      comentarios: coment,
      engajamento: curtidas === "" && coment === "" ? "" : Number(curtidas || 0) + Number(coment || 0),
      salvamentos: ins.saved ?? "",
      compartilhamentos: ins.shares ?? "",
      alcance: ins.reach ?? "",
      visualizacoes: ins.views ?? "",
      interacoes_totais: ins.total_interactions ?? "",
      legenda: clean(m.caption),
    };
  });
}

async function listPage() {
  if (!PAGE_ID) {
    console.error("✖ META_PAGE_ID ausente — pulei a Página.");
    return [];
  }
  console.error("→ Página do Facebook");

  // /published_posts exige page access token; o de usuário só serve para pegá-lo
  let pageToken = TOKEN;
  try {
    const info = await graphGet(PAGE_ID, { fields: "name,access_token" });
    if (info.access_token) {
      pageToken = info.access_token;
      console.error(`  token da página obtido (${info.name})`);
    }
  } catch (e) {
    console.error(`  ! não consegui o token da página (${e.message}); seguindo com o de usuário`);
  }

  // cascata: o app pode não ter pages_read_engagement aprovado, e aí
  // curtidas/comentários/insights caem — mas link, data e legenda ficam.
  const NIVEIS = [
    ["completo",
      "id,message,created_time,permalink_url,shares," +
      "likes.summary(true).limit(0),comments.summary(true).limit(0)," +
      "insights.metric(post_impressions_unique){values}"],
    ["sem insights",
      "id,message,created_time,permalink_url,shares," +
      "likes.summary(true).limit(0),comments.summary(true).limit(0)"],
    ["só conteúdo", "id,message,created_time,permalink_url,shares"],
  ];

  let posts = [];
  for (const [nome, fields] of NIVEIS) {
    try {
      posts = await fetchUntil(`${PAGE_ID}/published_posts`, fields, "created_time", pageToken);
      if (nome !== "completo") console.error(`  (nível "${nome}": engajamento parcial)`);
      break;
    } catch (e) {
      console.error(`  ! nível "${nome}" recusado (${e.message.slice(0, 70)})`);
      if (nome === NIVEIS[NIVEIS.length - 1][0]) throw e;
    }
  }

  posts = posts.filter((p) => new Date(p.created_time) >= SINCE);
  return posts.map((p) => {
    const curtidas = p.likes?.summary?.total_count ?? "";
    const coment = p.comments?.summary?.total_count ?? "";
    const alcance = p.insights?.data?.find((d) => d.name === "post_impressions_unique")?.values?.[0]?.value ?? "";
    return {
      fonte: "facebook",
      id: p.id,
      data: (p.created_time || "").slice(0, 10),
      hora: (p.created_time || "").slice(11, 16),
      tipo: "post",
      formato: "",
      permalink: p.permalink_url || "",
      curtidas,
      comentarios: coment,
      engajamento: curtidas === "" && coment === "" ? "" : Number(curtidas || 0) + Number(coment || 0),
      salvamentos: "",
      compartilhamentos: p.shares?.count ?? "",
      alcance,
      visualizacoes: "",
      interacoes_totais: "",
      legenda: clean(p.message),
    };
  });
}

// ── CSV ─────────────────────────────────────────────────────
const COLS = [
  "fonte", "id", "data", "hora", "tipo", "formato", "permalink",
  "curtidas", "comentarios", "engajamento", "salvamentos", "compartilhamentos",
  "alcance", "visualizacoes", "interacoes_totais", "legenda",
];

function toCsv(rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return "﻿" + [COLS.join(","), ...rows.map((r) => COLS.map((c) => esc(r[c])).join(","))].join("\n") + "\n";
}

(async () => {
  try {
    console.error(`Janela: de ${SINCE.toISOString().slice(0, 10)} até hoje — API ${VERSION}\n`);
    const rows = [];
    if (SOURCE === "ig" || SOURCE === "both") rows.push(...(await listIg()));
    if (SOURCE === "page" || SOURCE === "both") rows.push(...(await listPage()));
    rows.sort((a, b) => (a.data + a.hora < b.data + b.hora ? 1 : -1));

    const dest = path.resolve(process.cwd(), OUT_PATH);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, toCsv(rows), "utf8");

    const porFonte = rows.reduce((acc, r) => ((acc[r.fonte] = (acc[r.fonte] || 0) + 1), acc), {});
    console.error(`\n✔ ${rows.length} posts salvos em ${dest}`);
    console.error(`  ${Object.entries(porFonte).map(([k, v]) => `${k}: ${v}`).join(" | ")}`);
    if (rows.length) console.error(`  período: ${rows[rows.length - 1].data} → ${rows[0].data}`);
  } catch (err) {
    console.error(`\n✖ ${err.message}`);
    if (/expired|code 190/i.test(err.message))
      console.error("  → Token vencido. Gere outro e rode com --token=");
    process.exit(2);
  }
})();
