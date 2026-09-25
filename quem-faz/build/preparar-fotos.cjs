#!/usr/bin/env node
/**
 * preparar-fotos.cjs — lê dados/fotos.json e grava img/<id>.webp, já recortada
 * na proporção em que a página usa.
 *
 *   node build/preparar-fotos.cjs            # só as que ainda não existem
 *   node build/preparar-fotos.cjs --refazer  # todas de novo
 *   node build/preparar-fotos.cjs porta-sul  # só estas
 *
 * Precisa do ImageMagick (`magick`) e, para os quadros de vídeo, do `ffmpeg`
 * e dos reels baixados por coletar-instagram.cjs em build/.cache/video/.
 * Esses vídeos ficam fora do Git: se faltarem, rode antes
 *   node build/coletar-instagram.cjs --so-capas
 * ou baixe só o que for preciso a partir do cache.
 *
 * Foto de banco (Pexels) vem do CDN público deles pelo id. A licença do Pexels
 * dispensa crédito, mas a página marca cada uma como ilustrativa.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ_QF = path.join(__dirname, '..');
const PROJETO = path.join(RAIZ_QF, '..');
const CACHE = path.join(__dirname, '.cache');
const SAIDA = path.join(RAIZ_QF, 'img');

const args = process.argv.slice(2);
const REFAZER = args.includes('--refazer');
const PEDIDOS = args.filter((a) => !a.startsWith('--'));

const magick = (...a) => execFileSync('magick', a, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();

async function baixar(url, destino) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

/** Devolve o caminho de um arquivo bruto, já no disco, para a origem pedida. */
async function bruto(foto) {
  const o = foto.origem;
  const tmp = path.join(CACHE, 'fotos');
  fs.mkdirSync(tmp, { recursive: true });

  if (o.tipo === 'arquivo') {
    const p = path.join(PROJETO, o.caminho);
    if (!fs.existsSync(p)) throw new Error(`não existe: ${o.caminho}`);
    return p;
  }

  if (o.tipo === 'pexels') {
    const p = path.join(tmp, `pexels-${o.id}.jpg`);
    if (!fs.existsSync(p)) {
      await baixar(`https://images.pexels.com/photos/${o.id}/pexels-photo-${o.id}.jpeg?auto=compress&cs=tinysrgb&w=2000`, p);
    }
    return p;
  }

  if (o.tipo === 'video') {
    const video = path.join(CACHE, 'video', `${o.shortcode}.mp4`);
    if (!fs.existsSync(video)) throw new Error(`falta o vídeo ${o.shortcode} em build/.cache/video/`);
    const p = path.join(tmp, `${o.shortcode}@${o.segundos}.png`);
    if (!fs.existsSync(p)) {
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(o.segundos), '-i', video, '-frames:v', '1', p]);
    }
    return p;
  }

  throw new Error(`origem desconhecida: ${o.tipo}`);
}

/** Maior retângulo na proporção pedida, ancorado na vertical (e centrado na horizontal). */
function geometria(w, h, proporcao, ancora = 0.5) {
  const [pw, ph] = proporcao.split(':').map(Number);
  const alvo = pw / ph;
  let cw = w;
  let ch = Math.round(w / alvo);
  if (ch > h) { ch = h; cw = Math.round(h * alvo); }
  const x = Math.round((w - cw) / 2);
  const y = Math.round((h - ch) * ancora);
  return `${cw}x${ch}+${x}+${y}`;
}

async function preparar(foto) {
  const destino = path.join(SAIDA, `${foto.id}.webp`);
  if (fs.existsSync(destino) && !REFAZER) return 'existe';

  const origem = await bruto(foto);
  const [w, h] = magick('identify', '-format', '%w %h', `${origem}[0]`).split(' ').map(Number);

  const passos = [`${origem}[0]`, '-auto-orient'];
  if (foto.recorte) passos.push('-crop', geometria(w, h, foto.recorte.proporcao, foto.recorte.ancora), '+repage');
  passos.push('-resize', `${foto.largura || 1000}x>`);

  // Tom azul: bicromia da identidade, de tinta (#061A3A) a azul claro (#8BC1DC).
  // Usada no Cine Azul, onde a cor é o próprio assunto.
  if (foto.tom === 'azul') {
    passos.push('-colorspace', 'gray', '-level', '4%,96%', '+level-colors', '#061A3A,#8BC1DC', '-colorspace', 'sRGB');
  }

  passos.push('-strip', '-quality', '76', destino);
  magick(...passos);
  return 'feita';
}

async function main() {
  const { fotos } = JSON.parse(fs.readFileSync(path.join(RAIZ_QF, 'dados', 'fotos.json'), 'utf8'));
  fs.mkdirSync(SAIDA, { recursive: true });

  const alvos = PEDIDOS.length ? fotos.filter((f) => PEDIDOS.includes(f.id)) : fotos;
  const falhas = [];
  let feitas = 0;

  for (const f of alvos) {
    try {
      if ((await preparar(f)) === 'feita') {
        feitas += 1;
        const kb = (fs.statSync(path.join(SAIDA, `${f.id}.webp`)).size / 1024).toFixed(0);
        console.log(`  ${f.id.padEnd(26)} ${kb} KB`);
      }
    } catch (e) {
      falhas.push(`${f.id}: ${e.message}`);
    }
  }

  console.log(`\n${feitas} foto(s) gerada(s) em img/.`);
  if (falhas.length) {
    console.error(`falhas:\n  ${falhas.join('\n  ')}`);
    process.exit(1);
  }
}

main();
