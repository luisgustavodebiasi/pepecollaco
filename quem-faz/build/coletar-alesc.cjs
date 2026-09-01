#!/usr/bin/env node
/**
 * coletar-alesc.cjs — baixa as proposições de autoria do deputado no e-Legis da
 * ALESC e grava dados/leis.json.
 *
 *   node build/coletar-alesc.cjs
 *
 * Fonte oficial e única de status legislativo. Nada de status escrito à mão:
 * o que sai daqui é o que a Assembleia publica. Se o e-Legis mudar de formato,
 * o script falha em vez de gravar um arquivo vazio ou meio preenchido — status
 * legislativo errado no site é pior do que build quebrado.
 */

const fs = require('fs');
const path = require('path');

const INICIATIVA = 'pepe-collaco';
const BASE = 'https://portalelegis.alesc.sc.gov.br';
const LISTA = `${BASE}/proposicoes/processo-legislativo?iniciativa=${INICIATIVA}`;
const SAIDA = path.join(__dirname, '..', 'dados', 'leis.json');

// Piso de sanidade: se vier menos que isso, alguma coisa quebrou do outro lado.
const MINIMO_ESPERADO = 35;

const UA = 'Mozilla/5.0 (compatible; pepecollaco-site/1.0; +https://www.pepecollaco.com)';

async function buscar(url, tentativa = 1) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } catch (erro) {
    if (tentativa >= 3) throw new Error(`falhou ao buscar ${url}: ${erro.message}`);
    await new Promise((ok) => setTimeout(ok, 800 * tentativa));
    return buscar(url, tentativa + 1);
  }
}

