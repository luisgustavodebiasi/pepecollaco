/**
 * Leitor de CSV mínimo, mas correto: respeita aspas, aspas escapadas ("")
 * e quebra de linha dentro de campo — que é exatamente o caso das legendas
 * dos posts e dos resumos das matérias.
 */

function parse(texto, delimitador = ',') {
  const limpo = texto.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const linhas = [];
  let campo = '';
  let linha = [];
  let entreAspas = false;

  for (let i = 0; i < limpo.length; i += 1) {
    const c = limpo[i];

    if (entreAspas) {
      if (c === '"') {
        if (limpo[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          entreAspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') entreAspas = true;
    else if (c === delimitador) {
      linha.push(campo);
      campo = '';
    } else if (c === '\n') {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = '';
    } else campo += c;
  }

  if (campo !== '' || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }

  return linhas.filter((l) => l.some((v) => v.trim() !== ''));
}

/** Lê o CSV como lista de objetos, usando a primeira linha como cabeçalho. */
function lerObjetos(texto, delimitador = ',') {
  const [cabecalho, ...corpo] = parse(texto, delimitador);
  if (!cabecalho) return [];
  const chaves = cabecalho.map((c) => c.trim());
  return corpo.map((l) => {
    const o = {};
    chaves.forEach((k, i) => {
      o[k] = (l[i] ?? '').trim();
    });
    return o;
  });
}

/** Escreve um CSV, sempre entre aspas — mais simples de abrir no Excel/Sheets. */
function escrever(colunas, linhas) {
  const celula = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [
    colunas.map(celula).join(','),
    ...linhas.map((l) => colunas.map((c) => celula(l[c])).join(',')),
  ].join('\n').concat('\n');
}

module.exports = { parse, lerObjetos, escrever };
