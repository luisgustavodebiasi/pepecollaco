#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   Monta o cartão de compartilhamento (open graph) de um evento.

     node bin/gerar-og.mjs pepe-por-elas

   Sai em `foto/<slug>/og.jpg`, 1200×630. É chamado no fim de
   gerar-evento.mjs, mas roda sozinho para refazer só o cartão.

   Por que JPEG e não a webp da galeria: WhatsApp e boa parte dos
   agregadores não desenham webp em prévia de link. Um cartão que não
   aparece no WhatsApp é um cartão que não existe, porque é por lá que a
   página vai circular.

   A peça segue _IDENTIDADE/CLAUDE.md: véu para o texto ter contraste,
   textura de setas por cima (toda peça de compartilhamento leva, sem
   exceção), Acumin Wide Black na manchete e o lockup com o 11223.

   Divisão de trabalho entre as duas ferramentas: o ImageMagick desenha o
   texto, porque lê os .otf da identidade direto; o sharp rasteriza o SVG
   do ícone, porque o renderizador interno do ImageMagick ignora
   `fill="none"` e devolve um quadrado preto.
   ═══════════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..');
const SITE = path.join(RAIZ, '..');
const MARCA = path.join(SITE, 'assets/brand');
/* Os .otf vivem em _IDENTIDADE/dist: o site publica só woff2, e o
   ImageMagick não lê woff2. Esta peça é gerada aqui, nunca no navegador. */
const FONTES = path.join(SITE, '_IDENTIDADE/dist/fontes');

const L = 1200, A = 630;          // o formato que Facebook e WhatsApp esperam
const MARGEM = 56;

const AMARELO = '#FFC400';
const TINTA = '#061A3A';
const BRANCO = '#FEFFFF';

const magick = (args) => execFileSync('magick', args, { stdio: ['ignore', 'pipe', 'pipe'] });

/** Largura em pixels de um texto numa fonte e corpo dados. Serve para a
    pílula crescer com a frase em vez de viver com uma largura chutada. */
function larguraTexto(texto, fonte, corpo, kerning = 0) {
  const saida = magick([
    '-font', fonte, '-pointsize', String(corpo), '-kerning', String(kerning),
    `label:${texto}`, '-format', '%w', 'info:',
  ]);
  return Number(saida.toString().trim());
}

const slug = process.argv[2];
if (!slug) {
  console.error('uso: node bin/gerar-og.mjs <slug-do-evento>');
  process.exit(1);
}
const pasta = path.join(RAIZ, slug);
const evento = JSON.parse(fs.readFileSync(path.join(pasta, 'evento.json'), 'utf8'));
const dados = JSON.parse(fs.readFileSync(path.join(pasta, 'dados.json'), 'utf8'));

/* Qual foto ilustra o cartão. `og` existe separado de `capa` porque o
   recorte é outro: a capa é quase quadrada no índice e o cartão é uma
   faixa larga, então nem sempre a mesma foto serve bem nos dois. */
const idFoto = evento.og ?? evento.capa ?? dados.fotos[0].id;
const fonteFoto = path.join(pasta, 'g', `${idFoto}.webp`);
if (!fs.existsSync(fonteFoto)) {
  console.error(`não achei ${path.relative(process.cwd(), fonteFoto)} — rode gerar-evento.mjs antes`);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR ?? '/tmp', 'og-'));
const t = (n) => path.join(tmp, n);

/* ── 1. Foto, recortada na faixa e com o topo preservado ───────────────
   O corte sai de baixo: em foto de grupo o que interessa são os rostos, e
   o que sobra no pé é chão. */
magick([fonteFoto, '-resize', `${L}x${A}^`, '-gravity', 'north',
        '-crop', `${L}x${A}+0+0`, '+repage',
        '-modulate', '100,106,100',        // devolve a cor que o véu vai comer
        t('foto.png')]);

/* ── 2. Véu ───────────────────────────────────────────────────────────
   Uma faixa azul curta subindo do pé, e só. O resto da foto fica foto: é
   um grupo de duzentas pessoas, e escurecer o quadro inteiro só para
   acomodar texto joga fora o que a imagem tem de melhor.

   A curva foi calibrada medindo, não no olho: sobre esta foto o branco da
   manchete precisa de 3,0 de contraste (é texto grande) e o do subtítulo
   de 4,5 (é corpo). Com 0,98 na borda e a curva abaixo, o pior ponto da
   manchete dá 3,60 e o do subtítulo 8,29. Mexer nos números sem refazer a
   medição é chutar — a foto de cada evento tem um pé diferente, e uma
   roupa branca no canto inferior esquerdo derruba tudo.

   Por cima da faixa, no canto direito, um reforço radial: a marca tem
   branco e amarelo claro e precisa de um pouco mais de fundo do que o
   texto para não encostar na foto.

   A textura de setas entra DEPOIS do véu — o guia avisa que acima de 0,80
   ela some, e é justamente no pé que ela precisa continuar visível. */
magick(['-size', `${L}x${A}`, 'gradient:rgba(6,26,58,0.98)-rgba(6,26,58,0)',
        '-rotate', '180',                  // opaco embaixo, limpo em cima
        '-function', 'polynomial', '1.4,-0.4,0',
        t('veu-pe.png')]);
/* Radial ancorado no canto: gera-se o dobro do tamanho, com o foco no
   meio, e recorta-se o quadrante superior esquerdo — assim o centro do
   degradê cai exatamente no canto inferior direito da peça. Girar um
   degradê linear em 315° não serve: o -rotate do ImageMagick gira a tela
   toda e devolve uma cunha diagonal por cima da foto. */
