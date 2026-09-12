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
/* A linha Pepê por Elas tem paleta própria. O rosa #F039A1 foi lido do
   degradê vetorial do bolão impresso, não escolhido de olho — ver
   "BACKDROP POR ELAS/README.md". O #932066 é o fundo do degradê, onde o
   texto branco assenta, e o #FFD9EC é o branco puxado para o rosa que o
   convite usa na linha de local. */
const ROSA = '#F039A1';          // o rosa da linha, lido do vetor do bolão
const ROSA_FUNDO = '#7A1B56';    // o pé da rampa do convite, já quase vinho
const ROSA_CLARO = '#FFD9EC';    // o branco puxado para o rosa, da linha de local

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
const fonteFoto = path.join(pasta, 'g', `${idFoto}.${dados.formato ?? 'webp'}`);
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
   Uma faixa rosa curta subindo do pé, e só. O resto da foto fica foto: é
   um grupo de duzentas pessoas, e escurecer o quadro inteiro para acomodar
   texto joga fora o que a imagem tem de melhor.

   Rosa, e não azul, porque esta é a linha Pepê por Elas: o cartão cai na
   conversa do WhatsApp logo abaixo do convite rosa que já circulou, e sair
   azul ali quebraria o reconhecimento. O degradê vai do rosa aberto,
   transparente em cima, ao #932066 quase opaco na borda de baixo — o fundo
   da rampa do convite, onde o branco tem contraste de sobra.

   A curva foi calibrada medindo, não no olho: sobre esta foto o branco do
   lockup precisa de 3,0 de contraste (é desenho grande) e o da linha de
   local de 4,5 (é corpo). Mexer nos números sem refazer a medição é
   chutar — a foto de cada evento tem um pé diferente, e uma roupa branca
   no canto inferior esquerdo derruba tudo.

   A textura de setas entra DEPOIS do véu — o guia avisa que acima de 0,80
   ela some, e é justamente no pé que ela precisa continuar visível. */
/* Um banho de rosa de leve no quadro inteiro, antes da faixa. Sem ele o
   cartão lê como foto com texto por cima; com ele a imagem já entra na
   linha, e quem viu o convite reconhece antes de ler. */
magick([t('foto.png'), '-fill', ROSA, '-colorize', '16%', t('foto.png')]);

/* Cor e opacidade são construídas separadas e casadas no fim. Tem de ser
   assim: o -function polynomial do ImageMagick mexe em TODOS os canais, e
   num degradê entre duas cores diferentes ele desmonta o rosa junto com a
   rampa — o resultado sai lavado, cor de nada. Aqui o degradê de cor sobe
   do #7A1B56 ao #F039A1 sem ser tocado, e a curva age só na máscara.

   Os números saíram de medição: com a curva anterior a linha de local dava
   3,09 de contraste e a assinatura 2,52, as duas reprovando. Com esta e o
   pé em #7A1B56 dão 5,72 e 4,59. Refaça a medição antes de mexer. */
magick(['-size', `${L}x${A}`, `gradient:${ROSA}-${ROSA_FUNDO}`, t('rosa-cor.png')]);
magick(['-size', `${L}x${A}`, 'gradient:white-black',
        '-rotate', '180',                  // opaco embaixo, limpo em cima
        '-function', 'polynomial', '2.6,-1.0,0',
        '-evaluate', 'multiply', '0.97',
        t('rosa-alfa.png')]);
magick([t('rosa-cor.png'), t('rosa-alfa.png'),
        '-alpha', 'off', '-compose', 'CopyOpacity', '-composite',
        t('veu-pe.png')]);

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

/* ── 5. Lockup Pepê por Elas ──────────────────────────────────────────
   PEPÊ em tipo e "por elas" em desenho, empilhados — é assim que o convite
   do evento está montado, e o cartão tem de ser reconhecido como parte da
   mesma peça.

   Não entra aqui o lockup VOTE PEPÊ 11223: ele traz um segundo PEPÊ
   grande, e dois lockups na mesma peça se anulam. O número aparece na
   assinatura, em texto, no canto oposto. É a mesma decisão já tomada no
   cartão do credenciamento.

   O PEPÊ sai na Acumin Pro 700, e não na Wide Black da manchete: é a
   largura que o convite publicou, e é dela que o lettering "por elas"
   transborda à direita. Na Wide o PEPÊ ficaria mais largo que o desenho e
   o degrau do lockup se perderia. */
const CORPO_PEPE = 96;
const LARGURA_PORELAS = 330;
magick(['-background', 'none',
        '-font', path.join(FONTES, 'acumin-700.otf'), '-pointsize', String(CORPO_PEPE),
        '-fill', BRANCO, '-kerning', '-2',
        'label:PEPÊ', '-trim', '+repage', t('pepe.png')]);
magick([path.join(RAIZ, 'app/marca/por-elas-branco-900.png'),
        '-resize', `${LARGURA_PORELAS}x`, t('porelas.png')]);

const alturaPepe = Number(magick([t('pepe.png'), '-format', '%h', 'info:']).toString());
const alturaPorElas = Number(magick([t('porelas.png'), '-format', '%h', 'info:']).toString());
/* O desenho encosta no tipo: no convite o "p" do lettering sobe por trás do
   PEPÊ. 14 px de sobreposição reproduzem esse encaixe nesta escala. */
