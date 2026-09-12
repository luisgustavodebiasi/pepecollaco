#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   Publica um evento na galeria: derivados de imagem + índice + rostos.

     node bin/gerar-evento.mjs pepe-por-elas

   Lê  foto/<slug>/evento.json  e escreve, dentro da mesma pasta:
     p/0001.webp      miniatura da grade   (480 px)
     g/0001.webp      foto aberta e baixada (1800 px)
     dados.json       lista de fotos + caixa e qualidade de cada rosto
     rostos.bin       vetores de 512 dimensões em int8
     index.html       a página, a partir de app/molde-evento.html
     og.jpg           o cartão de compartilhamento, por gerar-og.mjs

   As fotos originais NÃO entram no repositório: ficam no HD do gabinete.
   O que se publica são os derivados, e é por isso que este script existe.
   ═══════════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import ort from 'onnxruntime-node';
import { detectar, descrever, alinhar } from '../app/rosto.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..');

/* ── Ajustes ────────────────────────────────────────────────────────────
   O lado grande de 1800 px é o que se vê e o que se baixa: dá para postar
   no Instagram e imprimir um 10×15 sem serrilhado, e pesa ~240 KB. Quem
   quiser o arquivo de câmera pede ao gabinete — 2,3 GB não vão para o git. */
const LADO_GRANDE = 1800;
const LADO_PEQUENO = 480;
const QUALIDADE_GRANDE = 80;
const QUALIDADE_PEQUENA = 72;

/* Filtros de qualidade do rosto, medidos na imagem de trabalho (1800 px).
   Existem porque rosto pequeno e fora de foco gera vetor pouco
   discriminativo: sem isto a busca devolve estranhos com cara de acerto.
   São permissivos de propósito — quem decide é o limiar da busca, e é
   melhor indexar um rosto fraco e ranqueá-lo baixo do que perdê-lo. */
const MIN_LADO = 55;      // largura da caixa, em pixels
const MIN_NITIDEZ = 18;   // variância do laplaciano no recorte alinhado
const MIN_FRONTAL = 0.2;  // 1 = de frente, 0 = perfil

/* ── Métricas de qualidade ──────────────────────────────────────────── */

/** Variância do laplaciano sobre o recorte alinhado, em cinza. */
function nitidez(rgb) {
  const g = new Float32Array(112 * 112);
  for (let i = 0; i < 112 * 112; i++) {
    g[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
  }
  let soma = 0, soma2 = 0, n = 0;
  for (let y = 1; y < 111; y++) {
    for (let x = 1; x < 111; x++) {
      const i = y * 112 + x;
      const l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - 112] - g[i + 112];
      soma += l; soma2 += l * l; n++;
    }
  }
  return soma2 / n - (soma / n) ** 2;
}

/** Quanto o nariz se afasta do meio dos olhos, normalizado pela distância
    entre eles. Perfil fecha em 0 e casa mal com selfie, que é sempre frontal. */
function frontalidade([oe, od, nz]) {
  const meio = (oe[0] + od[0]) / 2;
  const entreOlhos = Math.hypot(od[0] - oe[0], od[1] - oe[1]) || 1;
  return Math.max(0, 1 - (Math.abs(nz[0] - meio) / entreOlhos) * 1.6);
}

/** Nota de 0 a 1 que resume tamanho, nitidez e frontalidade. A busca usa
    isto para exigir mais semelhança de um rosto ruim do que de um bom. */
function notaQualidade(lado, nit, fr) {
  const t = Math.min(1, lado / 220);
  const n = Math.min(1, Math.log10(1 + nit) / Math.log10(1 + 600));
  return +(0.4 * t + 0.4 * n + 0.2 * fr).toFixed(3);
}

/* ── Execução ───────────────────────────────────────────────────────── */

const slug = process.argv[2];
/* Mexer no texto da página não deveria custar os 90 segundos de reprocessar
   260 fotos. Com --so-pagina o script reaproveita o dados.json que já existe
   e só refaz o index.html e o cartão de compartilhamento. */
