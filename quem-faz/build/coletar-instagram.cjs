#!/usr/bin/env node
/**
 * coletar-instagram.cjs — puxa os posts do @pepecollaco pela Graph API, baixa
 * a capa de cada um e grava dados/instagram.json, que alimenta os blocos
 * "Nas redes" das páginas.
 *
 *   node build/coletar-instagram.cjs                  # posts desde 01/09/2026
 *   node build/coletar-instagram.cjs --desde=2026-08-16
 *   node build/coletar-instagram.cjs --so-capas       # não chama a API, usa o cache
 *   node build/coletar-instagram.cjs --refazer-capas  # baixa todas as capas de novo
 *   node build/coletar-instagram.cjs --incluir=DBuCrSKJaHK,C-SynpCuRnO
 *                                     # posts mais antigos citados nas páginas
 *
 * O token NUNCA entra no repositório, que é público. Ele é lido, nesta ordem, de:
 *   1) variável de ambiente META_TOKEN
 *   2) IMPULSIONAMENTOS/scripts/token.txt (fora do Git pelo .gitignore)
 *
 * Tokens desta conta vencem em cerca de duas horas. Por isso a coleta guarda a
 * resposta crua em build/.cache/ (também fora do Git): as URLs de CDN da Meta
 * continuam valendo alguns dias depois que o token vence, e as capas que
 * faltarem podem ser baixadas depois com --so-capas.
 *
 * As capas saem em WebP de 720 px de largura em redes/capas/<shortcode>.webp.
 * Reels usam a capa escolhida na publicação (thumbnail_url); carrossel usa a
 * primeira imagem. Quando a capa de um vídeo não serve (tela de texto, quadro
 * preto), `--quadro=SHORTCODE@SEGUNDOS` tira um quadro do próprio vídeo com o
 * ffmpeg e grava no lugar da capa.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ_QF = path.join(__dirname, '..');
const PROJETO = path.join(RAIZ_QF, '..');
const CACHE = path.join(__dirname, '.cache');
const ARQ_BRUTO = path.join(CACHE, 'instagram-bruto.json');
const DIR_CAPAS = path.join(RAIZ_QF, 'redes', 'capas');
const ARQ_SAIDA = path.join(RAIZ_QF, 'dados', 'instagram.json');

const IG_USER = '17841401444333135';
const API = 'https://graph.facebook.com/v21.0';
const CAMPOS = [
  'id', 'shortcode', 'caption', 'media_type', 'media_product_type', 'permalink',
  'thumbnail_url', 'media_url', 'timestamp', 'like_count', 'comments_count',
  'children{media_type,media_url,thumbnail_url}',
].join(',');

const args = process.argv.slice(2);
const opt = (nome, padrao) => {
  const a = args.find((x) => x.startsWith(`--${nome}=`));
  return a ? a.slice(nome.length + 3) : padrao;
};
const DESDE = opt('desde', '2026-09-01');
const SO_CAPAS = args.includes('--so-capas');
// Baixa de novo a capa mesmo que o arquivo já exista (capa trocada no
// Instagram depois da publicação).
const REFAZER_CAPAS = args.includes('--refazer-capas');
// Posts anteriores a --desde que alguma página cita pelo shortcode (as páginas
// das leis mostram o post da sanção, que é de 2024).
// Os já incluídos numa rodada anterior continuam: a lista só cresce, para uma
// coleta nova não derrubar o post que uma página já cita.
const INCLUIR = new Set(opt('incluir', '').split(',').filter(Boolean));
if (fs.existsSync(ARQ_SAIDA)) {
  for (const sc of JSON.parse(fs.readFileSync(ARQ_SAIDA, 'utf8')).incluidos || []) INCLUIR.add(sc);
}
// Até onde a listagem volta. O perfil tem posts desde 2016; as páginas não
// citam nada anterior ao mandato.
const LIMITE = opt('ate', '2023-01-01');
const QUADROS = args.filter((a) => a.startsWith('--quadro=')).map((a) => a.slice(9));

function token() {
  if (process.env.META_TOKEN) return process.env.META_TOKEN.trim();
  const arq = path.join(PROJETO, 'IMPULSIONAMENTOS', 'scripts', 'token.txt');
  if (fs.existsSync(arq)) return fs.readFileSync(arq, 'utf8').trim();
  throw new Error('Sem token: defina META_TOKEN ou grave IMPULSIONAMENTOS/scripts/token.txt');
}

async function puxarTudo() {
  const tk = token();
  let url = `${API}/${IG_USER}/media?fields=${encodeURIComponent(CAMPOS)}&limit=100&access_token=${tk}`;
  const todos = [];
  while (url) {
    const r = await fetch(url);
    const j = await r.json();
    if (j.error) throw new Error(`Graph API: ${j.error.message}`);
    todos.push(...j.data);
    process.stdout.write(`\r  ${todos.length} posts`);
    const ultimo = j.data[j.data.length - 1];
    if (ultimo && ultimo.timestamp < LIMITE) break;
    url = j.paging && j.paging.next;
  }
  process.stdout.write('\n');
  return todos;
}

/** URL da imagem que representa o post. */
function urlCapa(m) {
  if (m.media_type === 'VIDEO') return m.thumbnail_url;
  if (m.media_type === 'CAROUSEL_ALBUM') {
    const c = (m.children && m.children.data && m.children.data[0]) || {};
    return c.media_type === 'VIDEO' ? c.thumbnail_url : c.media_url;
  }
  return m.media_url;
}

