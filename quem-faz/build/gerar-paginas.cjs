#!/usr/bin/env node
/**
 * gerar-paginas.cjs — escreve o index.html de cada página cadastrada em
 * dados/lugares.json.
 *
 *   node build/gerar-paginas.cjs            # todas as páginas geradas
 *   node build/gerar-paginas.cjs pela-amurel
 *
 * O HTML sai pronto do build, não do navegador: o site é estático no GitHub
 * Pages e o conteúdo precisa estar no fonte para ser indexado.
 *
 * Gera também a página índice (/quem-faz/, texto em dados/indice.json) e as
 * páginas de lei (/quem-faz/projetos-de-lei/, texto em dados/leis-paginas.json).
 *
 *   node build/gerar-paginas.cjs indice
 *   node build/gerar-paginas.cjs projetos-de-lei
 *
 * Só mexe nesses caminhos. As páginas ainda não migradas (autismo, sul,
 * educação, cidades) continuam escritas à mão; nelas quem mexe é
 * build/atualizar-manuais.cjs, e só nos trechos marcados.
 */

const fs = require('fs');
const path = require('path');
const { montar } = require('./modelo/pagina.cjs');
const { montarIndice } = require('./modelo/indice.cjs');
const { montarGeral, montarLei, SLUG: SLUG_LEIS } = require('./modelo/leis.cjs');
const { contexto } = require('./lib/contexto.cjs');

const DADOS = path.join(__dirname, '..', 'dados');
const RAIZ = path.join(__dirname, '..');

const ler = (nome) => JSON.parse(fs.readFileSync(path.join(DADOS, nome), 'utf8'));

/**
 * Confere que todo valor anunciado no lugar bate com a base de emendas.
 * É aqui que a regra de ouro vira código: número que não fecha derruba o build.
 */
function conferir(lugar, emendas, temas) {
  const erros = [];

  for (const [caminho, esperado] of Object.entries(lugar.conferir || {})) {
    const [tipo, chave, campo] = caminho.split('.');
    let obtido;

    // Valor por município não se publica mais (decisão do Luis, 25/09/2026):
    // nenhuma cidade é comparada com outra pelo que recebeu. Se uma página
    // voltar a conferir valor de cidade, é porque voltou a anunciá-lo.
    if (tipo === 'municipio') {
      erros.push(`"${caminho}": valor por município não é mais publicado`);
      continue;
    }
    if (tipo === 'coordenacao') obtido = emendas.porCoordenacao[chave]?.[campo];
    else if (tipo === 'area') obtido = emendas.porArea[chave]?.[campo];
    else if (tipo === 'tema') obtido = temas[chave]?.[campo];
    else erros.push(`conferência "${caminho}" tem tipo desconhecido`);

    if (obtido === undefined) {
      erros.push(`conferência "${caminho}" não achou o dado na base`);
    } else if (typeof esperado === 'number' && Math.abs(obtido - esperado) > 0.01) {
      erros.push(`${caminho}: página diz ${esperado}, base diz ${obtido}`);
    }
  }

  if (erros.length) {
    throw new Error(`${lugar.slug}:\n    - ${erros.join('\n    - ')}`);
  }
}

function gravar(caminhoRelativo, html, rotulo) {
  const destino = path.join(RAIZ, caminhoRelativo, 'index.html');
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
  console.log(`  ${rotulo.padEnd(44)} ${kb} KB`);
}

function main() {
  const pedidos = process.argv.slice(2);
  const quer = (slug) => !pedidos.length || pedidos.includes(slug);

  const ctx = contexto();
  const { lugares } = ler('lugares.json');

  const alvos = Object.values(lugares).filter((l) => quer(l.slug));
  const extras = ['indice', SLUG_LEIS].filter(quer);
  if (!alvos.length && !extras.length) {
    throw new Error(`nenhuma página corresponde a: ${pedidos.join(', ')}`);
  }

  for (const lugar of alvos) {
    conferir(lugar, ctx.emendas, ctx.temas);

    const html = montar(lugar, ctx);
    const destino = path.join(RAIZ, lugar.slug, 'index.html');
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, html);

    const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
    console.log(`  ${lugar.slug.padEnd(16)} ${String(lugar.secoes.length).padStart(2)} seções · ${kb} KB`);
  }

  let total = alvos.length;

  if (quer('indice')) {
    gravar('.', montarIndice(ctx), 'indice (/quem-faz/)');
    total += 1;
  }

  if (quer(SLUG_LEIS)) {
    gravar(SLUG_LEIS, montarGeral(ctx), SLUG_LEIS);
    for (const d of ctx.leisPaginas.destaques) {
      const { html } = montarLei(d, ctx);
      gravar(path.join(SLUG_LEIS, d.slug), html, `${SLUG_LEIS}/${d.slug}`);
    }
    total += 1 + ctx.leisPaginas.destaques.length;
  }

  console.log(`\n${total} página(s) gerada(s).`);
}

try {
  main();
} catch (erro) {
  console.error('ERRO:', erro.message);
  process.exit(1);
}
