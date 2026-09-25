#!/usr/bin/env node
/**
 * atualizar-manuais.cjs — leva as peças novas (série de vídeos, posts com
 * capa, cards das leis e o link para o índice) às quatro páginas QUEM FAZ
 * que ainda são escritas à mão: pelo-autismo, pelo-sul, pela-educacao e
 * pelas-cidades.
 *
 *   node build/atualizar-manuais.cjs
 *   node build/atualizar-manuais.cjs pelo-autismo
 *
 * O que muda em cada página, e só isso:
 *   1. o trecho entre <!-- visual:inicio --> e <!-- visual:fim -->, logo antes
 *      do fecho, é refeito a partir de dados/manuais.json (na primeira vez o
 *      par de marcas é criado);
 *   2. na grade "Quem faz pelo quê", a porta de Projetos de lei deixa de ser
 *      "em breve" e ganha link, e entra a porta para o índice.
 *
 * Roda de novo sem acumular nada: o trecho marcado é substituído, não somado.
 * Quando estas páginas migrarem para o gerador (lugares.json), este script
 * perde a razão de existir.
 */

const fs = require('fs');
const path = require('path');
const { contexto, ler } = require('./lib/contexto.cjs');
const visual = require('./modelo/visual.cjs');
const { cardLei, indexar } = require('./modelo/leis.cjs');
const { sprite } = require('./lib/icones.cjs');

const RAIZ = path.join(__dirname, '..');
const QF = '../';
const INICIO = '<!-- visual:inicio -->';
const FIM = '<!-- visual:fim -->';
const FECHO = '  <section class="fundo-campanha veu">\n    <div class="wrap fecho">';

const PORTA_VAZIA = '<span class="porta-vazia"><span class="rot">Quem faz</span><span class="alvo">Projetos de lei</span></span>';
const PORTA_LEIS = '<a href="../projetos-de-lei/"><span class="rot">Quem faz</span><span class="alvo">Projetos de lei</span></a>';
const PORTA_INDICE = '<a class="porta-indice" href="../"><span class="rot">Todas as páginas</span><span class="alvo">Quem faz representa</span></a>';

function blocoLeis(b, ctx, classe) {
  const { proposicao } = indexar(ctx);
  const porSlug = new Map(ctx.leisPaginas.destaques.map((d) => [d.slug, d]));
  const cards = b.slugs.map((slug) => {
    const d = porSlug.get(slug);
    if (!d) throw new Error(`lei "${slug}" não existe em leis-paginas.json`);
    return cardLei(d, proposicao(d.codigo), ctx, QF, '../projetos-de-lei/');
  });
  return visual.secao(
    `${visual.cabeca(b)}\n\n      <div class="leis-foto leis-foto-mini">\n${cards.join('\n')}\n      </div>`,
    { id: 'leis-paginas', classe }
  );
}

function montarTrecho(blocos, ctx) {
  // Fundo alternado: a seção anterior ao trecho é lisa nas quatro páginas e o
  // fecho que vem depois é degradê. A série vai no degradê, menos quando é a
  // última (encostaria no fecho, que também é degradê).
  let anterior = '';
  const secoes = blocos.map((b, i) => {
    const ultima = i === blocos.length - 1;
    let classe;
    if (b.tipo === 'serie' && !ultima) classe = 'fundo-campanha veu';
    else classe = anterior === 'faixa-clara' ? '' : 'faixa-clara';
    anterior = classe;

    if (b.tipo === 'serie') return visual.serie({ ...b, classe }, ctx, QF);
    if (b.tipo === 'leis') return blocoLeis(b, ctx, classe);
    if (b.tipo === 'vitrine') {
      const excluir = [...(b.excluir || []), ...(b.excluirSerie ? ctx.indice.serie.map((s) => s.shortcode) : [])];
      return visual.vitrine({ ...b, excluir, classe, id: 'nas-redes' }, ctx, QF);
    }
    throw new Error(`bloco de tipo "${b.tipo}" não existe`);
  });

  // Os ícones das peças apontam para um sprite; estas páginas não têm um no
  // topo, então ele vai junto, dentro do trecho.
  return `${INICIO}\n${sprite()}\n\n${secoes.join('\n\n')}\n\n  ${FIM}\n`;
}

function atualizar(slug, blocos, ctx) {
  const arq = path.join(RAIZ, slug, 'index.html');
  let html = fs.readFileSync(arq, 'utf8');
  const trecho = montarTrecho(blocos, ctx);

  if (html.includes(INICIO)) {
    const a = html.indexOf(INICIO);
    const z = html.indexOf(FIM) + FIM.length + 1;
    html = html.slice(0, a) + trecho.trimEnd() + '\n' + html.slice(z);
  } else {
    const i = html.lastIndexOf(FECHO);
    if (i < 0) throw new Error(`${slug}: não achei o fecho para ancorar o trecho`);
    html = `${html.slice(0, i)}  ${trecho}\n${html.slice(i)}`;
  }

  if (html.includes(PORTA_VAZIA)) html = html.replace(PORTA_VAZIA, PORTA_LEIS);
  if (!html.includes('class="porta-indice"')) {
    if (!html.includes(PORTA_LEIS)) throw new Error(`${slug}: não achei a porta de Projetos de lei`);
    html = html.replace(PORTA_LEIS, `${PORTA_LEIS}\n        ${PORTA_INDICE}`);
  }

  fs.writeFileSync(arq, html);
  console.log(`  ${slug.padEnd(16)} ${blocos.length} bloco(s) · ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}

function main() {
  const pedidos = process.argv.slice(2);
  const ctx = contexto();
  const { paginas } = ler('manuais.json');
  const alvos = Object.entries(paginas).filter(([slug]) => !pedidos.length || pedidos.includes(slug));
  if (!alvos.length) throw new Error(`nenhuma página manual corresponde a: ${pedidos.join(', ')}`);
  for (const [slug, blocos] of alvos) atualizar(slug, blocos, ctx);
  console.log(`\n${alvos.length} página(s) manual(is) atualizada(s).`);
}

try {
  main();
} catch (erro) {
  console.error('ERRO:', erro.message);
  process.exit(1);
}