/** URL do vídeo, para tirar quadro. */
function urlVideo(m) {
  if (m.media_type === 'VIDEO') return m.media_url;
  const c = (m.children && m.children.data || []).find((x) => x.media_type === 'VIDEO');
  return c && c.media_url;
}

function paraWebp(origem, destino) {
  execFileSync('magick', [origem, '-auto-orient', '-resize', '720x>', '-strip', '-quality', '78', destino]);
}

function dimensoes(arq) {
  const out = execFileSync('magick', ['identify', '-format', '%w %h', arq]).toString().trim();
  const [w, h] = out.split(' ').map(Number);
  return { w, h };
}

async function baixar(url, destino) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

function tipo(m) {
  if (m.media_product_type === 'REELS') return 'reel';
  if (m.media_type === 'CAROUSEL_ALBUM') return 'carrossel';
  if (m.media_type === 'VIDEO') return 'video';
  return 'foto';
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  fs.mkdirSync(DIR_CAPAS, { recursive: true });

  let bruto;
  if (SO_CAPAS) {
    bruto = JSON.parse(fs.readFileSync(ARQ_BRUTO, 'utf8'));
    console.log(`cache: ${bruto.posts.length} posts de ${bruto.coletadoEm}`);
  } else {
    console.log('Graph API: listando posts do @pepecollaco');
    bruto = { coletadoEm: new Date().toISOString(), posts: await puxarTudo() };
    fs.writeFileSync(ARQ_BRUTO, JSON.stringify(bruto));
  }

  const escolhidos = bruto.posts.filter(
    (m) => m.timestamp.slice(0, 10) >= DESDE || INCLUIR.has(m.shortcode)
  );
  const faltam = [...INCLUIR].filter((sc) => !bruto.posts.some((m) => m.shortcode === sc));
  if (faltam.length) console.log(`não achados no perfil: ${faltam.join(', ')}`);
  console.log(`${escolhidos.length} posts (desde ${DESDE}, mais ${INCLUIR.size} citados)`);

  const tmp = path.join(CACHE, 'tmp');
  fs.mkdirSync(tmp, { recursive: true });
  const falhas = [];

  for (const m of escolhidos) {
    const destino = path.join(DIR_CAPAS, `${m.shortcode}.webp`);
    if (fs.existsSync(destino) && !REFAZER_CAPAS) continue;
    const url = urlCapa(m);
    if (!url) { falhas.push(`${m.shortcode}: sem capa`); continue; }
    try {
      const bruta = path.join(tmp, `${m.shortcode}.jpg`);
      await baixar(url, bruta);
      paraWebp(bruta, destino);
    } catch (e) {
      falhas.push(`${m.shortcode}: ${e.message}`);
    }
  }

  // Quadros tirados do vídeo, no lugar da capa: --quadro=SHORTCODE@SEGUNDOS
  for (const q of QUADROS) {
    const [sc, seg] = q.split('@');
    const m = bruto.posts.find((x) => x.shortcode === sc);
    const video = m && urlVideo(m);
    if (!video) { falhas.push(`${sc}: sem vídeo para tirar quadro`); continue; }
    const png = path.join(tmp, `${sc}-quadro.png`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(seg || 1), '-i', video, '-frames:v', '1', png]);
    paraWebp(png, path.join(DIR_CAPAS, `${sc}.webp`));
    console.log(`  quadro de ${sc} em ${seg}s`);
  }

  const posts = escolhidos
    .filter((m) => fs.existsSync(path.join(DIR_CAPAS, `${m.shortcode}.webp`)))
    .map((m) => {
      const { w, h } = dimensoes(path.join(DIR_CAPAS, `${m.shortcode}.webp`));
      return {
        shortcode: m.shortcode,
        data: m.timestamp.slice(0, 10),
        tipo: tipo(m),
        link: m.permalink,
        curtidas: m.like_count || 0,
        comentarios: m.comments_count || 0,
        legenda: (m.caption || '').trim(),
        capa: `redes/capas/${m.shortcode}.webp`,
        capaW: w,
        capaH: h,
      };
    });

  fs.writeFileSync(ARQ_SAIDA, JSON.stringify({
    geradoEm: new Date().toISOString().slice(0, 10),
    desde: DESDE,
    incluidos: [...INCLUIR],
    total: posts.length,
    posts,
  }, null, 1) + '\n');

  console.log(`dados/instagram.json: ${posts.length} posts com capa`);
  if (falhas.length) console.log(`falhas (${falhas.length}):\n  ${falhas.join('\n  ')}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
