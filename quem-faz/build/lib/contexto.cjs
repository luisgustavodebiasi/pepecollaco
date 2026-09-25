/**
 * Carrega, uma vez, tudo o que os modelos leem: as bases geradas, os textos
 * escritos à mão e as medidas das fotos. Usado por gerar-paginas.cjs e por
 * atualizar-manuais.cjs, para as duas saídas lerem exatamente os mesmos dados.
 */

const fs = require('fs');
const path = require('path');
const { carregarFotos } = require('../modelo/visual.cjs');
const { calcularTemas } = require('./temas.cjs');

const DADOS = path.join(__dirname, '..', '..', 'dados');
const ler = (nome) => JSON.parse(fs.readFileSync(path.join(DADOS, nome), 'utf8'));

function contexto() {
  const ctx = {
    emendas: ler('emendas.json'),
    leis: ler('leis.json'),
    imprensa: ler('imprensa.json'),
    redes: ler('redes.json'),
    instagram: ler('instagram.json'),
    indice: ler('indice.json'),
    leisPaginas: ler('leis-paginas.json'),
    fotos: carregarFotos(),
  };
  const lugares = ler('lugares.json');
  ctx.portas = lugares.portas;
  ctx.lugares = lugares.lugares;
  ctx.temas = calcularTemas(ctx.emendas);
  ctx.ocultar = ctx.indice.ocultar;
  return ctx;
}

module.exports = { contexto, ler };