/** Tira tags e normaliza espaço, para poder varrer o conteúdo com regex. */
function texto(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

const RE_CODIGO = /(?:PL|PLC|PEC|PDL|MSV|PRE)\.?\/\d{4}\/\d{4}/;
const RE_CODIGO_G = new RegExp(RE_CODIGO.source, 'g');

/**
 * Lê a listagem paginada e devolve { codigo -> { caminho, setor, situacao } }.
 *
 * Setor e situação atuais só existem na listagem — a página de tramitações traz
 * o histórico, não o estado corrente. Por isso são capturados aqui.
 */
async function coletarIndice() {
  const processos = new Map();
  let totalInformado = null;

  for (let pagina = 1; pagina <= 20; pagina += 1) {
    const html = await buscar(`${LISTA}&page=${pagina}`);
    const plano = texto(html);

    if (totalInformado === null) {
      const m = plano.match(/Exibindo\s*\d+\s*-\s*\d+\s*de\s*([\d.]+)/);
      if (m) totalInformado = Number(m[1].replace(/\./g, ''));
    }

    // Cada bloco vai de um código de proposição até o próximo.
    const blocos = html.split(RE_CODIGO_G);
    const codigos = html.match(RE_CODIGO_G) || [];
    const blocosTexto = plano.split(RE_CODIGO_G);
    let achou = 0;

    codigos.forEach((codigo, i) => {
      const bloco = blocos[i + 1] || '';
      const href = bloco.match(/href="(\/proposicoes\/[A-Za-z0-9_-]+)\/[a-z]+"/);
      if (!href || processos.has(codigo)) return;

      const bt = blocosTexto[i + 1] || '';
      const setor = bt.match(/Setor atual\s+(.*?)\s+Situação atual/);
      const situacao = bt.match(/Situação atual\s+(.*?)\s+(?:Projeto Original|Push|Ver|$)/);

      processos.set(codigo, {
        caminho: href[1],
        setor: setor ? setor[1].trim() : '',
        situacao: situacao ? situacao[1].trim() : '',
      });
      achou += 1;
    });

    if (achou === 0) break;
    if (totalInformado && processos.size >= totalInformado) break;
    await new Promise((ok) => setTimeout(ok, 200));
  }

  return { processos, totalInformado };
}

/** Lê a tramitação de um processo e extrai o que vai para o site. */
async function lerProcesso(codigo, indice) {
  const { caminho, setor, situacao } = indice;
  const t = texto(await buscar(`${BASE}${caminho}/tramitacoes`));

  // O código aparece três vezes (breadcrumb, título da aba, cabeçalho). O `.*`
  // guloso no começo joga a âncora para a última ocorrência, que é a do
  // cabeçalho — a única seguida da ementa de verdade.
  const cab = t.match(
    new RegExp(`.*${codigo.replace(/[./]/g, '\\$&')}\\s+(.*?)\\s+Entrada\\s+(\\d{2}/\\d{2}/\\d{4})`)
  );

  // "Transformado em Lei" é o único marcador confiável. A situação "Arquivado"
  // aparece tanto em projeto rejeitado quanto em projeto que virou lei e foi
  // arquivado depois da sanção — por isso nunca deduzir status do "Arquivado".
  const virouLei = /Transformado em Lei/.test(t);
  // A ALESC escreve o primeiro dia do mês como "1º/04/2026", daí o `º?`.
  const lei = t.match(
    /Transformado em Lei\s+Lei\s+\d{2}\/\d{2}\/\d{4}\s+Lei n[ºo°]?\s*([\d.]+),\s*de\s*(\d{1,2})[º°]?\/(\d{2})\/(\d{4})/
  );

  const subscrito = t.match(/Subscrito por\s+(.*?)\s+Regime de tramitação/);
  const materia = t.match(/Matéria legislativa\s+(.*?)\s+(?:Informações|Observação|Tramitações)/);

  return {
    codigo,
    url: `${BASE}${caminho}/tramitacoes`,
    ementa: cab ? cab[1].trim() : '',
    entrada: cab ? cab[2] : '',
    materia: materia ? materia[1].trim() : '',
    subscrito: subscrito ? subscrito[1].trim() : '',
    setor,
    situacao,
    virouLei,
    // A ALESC ora escreve "19.785", ora "18673". Normaliza para o milhar com ponto.
    lei: lei ? lei[1].replace(/\./g, '').replace(/(\d+)(\d{3})$/, '$1.$2') : '',
    leiData: lei ? `${lei[2].padStart(2, '0')}/${lei[3]}/${lei[4]}` : '',
    leiAno: lei ? lei[4] : '',
    retirado: /\bRetirado\b/.test(t),
    rejeitado: /\bRejeitad\w+/.test(t),
  };
}

/** Classifica a proposição para a página saber onde encaixá-la. */
function classificar(p) {
  const e = p.ementa.toLowerCase();
  if (/^declara de utilidade p[úu]blica/.test(e)) return 'utilidade-publica';
  if (/t[íi]tulo de cidad/.test(e)) return 'titulo';
  if (/denomina|denomina[çc][ãa]o de bens/.test(e)) return 'denominacao';
  if (/patrim[ôo]nio cultural/.test(e)) return 'patrimonio';
  if (/institui a festa|capital catarinense/.test(e)) return 'reconhecimento';
  return 'politica-publica';
}

/**
 * Município citado na ementa, para alimentar as páginas de cidade.
 * A ALESC escreve isso de várias formas, daí a bateria de padrões.
 */
const NOME = "[A-ZÁÂÃÀÉÊÍÓÔÕÚÜÇ][\\wÀ-ÿ'’]*(?:\\s+(?:d[aeo]s?|[A-ZÁÂÃÀÉÊÍÓÔÕÚÜÇ][\\wÀ-ÿ'’]*)){0,3}";
const PADROES_MUNICIPIO = [
  // "Reconhece o Município de Paulo Lopes como..." / "no Município de Jaguaruna,"
  new RegExp(`Munic[íi]pio de\\s+(${NOME})`),
  // "..., de Rio Rufino - AMA e Altera" / "..., de Tubarão, e altera"
  new RegExp(`,\\s*de\\s+(${NOME})\\s*(?:[-–,]|\\s+e\\s+[Aa]ltera)`),
  // "..., com sede em Tijucas e Altera"
  new RegExp(`com sede em\\s+(${NOME})`),
  // "...de Capivari de Baixo, e altera" (fecho por vírgula simples)
  new RegExp(`,\\s*de\\s+(${NOME}),`),
  // "...Instituto Conecta+ de São José e Altera" (sem vírgula antes do "de")
  new RegExp(`\\sde\\s+(${NOME})\\s+e\\s+[Aa]ltera`),
];

function municipio(ementa) {
  for (const re of PADROES_MUNICIPIO) {
    const m = ementa.match(re);
    if (!m) continue;
    const nome = m[1]
      .replace(/\s*\/?\s*SC$/i, '')
      // "Município de Tubarão do Anexo Único da Lei" — corta o rabo burocrático
      // que o NOME guloso arrasta junto.
      .replace(/\s+d[oa]s?\s+(?:Anexo|Lei|Estado|Município).*$/i, '')
      .replace(/\s+(?:e|que|para|como)$/i, '')
      .trim();
    // Evita capturar "Lei" ou artigos soltos quando a ementa foge do padrão.
    if (nome.length > 2 && !/^(Lei|Anexo|Estado|Santa Catarina)$/i.test(nome)) return nome;
  }
  return '';
}

/** Rótulo exibido no card. Nunca inventado — derivado do registro oficial. */
function rotulo(p) {
  if (p.virouLei && p.lei) return `LEI Nº ${p.lei}/${p.leiAno}`;
  if (p.virouLei) return 'TRANSFORMADO EM LEI';
  if (p.retirado) return 'RETIRADO';
  if (p.rejeitado) return 'REJEITADO';
  if (/aguardando aprecia[çc][ãa]o pela comiss/i.test(p.situacao)) return 'EM COMISSÕES';
  if (p.situacao) return p.situacao.toUpperCase();
  return 'EM TRAMITAÇÃO';
}

(async function main() {
  console.log('e-Legis ALESC · iniciativa:', INICIATIVA);

  const { processos, totalInformado } = await coletarIndice();
  console.log(`  índice: ${processos.size} processos (o portal informa ${totalInformado ?? '?'})`);

  if (processos.size < MINIMO_ESPERADO) {
    throw new Error(
      `só ${processos.size} proposições encontradas (mínimo esperado ${MINIMO_ESPERADO}). ` +
        'O e-Legis provavelmente mudou de formato — corrija o parser antes de gerar as páginas.'
    );
  }

  const proposicoes = [];
  for (const [codigo, indice] of [...processos].sort((a, b) => a[0].localeCompare(b[0]))) {
    const p = await lerProcesso(codigo, indice);
    if (!p.ementa) throw new Error(`ementa vazia em ${codigo} — parser desatualizado`);
    if (/e-Legis|Processo Legislativo Eletr/.test(p.ementa)) {
      throw new Error(`ementa de ${codigo} veio com o breadcrumb do portal — parser desatualizado`);
    }
    if (p.virouLei && !p.lei) {
      throw new Error(`${codigo} virou lei mas o número não foi extraído — parser desatualizado`);
    }
    p.tipo = classificar(p);
    p.municipio = municipio(p.ementa);
    p.rotulo = rotulo(p);
    proposicoes.push(p);
    process.stdout.write('.');
    await new Promise((ok) => setTimeout(ok, 150));
  }
  process.stdout.write('\n');

  const leis = proposicoes.filter((p) => p.virouLei);
  const semNumero = leis.filter((p) => !p.lei);
  if (semNumero.length) {
    console.warn(`  aviso: ${semNumero.length} lei(s) sem número extraído: ${semNumero.map((p) => p.codigo).join(', ')}`);
  }

  // O portal informa um total que às vezes é maior do que a quantidade de códigos
  // distintos que ele realmente renderiza. Registramos a diferença em vez de
  // esconder: se um dia crescer, é sinal de que a paginação mudou.
  if (totalInformado && totalInformado !== proposicoes.length) {
    console.warn(
      `  aviso: o portal informa ${totalInformado} proposições, mas expõe ${proposicoes.length} códigos distintos.`
    );
  }

  const saida = {
    fonte: LISTA,
    coletadoEm: new Date().toISOString().slice(0, 10),
    totalInformadoPeloPortal: totalInformado,
    total: proposicoes.length,
    totalLeis: leis.length,
    proposicoes,
  };

  fs.writeFileSync(SAIDA, `${JSON.stringify(saida, null, 2)}\n`);
  console.log(`  ${proposicoes.length} proposições · ${leis.length} viraram lei`);
  console.log(`  política pública: ${proposicoes.filter((p) => p.tipo === 'politica-publica').length}`);
  console.log(`→ ${path.relative(process.cwd(), SAIDA)}`);
})().catch((erro) => {
  console.error('\nERRO:', erro.message);
  process.exit(1);
});