const SOBREPOR = 14;
const alturaLockup = alturaPepe + alturaPorElas - SOBREPOR;
magick(['-size', `${LARGURA_PORELAS}x${alturaLockup}`, 'xc:none',
        t('pepe.png'), '-gravity', 'northwest', '-geometry', '+0+0', '-composite',
        t('porelas.png'), '-gravity', 'northwest',
        '-geometry', `+0+${alturaPepe - SOBREPOR}`, '-composite',
        t('lockup-limpo.png')]);

/* Sombra atrás do lockup. Não é enfeite: o topo do desenho fica a quase
   metade da altura do cartão, onde a faixa rosa já é transparente, e medindo
   ali o branco dá 2,4 sobre a foto — reprova até como texto grande. Subir a
   faixa até lá enterraria a foto, que é o conteúdo. A sombra resolve no
   lugar, e é o que o convite publicado também faz no PEPÊ. */
/* A sombra é construída à mão numa tela de tamanho fixo, e não com o
   `-shadow` + `-layers merge` do ImageMagick. O merge recalcula a tela
   conforme o borrão e reposiciona o conteúdo: medindo, o desenho acabava
   em (22,22) de uma tela de 470×371 em vez dos (70,70) pedidos, e o
   lockup ia encostar na borda esquerda do cartão. Aqui nada redimensiona,
   então a posição é a que está escrita.

   A sombra não é enfeite: o topo do desenho fica a quase metade da altura
   do cartão, onde a faixa rosa já é transparente, e ali o branco mede 2,4
   de contraste sobre a foto — reprova até como texto grande. Subir a faixa
   até lá enterraria a foto, que é o conteúdo. É o mesmo recurso que o
   convite publicado usa no PEPÊ. Com ela o pior ponto do lockup sai de
   2,84 para 3,10, que é o mínimo exigido de texto grande com folga. */
/* A margem tem de ser maior que o alcance do borrão (uns 3 sigmas), senão
   a sombra é cortada na borda da tela e aparece um vinco reto. */
const SOMBRA_BORRAO = 36;
const PAD_SOMBRA = SOMBRA_BORRAO * 3 + 20;
const SOMBRA_QUEDA = 12;
const larguraComSombra = LARGURA_PORELAS + PAD_SOMBRA * 2;
const alturaComSombra = alturaLockup + PAD_SOMBRA * 2;

magick(['-size', `${larguraComSombra}x${alturaComSombra}`, 'xc:none',
        t('lockup-limpo.png'), '-gravity', 'northwest',
        '-geometry', `+${PAD_SOMBRA}+${PAD_SOMBRA}`, '-composite',
        t('lockup-base.png')]);
magick([t('lockup-base.png'), '-alpha', 'extract',
        '-blur', `0x${SOMBRA_BORRAO}`, '-evaluate', 'multiply', '0.95',
        t('sombra-mascara.png')]);
magick(['-size', `${larguraComSombra}x${alturaComSombra}`, 'xc:#2D0620',
        t('sombra-mascara.png'), '-alpha', 'off', '-compose', 'CopyOpacity', '-composite',
        '-roll', `+0+${SOMBRA_QUEDA}`,
        t('sombra.png')]);
magick([t('sombra.png'), t('lockup-base.png'), '-composite', t('lockup.png')]);

/* ── 6. Composição ────────────────────────────────────────────────────
   Lockup e linha de local assentam no pé, à esquerda, dentro da faixa. A
   assinatura com o número ocupa o canto oposto, na mesma linha de base. O
   selo do reconhecimento fica lá em cima, do lado direito, isolado. */
const fonteLeve = path.join(FONTES, 'acumin-400.otf');

/* A linha diz onde o evento foi. Endereço na frente e cidade atrás, que é
   como se lê um convite; sem endereço, a cidade segura sozinha. Cartão sem
   lugar nenhum escrito não diz ao eleitor se aquilo foi perto dele. */
const ondeFoi = [evento.endereco, evento.local].filter(Boolean).join('  ·  ');

magick([
  t('foto.png'),
  t('veu-pe.png'), '-composite',
  t('textura.png'), '-composite',

  t('lockup.png'), '-gravity', 'southwest',
  '-geometry', `+${MARGEM - PAD_SOMBRA}+${MARGEM + 46 - PAD_SOMBRA}`, '-composite',

  // onde foi, no rosa claro do convite
  '-gravity', 'southwest',
  '-font', fonteLeve, '-pointsize', '26', '-fill', ROSA_CLARO, '-kerning', '1.2',
  '-annotate', `+${MARGEM + 3}+${MARGEM}`, ondeFoi,

  /* A assinatura é o que mantém o número na peça, já que o lockup do VOTE
     não entra. Amarelo sobre o fundo da faixa: o par de maior contraste
     que o sistema tem depois do branco. */
  '-gravity', 'southeast',
  '-font', path.join(FONTES, 'acumin-700.otf'), '-pointsize', '22',
  '-fill', AMARELO, '-kerning', '3',
  '-annotate', `+${MARGEM}+${MARGEM + 2}`, 'PEPÊ COLLAÇO 11223',

  t('selo.png'), '-gravity', 'northeast',
  '-geometry', `+${MARGEM}+${MARGEM}`, '-composite',

  '-quality', '88', '-strip', '-interlace', 'Plane',
  path.join(pasta, 'og.jpg'),
]);

fs.rmSync(tmp, { recursive: true, force: true });
const peso = fs.statSync(path.join(pasta, 'og.jpg')).size;
console.log(`  og.jpg  ${L}×${A}  ${(peso / 1024).toFixed(0)} KB  (foto ${idFoto})`);
