#!/usr/bin/env node
/**
 * normalizar.cjs — lê as bases do gabinete e grava os JSON que alimentam as
 * páginas, mais a MATRIZ.csv de validação.
 *
 *   node build/normalizar.cjs
 *
 * Fontes (fora do repositório do site, na pasta do projeto):
 *   EMENDAS /emendas_site_historico.csv    → dados/emendas.json
 *   IMPRENSA/materias_imprensa_*.csv       → dados/imprensa.json
 *   REDES/posts_conteudo_3anos_unico.csv   → dados/redes.json
 *
 * Regra de ouro: nada aqui inventa valor. O que não classifica com segurança
 * cai em `area: "outros"` e aparece na MATRIZ com `publicar=validar`.
 */

const fs = require('fs');
const path = require('path');
const { lerObjetos, escrever } = require('./lib/csv.cjs');

const PROJETO = path.join(__dirname, '..', '..', '..');
const DADOS = path.join(__dirname, '..', 'dados');

const ARQ_EMENDAS = path.join(PROJETO, 'EMENDAS ', 'emendas_site_historico.csv');
const ARQ_IMPRENSA = path.join(PROJETO, 'IMPRENSA', 'materias_imprensa_pepe_collaco.csv');
const ARQ_REDES = path.join(PROJETO, 'REDES', 'posts_conteudo_3anos_unico.csv');
const ARQ_MATRIZ = path.join(DADOS, 'MATRIZ.csv');

// Somas de controle. Se a base for atualizada, estes números mudam de propósito
// e devem ser atualizados junto — a falha é o alarme, não o incômodo.
const CONTROLE = { emendas: 525, total: 156367827.19, imprensa: 80, redes: 686 };

/* ─────────────────────────── utilidades ─────────────────────────── */

const ler = (p) => fs.readFileSync(p, 'utf8');