magick(['-size', `${L * 2}x${A * 2}`,
        'radial-gradient:rgba(6,26,58,0.62)-rgba(6,26,58,0)',
        '-crop', `${L}x${A}+0+0`, '+repage',
        t('veu-marca.png')]);

/* ── 3. Textura de setas, a 7% ────────────────────────────────────────
   Assinatura da campanha: é o que faz a peça ser reconhecida antes de
   alguém ler uma palavra. O tile já vem branco no SVG. */
magick([path.join(MARCA, 'textura/setas-tile.svg'), '-resize', '308x491!',
        '-write', 'mpr:tile', '+delete',
        '-size', `${L}x${A}`, 'tile:mpr:tile',
        '-alpha', 'set', '-channel', 'A', '-evaluate', 'multiply', '0.07', '+channel',
        t('textura.png')]);

/* ── 4. Selo do reconhecimento ────────────────────────────────────────
   É o que esta galeria tem de diferente de um álbum qualquer, e é o
   motivo de alguém abrir o link. Fica no alto à direita, sozinho no céu
   da foto, onde nada compete com ele.

   Branco com texto tinta: ali em cima não passa véu nenhum, então a
   pílula precisa carregar o próprio contraste. Sobre o fundo branco o
   tinta dá 17:1, o par mais legível do sistema. */
const FRASE = 'ACHE A SUA FOTO PELO ROSTO';
const CORPO_SELO = 23;
const ICONE = 34;
const fonteTexto = path.join(FONTES, 'acumin-700.otf');
const larguraFrase = larguraTexto(FRASE, fonteTexto, CORPO_SELO, 1.6);
const PAD_X = 26, VAO = 13, ALTURA_SELO = 58;
const larguraSelo = PAD_X + ICONE + VAO + larguraFrase + PAD_X;

const svgIcone = fs.readFileSync(path.join(RAIZ, 'app/icone/rosto-busca.svg'), 'utf8')
  .replace(/currentColor/g, TINTA);
await sharp(Buffer.from(svgIcone)).resize(ICONE, ICONE).png().toFile(t('icone.png'));

magick(['-size', `${larguraSelo}x${ALTURA_SELO}`, 'xc:none',
        '-fill', BRANCO, '-draw',
        `roundrectangle 0,0 ${larguraSelo - 1},${ALTURA_SELO - 1} ${ALTURA_SELO / 2},${ALTURA_SELO / 2}`,
        t('icone.png'), '-gravity', 'west', '-geometry', `+${PAD_X}+0`, '-composite',
        '-font', fonteTexto, '-pointsize', String(CORPO_SELO), '-kerning', '1.6',
        '-fill', TINTA, '-gravity', 'west',
        '-annotate', `+${PAD_X + ICONE + VAO}+1`, FRASE,
        t('selo.png')]);

/* ── 5. Lockup ────────────────────────────────────────────────────────
   VOTE PEPÊ 11223: o cartão circula em rede social, é peça de campanha.
   Proporção travada — altura livre, largura automática. */
magick([path.join(MARCA, 'marca/vote-11223-escuro-480.webp'),
        '-resize', 'x148', t('marca.png')]);

/* ── 6. Composição ────────────────────────────────────────────────────
   Título e subtítulo assentam no pé, à esquerda, dentro da faixa. A marca
   ocupa o canto oposto, na mesma linha de base. O selo fica lá em cima,
   do lado direito, isolado. */
const fonteWide = path.join(FONTES, 'acumin-wide-900.otf');
const fonteLeve = path.join(FONTES, 'acumin-400.otf');

/* O subtítulo é onde o evento aconteceu. Endereço quando houver, senão a
   cidade e a data seguram a linha sozinhas — cartão sem lugar nenhum
   escrito não diz ao eleitor se aquilo foi perto dele. */
const dataExtenso = new Date(`${evento.data}T12:00:00`)
  .toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
const subtitulo = [evento.local, evento.endereco].filter(Boolean).join('  ·  ')
  || dataExtenso;

magick([
  t('foto.png'),
  t('veu-pe.png'), '-composite',
  t('veu-marca.png'), '-composite',
  t('textura.png'), '-composite',

  // manchete no pé: Wide Black, que é a largura do lockup impresso
  '-gravity', 'southwest',
  '-font', fonteWide, '-pointsize', '80', '-fill', BRANCO, '-kerning', '-1',
  '-annotate', `+${MARGEM - 5}+${MARGEM + 52}`, evento.titulo.toUpperCase(),

  // onde foi
  '-font', fonteLeve, '-pointsize', '27', '-fill', BRANCO, '-kerning', '0.5',
  '-annotate', `+${MARGEM}+${MARGEM}`, subtitulo,

  t('marca.png'), '-gravity', 'southeast',
  '-geometry', `+${MARGEM - 8}+${MARGEM - 20}`, '-composite',

  t('selo.png'), '-gravity', 'northeast',
  '-geometry', `+${MARGEM}+${MARGEM}`, '-composite',

  '-quality', '88', '-strip', '-interlace', 'Plane',
  path.join(pasta, 'og.jpg'),
]);

fs.rmSync(tmp, { recursive: true, force: true });
const peso = fs.statSync(path.join(pasta, 'og.jpg')).size;
console.log(`  og.jpg  ${L}×${A}  ${(peso / 1024).toFixed(0)} KB  (foto ${idFoto})`);