const soPagina = process.argv.includes('--so-pagina');
if (!slug) {
  console.error('uso: node bin/gerar-evento.mjs <slug-do-evento> [--so-pagina]');
  process.exit(1);
}
const pastaEvento = path.join(RAIZ, slug);
const arquivoConfig = path.join(pastaEvento, 'evento.json');
if (!fs.existsSync(arquivoConfig)) {
  console.error(`não achei ${path.relative(process.cwd(), arquivoConfig)}`);
  process.exit(1);
}
const evento = JSON.parse(fs.readFileSync(arquivoConfig, 'utf8'));
if (!soPagina && !fs.existsSync(evento.origem)) {
  console.error(`a pasta de origem não está montada: ${evento.origem}`);
  process.exit(1);
}

let fotos;
let rostos = [];
let vetores = [];   // Float32Array de 512, um por rosto indexado

if (soPagina) {
  const anterior = JSON.parse(fs.readFileSync(path.join(pastaEvento, 'dados.json'), 'utf8'));
  fotos = anterior.fotos;
  console.log(`${evento.titulo} · reaproveitando ${fotos.length} fotos já processadas`);
} else {

const origens = fs.readdirSync(evento.origem)
  .filter((f) => /\.(jpe?g|png|webp|heic)$/i.test(f) && !f.startsWith('.'))
  .sort();                 // o número sequencial da câmera já é a ordem do evento
if (!origens.length) {
  console.error('nenhuma imagem na pasta de origem');
  process.exit(1);
}

for (const sub of ['p', 'g']) {
  fs.rmSync(path.join(pastaEvento, sub), { recursive: true, force: true });
  fs.mkdirSync(path.join(pastaEvento, sub), { recursive: true });
}

console.log(`${evento.titulo} · ${origens.length} imagens`);
const detector = await ort.InferenceSession.create(path.join(RAIZ, 'modelos/det_500m.onnx'));
const descritor = await ort.InferenceSession.create(path.join(RAIZ, 'modelos/w600k_mbf.onnx'));

fotos = [];
const inicio = Date.now();

for (const [indice, nome] of origens.entries()) {
  const id = String(indice + 1).padStart(4, '0');
  const fonte = sharp(path.join(evento.origem, nome), { limitInputPixels: false })
    .rotate();          // aplica a orientação do EXIF antes de qualquer corte

  /* Decodifica UMA vez para os pixels de trabalho. Dali saem os dois
     derivados e a detecção — decodificar um JPEG de 25 MP três vezes
     triplicaria o tempo sem melhorar nada que se veja na tela. */
  const { data, info } = await fonte
    .removeAlpha()
    .resize({ width: LADO_GRANDE, height: LADO_GRANDE, fit: 'inside', withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const img = { dados: data, largura: info.width, altura: info.height };
  const cru = { raw: { width: info.width, height: info.height, channels: 3 } };

  await sharp(data, cru).webp({ quality: QUALIDADE_GRANDE })
    .toFile(path.join(pastaEvento, 'g', `${id}.webp`));
  await sharp(data, cru)
    .resize({ width: LADO_PEQUENO, height: LADO_PEQUENO, fit: 'inside' })
    .webp({ quality: QUALIDADE_PEQUENA })
    .toFile(path.join(pastaEvento, 'p', `${id}.webp`));

  let indexados = 0;
  for (const r of await detectar(detector, img, ort.Tensor)) {
    const lado = r.caixa[2] - r.caixa[0];
    if (lado < MIN_LADO) continue;
    const recorte = alinhar(img, r.pontos);
    const nit = nitidez(recorte);
    const fr = frontalidade(r.pontos);
    if (nit < MIN_NITIDEZ || fr < MIN_FRONTAL) continue;
    vetores.push(await descrever(descritor, img, r.pontos, ort.Tensor));
    rostos.push({
      foto: fotos.length,
      // caixa em milésimos da largura/altura, para o marcador da página
      caixa: [
        Math.round((r.caixa[0] / info.width) * 1000),
        Math.round((r.caixa[1] / info.height) * 1000),
        Math.round((lado / info.width) * 1000),
        Math.round(((r.caixa[3] - r.caixa[1]) / info.height) * 1000),
      ],
      q: notaQualidade(lado, nit, fr),
    });
    indexados++;
  }

  fotos.push({ id, l: info.width, a: info.height, r: indexados });
  if ((indice + 1) % 10 === 0 || indice === origens.length - 1) {
    const s = (Date.now() - inicio) / 1000;
    process.stdout.write(
      `\r  ${indice + 1}/${origens.length} · ${rostos.length} rostos · ${s.toFixed(0)}s`
    );
  }
}
console.log();

/* ── Vetores em int8 ────────────────────────────────────────────────────
   Os vetores saem normalizados em L2, então |x| nunca passa de 1 e na
   prática fica perto de 0,2. Uma escala única para o lote inteiro leva o
   erro de cosseno para a terceira casa — invisível diante de um limiar de
   0,42 — e derruba o download para um quarto do tamanho. */
let maiorAbs = 0;
for (const v of vetores) for (const x of v) maiorAbs = Math.max(maiorAbs, Math.abs(x));
const escala = 127 / (maiorAbs || 1);
const bin = Buffer.alloc(vetores.length * 512);
vetores.forEach((v, i) => {
  for (let k = 0; k < 512; k++) {
    bin[i * 512 + k] = Math.max(-127, Math.min(127, Math.round(v[k] * escala))) & 0xff;
  }
});
fs.writeFileSync(path.join(pastaEvento, 'rostos.bin'), bin);

const dados = {
  evento: {
    slug,
    titulo: evento.titulo,
    subtitulo: evento.subtitulo ?? '',
    data: evento.data,
    local: evento.local ?? '',
    credito: evento.credito ?? '',
  },
  gerado: new Date().toISOString(),
  fotos,
  rostos: {
    n: rostos.length,
    dim: 512,
    escala: +escala.toFixed(4),
    foto: rostos.map((r) => r.foto),
    caixa: rostos.flatMap((r) => r.caixa),
    q: rostos.map((r) => r.q),
  },
};
fs.writeFileSync(path.join(pastaEvento, 'dados.json'), JSON.stringify(dados));

}   // fim do processamento pesado

/* ── Página ─────────────────────────────────────────────────────────── */
const molde = fs.readFileSync(path.join(RAIZ, 'app/molde-evento.html'), 'utf8');
const substituicoes = {
  TITULO: evento.titulo,
  SUBTITULO: evento.subtitulo ?? '',
  SLUG: slug,
  DATA_ISO: evento.data,
  DATA_EXTENSO: new Date(`${evento.data}T12:00:00`).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }),
  LOCAL: evento.local ?? '',
  CREDITO: evento.credito ?? '',
  TOTAL: String(fotos.length),
};
fs.writeFileSync(
  path.join(pastaEvento, 'index.html'),
  molde.replace(/\{\{(\w+)\}\}/g, (m, chave) => substituicoes[chave] ?? m)
);

/* ── Cartão de compartilhamento ─────────────────────────────────────── */
execFileSync(process.execPath, [path.join(AQUI, 'gerar-og.mjs'), slug], { stdio: 'inherit' });

const peso = (sub) => fs.readdirSync(path.join(pastaEvento, sub))
  .reduce((t, f) => t + fs.statSync(path.join(pastaEvento, sub, f)).size, 0);
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;
if (!soPagina) {
  console.log(`
  ${fotos.length} fotos · ${rostos.length} rostos indexados
  miniaturas  ${mb(peso('p'))}
  grandes     ${mb(peso('g'))}
  rostos.bin  ${mb(fs.statSync(path.join(pastaEvento, 'rostos.bin')).size)}`);
}
console.log(`
  → /foto/${slug}/

  Falta ligar o evento em foto/eventos.json para ele aparecer no índice.`);