/** "R$ 1.234.567,89" → 1234567.89 */
function valor(bruto) {
  const n = Number(
    String(bruto || '')
      .replace(/R\$/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim()
  );
  return Number.isFinite(n) ? n : 0;
}

/**
 * Chave de comparação: sem acento, sem caixa, sem espaço duplicado.
 * Serve para casar municípios entre bases — nunca para exibir.
 */
function chave(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Caixa de nome próprio, preservando acento: "BRAÇO DO NORTE" → "Braço do Norte",
 * "GRÃO-PARÁ" → "Grão-Pará".
 */
const MINUSCULAS = new Set(['de', 'do', 'da', 'dos', 'das', 'e', 'd']);
function nomeProprio(s) {
  const capitalizar = (p) => p.charAt(0).toLocaleUpperCase('pt-BR') + p.slice(1);
  return String(s || '')
    .toLocaleLowerCase('pt-BR')
    .split(/\s+/)
    .filter(Boolean)
    .map((palavra, i) =>
      i > 0 && MINUSCULAS.has(palavra)
        ? palavra
        : palavra.split('-').map(capitalizar).join('-')
    )
    .join(' ');
}

/* ─────────────────────── correções de origem ────────────────────── */

// Um único registro (R$ 100 mil) veio com dois municípios no campo. É de Laguna;
// "Florianópolis" ali é o endereço do interessado, não o município atendido.
// Chave sem acento → nome como deve aparecer no site.
const MUNICIPIO_CORRIGIDO = { 'FLORIANOPOLIS/LAGUNA': 'Laguna' };

/**
 * Classificação por área, na ordem do livreto. A ordem importa: a primeira
 * regra que casa vence, então o que é mais específico vem antes.
 * Cobertura medida: ~83% dos registros. O resto vira "outros" de propósito —
 * chutar área é pior do que deixar em branco para curadoria.
 */
const AREAS = [
  ['autismo', /\bTEA\b|autis|equoterap|sala sensorial|terapia ocupacional|\bAPAE\b|\bAMA\b|ecoterap/i],
  ['saude', /saúde|saude|hospital|ambul[âa]ncia|\bSUS\b|exame|consulta|tomograf|ressonân|ultrassom|\bUBS\b|unidade b[áa]sica|\bsamu\b|farm[áa]c|rede feminina|c[âa]ncer|odontol|fisioterap/i],
  ['seguranca', /pol[íi]cia|militar|bombeir|viatura|c[âa]mera de|videomonitor|seguran[çc]a p[úu]blica|defesa civil|guarda municipal/i],
  ['educacao', /escola|creche|\bCEI\b|educa[çc]|ensino|professor|escolar|biblioteca|rob[óo]tica|inova[çc]|universidad|refeit[óo]rio|\bNCE\b|n[úu]cleo municipal/i],
  ['infraestrutura', /paviment|drenagem|asfált|asfalt|reperfil|recapea|estrada|\brua\b|ruas|avenida|\bvias?\b|cal[çc]ament|ponte|enroncament|enrocament|dragag|molhe|esgot|sanga|infraestrutura|contorno vi[áa]rio|meio-fio|sinaliza[çc]|ilumina[çc]|rolo compactador|motoniveladora|retroescavadeira|caminh[ãa]o/i],
  ['esporte-cultura', /espor|gin[áa]sio|quadra|campo de futebol|gramado|cultur|festa|natal|banda|orquestra|coral|\bCTG\b|atl[ée]tic|nata[çc][ãa]o|academia|praça|pra[çc]a|lazer|carnaval|rodeio/i],
  ['agricultura', /agricultura|trator|implement|agr[íi]cola|rural|drone|ovino|caprin|pesca|maricult/i],
  ['entidades', /clube de m[ãa]es|associa[çc]|conselho comunit|rotary|\bCDL\b|assist[êe]ncia social|combemtu|\bstan\b|escoteir|igreja|capela|par[óo]quia|idoso|conselho tutelar|bem-estar animal/i],
];

const ROTULO_AREA = {
  infraestrutura: 'Infraestrutura e obras',
  saude: 'Saúde e assistência social',
  educacao: 'Educação e inovação',
  seguranca: 'Segurança',
  'esporte-cultura': 'Social, esporte e lazer',
  entidades: 'Entidades',
  agricultura: 'Agricultura',
  autismo: 'Autismo (TEA)',
  outros: 'Outros',
};

function classificarArea(objeto, interessado) {
  const alvo = `${objeto || ''} ${interessado || ''}`;
  for (const [nome, re] of AREAS) if (re.test(alvo)) return nome;
  return 'outros';
}

/* ────────────────────────────── emendas ─────────────────────────── */

function normalizarEmendas(areaManual) {
  const brutas = lerObjetos(ler(ARQ_EMENDAS), ';');

  const emendas = brutas.map((r) => {
    // O nome exibido preserva acento; a chave (sem acento, caixa alta) é só para
    // agrupar e casar com as outras bases.
    const municipio = MUNICIPIO_CORRIGIDO[chave(r.Municipio)] || nomeProprio(r.Municipio);
    const id = String(r.ID || '').trim();

    return {
      id,
      municipio,
      municipioChave: chave(municipio),
      coordenacao: chave(r.Coordenacao),
      interessado: nomeProprio(r.Interessado),
      valor: valor(r.Valor),
      objeto: (r.Objeto || '').trim(),
      modalidade: (r.Modalidade || '').trim(),
      status: chave(r.Status),
      area: areaManual.get(`emendas#${id}`) || classificarArea(r.Objeto, r.Interessado),
      bancada: /^BANCADA/i.test(r.Modalidade || ''),
      sgpe: (r.SGPE || '').trim(),
    };
  });

  const total = emendas.reduce((s, e) => s + e.valor, 0);

  if (emendas.length !== CONTROLE.emendas) {
    throw new Error(`emendas: ${emendas.length} registros, esperado ${CONTROLE.emendas}. Atualize CONTROLE se a base mudou.`);
  }
  if (Math.abs(total - CONTROLE.total) > 0.01) {
    throw new Error(`emendas: soma R$ ${total.toFixed(2)}, esperado R$ ${CONTROLE.total.toFixed(2)}.`);
  }

  return emendas;
}

/* ───────────────────────────── imprensa ─────────────────────────── */

function normalizarImprensa() {
  return lerObjetos(ler(ARQ_IMPRENSA), ',').map((r) => ({
    id: r.ID,
    data: r.DATA_PUBLICACAO,
    ano: r.ANO,
    titulo: r.TITULO,
    veiculo: r.VEICULO,
    url: r.URL,
    pauta: r.PAUTA_PRINCIPAL,
    municipios: (r.MUNICIPIO || '').split(';').map((m) => m.trim()).filter(Boolean),
    regiao: r.REGIAO,
    resumo: r.RESUMO,
    atuacao: r.ATUACAO_DE_PEPE_COLLACO,
    relevancia: r.RELEVANCIA,
    valorRecurso: r.VALOR_RECURSO,
    linkValidado: /^SIM$/i.test(r.LINK_VALIDADO),
  }));
}

/* ────────────────────────────── redes ───────────────────────────── */

const NUM = (v) => {
  const n = Number(String(v || '').trim());
  return Number.isFinite(n) && String(v || '').trim() !== '' ? n : null;
};

function normalizarRedes() {
  return lerObjetos(ler(ARQ_REDES), ',')
    .map((r) => {
      const link = r.link || r.link_facebook || '';
      const shortcode = (link.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/) || [])[1] || '';
      return {
        shortcode,
        data: r.data,
        redes: r.redes,
        tipo: r.tipo,
        link,
        linkFacebook: r.link_facebook || '',
        curtidas: NUM(r.curtidas),
        comentarios: NUM(r.comentarios),
        engajamento: NUM(r.engajamento),
        alcance: NUM(r.alcance),
        legenda: (r.legenda || '').replace(/\s+/g, ' ').trim(),
      };
    })
    .filter((p) => p.link);
}

/* ────────────────────────────── matriz ──────────────────────────── */

/** Lê a MATRIZ existente para preservar a curadoria manual entre execuções. */
function lerCuradoria() {
  const areaManual = new Map();
  const anterior = new Map();
  if (!fs.existsSync(ARQ_MATRIZ)) return { areaManual, anterior };

  for (const l of lerObjetos(ler(ARQ_MATRIZ), ',')) {
    if (!l.FONTE) continue;
    anterior.set(l.FONTE, l);
    if (l.area_manual) areaManual.set(l.FONTE, l.area_manual);
  }
  return { areaManual, anterior };
}

const COLUNAS_MATRIZ = [
  'LOCAL', 'AREA', 'ENTREGA/PROJETO', 'VALOR', 'FONTE',
  'MATERIA', 'POST', 'STATUS', 'OBSERVACAO', 'area_manual', 'publicar',
];

function gerarMatriz(emendas, leis, anterior) {
  const linhas = [];

  for (const e of emendas) {
    const fonte = `emendas#${e.id}`;
    const antes = anterior.get(fonte) || {};
    linhas.push({
      LOCAL: e.municipio,
      AREA: ROTULO_AREA[e.area],
      'ENTREGA/PROJETO': e.objeto,
      VALOR: e.valor.toFixed(2),
      FONTE: fonte,
      MATERIA: antes.MATERIA || '',
      POST: antes.POST || '',
      STATUS: e.status,
      OBSERVACAO: antes.OBSERVACAO || '',
      area_manual: antes.area_manual || '',
      // Emenda com área indefinida entra como "validar" — precisa de olho humano
      // antes de virar card de uma área no site.
      publicar: antes.publicar || (e.area === 'outros' ? 'validar' : 'sim'),
    });
  }

  for (const p of leis.proposicoes) {
    const fonte = `alesc#${p.codigo}`;
    const antes = anterior.get(fonte) || {};
    linhas.push({
      LOCAL: p.municipio || 'Santa Catarina',
      AREA: 'Atuação legislativa',
      'ENTREGA/PROJETO': p.ementa,
      VALOR: '',
      FONTE: fonte,
      MATERIA: antes.MATERIA || '',
      POST: antes.POST || '',
      STATUS: p.rotulo,
      OBSERVACAO: antes.OBSERVACAO || '',
      area_manual: antes.area_manual || '',
      publicar: antes.publicar || 'sim',
    });
  }

  return linhas;
}

/* ──────────────────────────────── main ──────────────────────────── */

function main() {
  const { areaManual, anterior } = lerCuradoria();

  const emendas = normalizarEmendas(areaManual);
  const imprensa = normalizarImprensa();
  const redes = normalizarRedes();
  const leis = JSON.parse(ler(path.join(DADOS, 'leis.json')));

  if (imprensa.length !== CONTROLE.imprensa) {
    console.warn(`  aviso: imprensa com ${imprensa.length} matérias (esperado ${CONTROLE.imprensa})`);
  }
  if (redes.length !== CONTROLE.redes) {
    console.warn(`  aviso: redes com ${redes.length} posts (esperado ${CONTROLE.redes})`);
  }

  const total = emendas.reduce((s, e) => s + e.valor, 0);
  const porArea = {};
  const porCoordenacao = {};
  const porMunicipio = {};
  for (const e of emendas) {
    (porArea[e.area] ??= { valor: 0, n: 0 });
    porArea[e.area].valor += e.valor;
    porArea[e.area].n += 1;
    (porCoordenacao[e.coordenacao] ??= { valor: 0, n: 0, municipios: new Set() });
    porCoordenacao[e.coordenacao].valor += e.valor;
    porCoordenacao[e.coordenacao].n += 1;
    porCoordenacao[e.coordenacao].municipios.add(e.municipioChave);
    (porMunicipio[e.municipioChave] ??= { nome: e.municipio, valor: 0, n: 0, coordenacao: e.coordenacao });
    porMunicipio[e.municipioChave].valor += e.valor;
    porMunicipio[e.municipioChave].n += 1;
  }

  const resumo = {
    geradoEm: new Date().toISOString().slice(0, 10),
    fonte: path.relative(PROJETO, ARQ_EMENDAS),
    total,
    quantidade: emendas.length,
    municipios: Object.keys(porMunicipio).length,
    porArea: Object.fromEntries(Object.entries(porArea).map(([k, v]) => [k, v])),
    porCoordenacao: Object.fromEntries(
      Object.entries(porCoordenacao).map(([k, v]) => [k, { valor: v.valor, n: v.n, municipios: v.municipios.size }])
    ),
    porMunicipio,
  };

  const gravar = (nome, dado) =>
    fs.writeFileSync(path.join(DADOS, nome), `${JSON.stringify(dado, null, 1)}\n`);

  gravar('emendas.json', { ...resumo, emendas });
  gravar('imprensa.json', { total: imprensa.length, materias: imprensa });
  gravar('redes.json', { total: redes.length, posts: redes });

  const matriz = gerarMatriz(emendas, leis, anterior);
  fs.writeFileSync(ARQ_MATRIZ, escrever(COLUNAS_MATRIZ, matriz));

  // Doações e patrocínios entram na planilha sem valor em reais. Contam como
  // emenda, somam zero — é o comportamento certo, mas vale dizer em voz alta
  // para ninguém tomar por erro de leitura do CSV.
  const semValor = emendas.filter((e) => !e.valor);
  if (semValor.length) {
    console.log(`\n${semValor.length} emendas sem valor em reais (doação/patrocínio): contam no total de emendas, somam R$ 0`);
  }

  const brl = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  console.log(`emendas  ${emendas.length} · ${brl(total)} · ${resumo.municipios} municípios`);
  for (const [a, v] of Object.entries(porArea).sort((x, y) => y[1].valor - x[1].valor)) {
    console.log(`   ${ROTULO_AREA[a].padEnd(28)} ${String(v.n).padStart(3)} · ${brl(v.valor)}`);
  }
  console.log(`\ncoordenações:`);
  for (const [c, v] of Object.entries(resumo.porCoordenacao).sort((x, y) => y[1].valor - x[1].valor)) {
    console.log(`   ${c.padEnd(16)} ${String(v.n).padStart(3)} emendas · ${String(v.municipios).padStart(2)} mun. · ${brl(v.valor)}`);
  }
  console.log(`\nimprensa ${imprensa.length} matérias · redes ${redes.length} posts · leis ${leis.total}`);
  console.log(`matriz   ${matriz.length} linhas → ${path.relative(process.cwd(), ARQ_MATRIZ)}`);
  const validar = matriz.filter((l) => l.publicar === 'validar').length;
  if (validar) console.log(`         ${validar} linha(s) com publicar=validar aguardando curadoria`);
}

try {
  main();
} catch (erro) {
  console.error('ERRO:', erro.message);
  process.exit(1);
}
