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
 * Só mexe nos slugs listados em lugares.json. As páginas ainda não migradas
 * continuam intocadas.
 */

const fs = require('fs');
const path = require('path');
const { montar } = require('./modelo/pagina.cjs');

const DADOS = path.join(__dirname, '..', 'dados');
const RAIZ = path.join(__dirname, '..');

const ler = (nome) => JSON.parse(fs.readFileSync(path.join(DADOS, nome), 'utf8'));

/**
 * Confere que todo valor anunciado no lugar bate com a base de emendas.
 * É aqui que a regra de ouro vira código: número que não fecha derruba o build.
 */
function conferir(lugar, emendas) {
  const erros = [];

  for (const [caminho, esperado] of Object.entries(lugar.conferir || {})) {
    const [tipo, chave, campo] = caminho.split('.');
    let obtido;

    if (tipo === 'municipio') obtido = emendas.porMunicipio[chave]?.[campo];
    else if (tipo === 'coordenacao') obtido = emendas.porCoordenacao[chave]?.[campo];
    else if (tipo === 'area') obtido = emendas.porArea[chave]?.[campo];
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

function main() {
  const pedidos = process.argv.slice(2);

  const ctx = {
    emendas: ler('emendas.json'),
    leis: ler('leis.json'),
    imprensa: ler('imprensa.json'),
    redes: ler('redes.json'),
  };
  const { portas, lugares } = ler('lugares.json');
  ctx.portas = portas;

  const alvos = Object.values(lugares).filter((l) => !pedidos.length || pedidos.includes(l.slug));
  if (!alvos.length) {
    throw new Error(`nenhum lugar corresponde a: ${pedidos.join(', ')}`);
  }

  for (const lugar of alvos) {
    conferir(lugar, ctx.emendas);

    const html = montar(lugar, ctx);
    const destino = path.join(RAIZ, lugar.slug, 'index.html');
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, html);

    const kb = (Buffer.byteLength(html) / 1024).toFixed(1);
    console.log(`  ${lugar.slug.padEnd(16)} ${String(lugar.secoes.length).padStart(2)} seções · ${kb} KB`);
  }

  console.log(`\n${alvos.length} página(s) gerada(s).`);
}

try {
  main();
} catch (erro) {
  console.error('ERRO:', erro.message);
  process.exit(1);
}
