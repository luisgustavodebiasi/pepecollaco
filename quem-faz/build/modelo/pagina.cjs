/**
 * Monta o HTML de uma página "quem faz" a partir do objeto do lugar
 * (dados/lugares.json) e das bases normalizadas.
 *
 * Cada seção é uma função pura. A ordem quem manda é `lugar.secoes`, então dá
 * para uma cidade ter "ruas" e outra não, sem tocar no gerador.
 */

const { escapar, cifra, cifraChip, milhar, data, resumirLegenda } = require('../lib/formato.cjs');
const { SITE, documento, jsonLdPessoa } = require('./base.cjs');
const visual = require('./visual.cjs');
const { icone } = require('../lib/icones.cjs');

/**
 * Selo de situação de um projeto, sempre derivado de leis.json. Projeto que
 * virou lei leva o selo verde APROVADO e, ao lado, o número da lei: o verde
 * diz o que aconteceu, o número prova.
 */
function seloProposicao(p) {
  if (p.virouLei) {
    return `<span class="selos"><span class="selo selo-lei">${icone('circle-check-big')}Aprovado</span>` +
      `<span class="selo selo-num">${escapar(p.rotulo.replace('LEI Nº', 'Lei nº'))}</span></span>`;
  }
  const classe = p.retirado || p.rejeitado ? 'selo-encerrado' : 'selo-comissao';
  return `<span class="selos"><span class="selo ${classe}">${escapar(p.rotulo)}</span></span>`;
}

/** Maior palavra do texto, em letras: calibra o corpo do título que precisa caber. */
const letrasDaMaiorPalavra = (t) => Math.max(...String(t).split(/\s+/).map((w) => [...w].length));

/**
 * O símbolo do infinito, marca da neurodiversidade, desenhado nas cores da
 * identidade. Entra só no hero das páginas do tema autismo.
 */
const INFINITO = `<svg class="infinito" viewBox="0 0 240 120" aria-hidden="true" focusable="false">
        <defs><linearGradient id="espectro" x1="0" x2="1">
          <stop offset="0" stop-color="#8BC1DC"/><stop offset=".25" stop-color="#00B171"/>
          <stop offset=".5" stop-color="#FFC400"/><stop offset=".75" stop-color="#FF9C33"/><stop offset="1" stop-color="#0082BF"/>
        </linearGradient></defs>
        <path d="M120 60c-22-30-42-45-62-45a45 45 0 0 0 0 90c20 0 40-15 62-45s42-45 62-45a45 45 0 0 1 0 90c-20 0-40-15-62-45z"/>
      </svg>`;

/* ───────────────────────────── peças ───────────────────────────── */

/** <span class="cifra">+R$ 88 <small>MILHÕES</small></span> */
function marcaCifra(valor, { mais = false, curta = false, classe = 'cifra', casas = null } = {}) {
  const c = cifra(valor, casas);
  const unidade = curta ? c.curta : c.unidade;
  return (
    `<span class="${classe}">${mais ? '<span class="mais">+</span>' : ''}R$ ${c.numero}` +
    `${unidade ? ` <small>${unidade}</small>` : ''}</span>`
  );
}

function cabecaSecao({ olho, titulo, texto }) {
  return `      <div class="sec-cabeca rv">
        <span class="olho">${escapar(olho)}</span>
        <h2>${escapar(titulo)}</h2>${texto ? `\n        <p>${texto}</p>` : ''}
      </div>`;
}

function secao(conteudo, { id, classe = '', rotulo = '' } = {}) {
  const attrs = [
    id ? ` id="${id}"` : '',
    classe ? ` class="${classe}"` : '',
    rotulo ? ` aria-label="${escapar(rotulo)}"` : '',
  ].join('');
  return `  <section${attrs}>\n    <div class="wrap">\n${conteudo}\n    </div>\n  </section>`;
}

/* ──────────────────────────── seções ───────────────────────────── */

function hero(lugar) {
  const { hero: h } = lugar;
  // O pincel recebe o número de letras da palavra: o CSS usa isso para o
  // corpo nunca passar da coluna (palavra comprida estourava e era cortada).
  const titulo = h.titulo
    .map((p) => p.estilo === 'pincel'
      ? `<span class="pincel" style="--letras:${letrasDaMaiorPalavra(p.texto)}">${escapar(p.texto)}</span>`
      : `<span class="${p.estilo}">${escapar(p.texto)}</span>`)
    .join(' ');

  // Manchete em reais (região, tema) ou em outra unidade (a página de uma
  // cidade não anuncia valor recebido: decisão de 25/09/2026).
  const manchete = h.valor !== undefined
    ? marcaCifra(h.valor, { mais: h.mais, casas: h.casas ?? null })
    : `<span class="cifra">${escapar(h.manchete.numero)} <small>${escapar(h.manchete.unidade)}</small></span>`;

  return `  <header class="hero fundo-campanha veu">${lugar.tema === 'autismo' ? `\n    ${INFINITO}` : ''}
    <div class="wrap hero-grade">
      <div>
        <h1>${titulo}</h1>

        <p class="hero-frase">${h.frase}</p>

        <div class="manchete">
          ${manchete}
          <span class="legenda">${escapar(h.legenda)}</span>
        </div>

        <div class="botoes">
          <a class="btn btn-acento" href="#${h.ancora || 'obras'}">${escapar(h.botao || 'Ver o que foi feito')}</a>
          <a class="btn btn-vazado" id="compartilhar" href="#" rel="noopener">Mandar para alguém</a>
        </div>
      </div>

      <div class="hero-retrato">
        <img src="../../assets/brand/foto/pepe-busto-900.webp"
             alt="Pepê Collaço, deputado estadual" width="677" height="900" />
      </div>
    </div>
  </header>`;
}

function placar(lugar) {
  const celulas = lugar.placar
    .map((c) => {
      // `texto` é HTML nosso (para casos como "20 <small>DE 20</small>"),
      // então entra cru de propósito; `valor` é formatado pela marca.
      let valor;
      if (c.valor !== undefined) {
        const cf = cifra(c.valor, c.casas ?? null);
        valor = `${c.mais ? '<span class="mais">+</span>' : ''}R$ ${cf.numero}` +
          `${cf.curta ? ` <small>${cf.curta}</small>` : ''}`;
      } else {
        valor = c.texto;
      }
      return `        <div>
          <b>${valor}</b>
          <span>${escapar(c.legenda)}</span>
        </div>`;
    })
    .join('\n');

  return secao(`      <div class="placar rv">\n${celulas}\n      </div>`, {
    rotulo: `Os números · ${lugar.nome}`,
  });
}

/** Pergunta de representatividade, logo abaixo do placar. */
function pergunta(lugar) {
  return secao(
    `      <div class="sec-cabeca rv">
        <span class="olho">${escapar(lugar.pergunta.olho)}</span>
        <h2>${escapar(lugar.pergunta.titulo)}</h2>
        <p>${lugar.pergunta.texto}</p>
      </div>`,
    { classe: 'faixa-clara', id: 'representa' }
  );
}

function obras(bloco) {
  const cards = bloco.itens
    .map((o) => {
      const selo = o.selo ? `\n          <span class="selo">${escapar(o.selo)}</span>` : '';
      const valor = o.valor ? `\n          ${marcaCifra(o.valor, { classe: 'valor', casas: o.casas ?? null })}` : '';
      const fonte = o.fonte
        ? `\n          <p class="obra-fonte">${escapar(o.fonte)}</p>`
        : '';
      return `        <article class="obra${o.destaque ? ' destaque' : ''} rv">${selo}${valor}
          <h3>${escapar(o.titulo)}</h3>
          <p>${o.texto}</p>${fonte}</article>`;
    })
    .join('\n\n');

  return secao(`${cabecaSecao(bloco)}\n\n      <div class="obras">\n${cards}\n      </div>`, {
    id: bloco.id || 'obras',
    classe: bloco.classe ?? 'faixa-clara',
  });
}

/**
 * Lista de pills. Ou vem escrita à mão (`itens`), ou é montada a partir da
 * base (`fonte`) — que é o caso da lista de municípios de uma região: ela tem
 * de mudar sozinha quando a planilha de emendas mudar.
 */
function chips(bloco, ctx) {
  let lista = bloco.itens;

  if (bloco.fonte) {
    const { tipo, chave } = bloco.fonte;
    lista = Object.values(ctx.emendas.porMunicipio)
      .filter((m) => (tipo === 'coordenacao' ? m.coordenacao === chave : true))
      .sort((a, b) => b.valor - a.valor)
      .map((m) => ({ nome: m.nome, valor: m.valor }));

    if (!lista.length) throw new Error(`chips: nenhuma cidade para ${tipo} ${chave}`);
    if (bloco.esperado && lista.length !== bloco.esperado) {
      throw new Error(`chips ${chave}: ${lista.length} municípios, esperado ${bloco.esperado}`);
    }
  }

  // Só o nome. Valor por cidade não se publica (decisão de 25/09/2026): a lista
  // continua ordenada pelo total da base, mas o total não aparece.
  const itens = lista
    .map((c) => `        <li>${escapar(c.nome)}</li>`)
    .join('\n');
  const nota = bloco.nota ? `\n\n      <p class="chips-nota rv">${bloco.nota}</p>` : '';
  const botao = bloco.botao
    ? `\n\n      <div class="botoes rv">
        <a class="btn btn-acento" href="${bloco.botao.href}">${escapar(bloco.botao.texto)}</a>
      </div>`
    : '';

  return secao(
    `${cabecaSecao(bloco)}\n\n      <ul class="chips rv">\n${itens}\n      </ul>${nota}${botao}`,
    { id: bloco.id, classe: bloco.classe ?? 'fundo-campanha veu' }
  );
}

function pautas(bloco) {
  const itens = bloco.itens
    .map((p) => `        <li>
          <h3>${escapar(p.titulo)}</h3>
          <p>${p.texto}</p>
        </li>`)
    .join('\n');

  return secao(`${cabecaSecao(bloco)}\n\n      <ul class="pautas rv">\n${itens}\n      </ul>`, {
    id: bloco.id,
    classe: bloco.classe,
  });
}

/**
 * Projetos de lei. O selo sai de leis.json, nunca do texto editorial — é a
 * única forma de o site não voltar a dizer "em comissões" para um projeto
 * que foi retirado.
 */
function leis(bloco, ctx) {
  const porCodigo = new Map(ctx.leis.proposicoes.map((p) => [p.codigo, p]));
  // Lei com página própria em /quem-faz/projetos-de-lei/<slug>/ ganha o link.
  const paginaDaLei = new Map((ctx.leisPaginas?.destaques || []).map((d) => [d.codigo, d.slug]));

  const card = (item) => {
    const p = porCodigo.get(item.codigo);
    if (!p) throw new Error(`lei ${item.codigo} não existe em leis.json`);

    return `        <article class="lei rv">
          <h3 class="lei-t">${escapar(item.titulo)}</h3>
          <p class="lei-d">${item.texto}</p>
          ${seloProposicao(p)}${paginaDaLei.has(item.codigo) ? `
          <a class="lei-fonte" href="../projetos-de-lei/${paginaDaLei.get(item.codigo)}/">Entender a lei</a>` : ''}
          <a class="lei-fonte" href="${p.url}" target="_blank" rel="noopener">${escapar(p.codigo.replace('./', ' '))} no e-Legis</a>
        </article>`;
  };

  const grupos = bloco.grupos
    .map((g, i) => {
      const titulo = g.titulo && i > 0 ? `\n      <p class="leis-grupo rv">${escapar(g.titulo)}</p>\n` : '';
      return `${titulo}      <div class="leis">\n${g.itens.map(card).join('\n\n')}\n      </div>`;
    })
    .join('\n\n');

  return secao(`${cabecaSecao(bloco)}\n\n${grupos}`, {
    id: bloco.id || 'leis',
    classe: bloco.classe ?? 'faixa-clara',
  });
}

function imprensa(bloco, ctx) {
  const porId = new Map(ctx.imprensa.materias.map((m) => [m.id, m]));

  const itens = bloco.itens
    .map((item) => {
      const m = porId.get(String(item.id));
      if (!m) throw new Error(`matéria ${item.id} não existe em imprensa.json`);
      if (!m.linkValidado) throw new Error(`matéria ${item.id} está com LINK_VALIDADO diferente de SIM`);

      return `        <li><a class="materia" href="${escapar(m.url)}" target="_blank" rel="noopener">
          <span class="materia-topo">
            <span class="materia-veiculo">${escapar(m.veiculo)}</span>
            <span>${escapar(data(m.data))}</span>
          </span>
          <h3>${escapar(m.titulo)}</h3>
          <p>${escapar(item.resumo)}</p>
          <span class="materia-ler">Ler matéria →</span>
        </a></li>`;
    })
    .join('\n\n');

  return secao(`${cabecaSecao(bloco)}\n\n      <ul class="imprensa rv">\n${itens}\n      </ul>`, {
    id: bloco.id || 'imprensa',
    classe: bloco.classe,
  });
}

function redes(bloco, ctx) {
  const porCodigo = new Map(ctx.redes.posts.map((p) => [p.shortcode, p]));

  const itens = bloco.itens
    .map((item) => {
      const p = porCodigo.get(item.shortcode);
      if (!p) throw new Error(`post ${item.shortcode} não existe em redes.json`);

      const rede = p.redes.includes('instagram') ? 'Instagram' : 'Facebook';
      const numeros = [
        p.curtidas !== null ? `<span>♥ ${milhar(p.curtidas)}</span>` : '',
        p.comentarios !== null ? `<span>💬 ${milhar(p.comentarios)}</span>` : '',
      ].filter(Boolean).join('\n            ');

      return `        <li><a class="post" href="${escapar(p.link)}" target="_blank" rel="noopener">
          <span class="post-topo">
            <span class="post-rede">${rede}</span>
            <span>${escapar(data(p.data))}</span>
          </span>
          <p>${escapar(resumirLegenda(item.legenda || p.legenda, 150))}</p>
          <span class="post-numeros">
            ${numeros}
          </span>
          <span class="post-ver">Ver publicação →</span>
        </a></li>`;
    })
    .join('\n\n');

  const nota = bloco.nota ? `\n\n      <p class="redes-nota rv">${bloco.nota}</p>` : '';

  return secao(`${cabecaSecao(bloco)}\n\n      <ul class="redes rv">\n${itens}\n      </ul>${nota}`, {
    id: bloco.id || 'redes',
    classe: bloco.classe ?? 'faixa-clara',
  });
}

function fecho(lugar, raiz = '../../') {
  const l = lugar.fecho;

  // O pincel marca a palavra final do lema, então casa com a ÚLTIMA ocorrência:
  // em "depende de um Sul forte" quem ganha o traço é o segundo "forte".
  let lema = escapar(l.lema);
  if (l.pincel) {
    const alvo = escapar(l.pincel);
    const i = lema.lastIndexOf(alvo);
    if (i < 0) throw new Error(`${lugar.slug}: pincel "${l.pincel}" não aparece no lema`);
    lema = `${lema.slice(0, i)}<span class="pincel">${alvo}</span>${lema.slice(i + alvo.length)}`;
  }

  return `  <section class="fundo-campanha veu">
    <div class="wrap fecho">
      <img class="marca-vote rv" src="${raiz}assets/brand/marca/vote-11223-escuro-960.webp"
           alt="Vote Pepê 11223, Deputado Estadual" width="960" height="879" />
      <p class="lema rv">${lema}</p>${l.apoio ? `\n      <p class="chips-nota rv">${l.apoio}</p>` : ''}
      <div class="botoes rv">
        <a class="btn btn-acento" id="compartilhar-2" href="#">Mandar no WhatsApp</a>
        <a class="btn btn-vazado" href="${SITE}/">Conhecer o mandato</a>
      </div>
    </div>
  </section>`;
}

/**
 * Grade de links para as outras páginas. Slug atual sai da lista.
 * `qf` é o caminho até a pasta quem-faz/ a partir da página que chama.
 */
function portas(lugar, ctx, qf = '../') {
  const itens = ctx.portas
    .filter((p) => p.slug !== lugar.slug)
    .map((p) =>
      p.existe
        ? `        <a href="${qf}${p.slug}/"><span class="rot">${escapar(p.rot || 'Quem faz')}</span><span class="alvo">${escapar(p.rotulo)}</span></a>`
        : `        <span class="porta-vazia"><span class="rot">Quem faz</span><span class="alvo">${escapar(p.rotulo)}</span></span>`
    )
    .join('\n');
  const indice = `        <a class="porta-indice" href="${qf}"><span class="rot">Todas as páginas</span><span class="alvo">Quem faz representa</span></a>`;

  return secao(
    `${cabecaSecao({ olho: 'Também tem', titulo: 'Quem faz pelo quê' })}\n      <div class="portas rv">\n${itens}\n${indice}\n      </div>`,
    { classe: 'faixa-clara' }
  );
}

/* ──────────────────────────── documento ─────────────────────────── */

/**
 * "Medidas": o que o mandato fez por uma causa, além da emenda. Card com
 * ícone; quando o item é um projeto de lei, o selo sai de leis.json e o card
 * leva à página da lei, se ela existir.
 */
function medidas(bloco, ctx) {
  const porCodigo = new Map(ctx.leis.proposicoes.map((p) => [p.codigo, p]));
  const paginaDaLei = new Map((ctx.leisPaginas?.destaques || []).map((d) => [d.codigo, d.slug]));
  const itens = bloco.itens
    .map((m) => {
      const p = m.codigo ? porCodigo.get(m.codigo) : null;
      if (m.codigo && !p) throw new Error(`medida "${m.titulo}": lei ${m.codigo} não existe em leis.json`);
      const slug = m.codigo && paginaDaLei.get(m.codigo);
      const abre = slug ? `<a class="md" href="${bloco.aquiLeis || '../projetos-de-lei/'}${slug}/">` : '<div class="md">';
      const fecha = slug ? '</a>' : '</div>';
      return `        <li>${abre}
          <span class="md-icone">${icone(m.icone || 'circle-check-big')}</span>
          <h3>${escapar(m.titulo)}</h3>
          <p>${escapar(m.texto)}</p>${p ? `\n          ${seloProposicao(p)}` : ''}${slug ? `\n          <span class="md-ver">Entender a lei ${icone('arrow-right')}</span>` : ''}
        ${fecha}</li>`;
    })
    .join('\n');
  return secao(`${cabecaSecao(bloco)}\n\n      <ul class="medidas">\n${itens}\n      </ul>`, {
    id: bloco.id || 'medidas',
    classe: bloco.classe ?? 'faixa-clara',
  });
}

/** Galeria de fotos do tema (mosaico, ver visual.cjs). */
const galeria = (bloco, ctx) => visual.mosaico({ ...bloco, id: bloco.id || 'galeria' }, ctx, '../');

/** Cards das páginas de lei, pelos slugs de leis-paginas.json. */
function leisPaginas(bloco, ctx) {
  const { cardLei, indexar } = require('./leis.cjs');
  const { proposicao } = indexar(ctx);
  const porSlug = new Map(ctx.leisPaginas.destaques.map((d) => [d.slug, d]));
  const cards = bloco.slugs.map((slug) => {
    const d = porSlug.get(slug);
    if (!d) throw new Error(`leisPaginas: "${slug}" não existe em leis-paginas.json`);
    return cardLei(d, proposicao(d.codigo), ctx, '../', '../projetos-de-lei/');
  });
  return secao(`${cabecaSecao(bloco)}\n\n      <div class="leis-foto leis-foto-mini">\n${cards.join('\n')}\n      </div>`, {
    id: bloco.id || 'leis-paginas',
    classe: bloco.classe ?? '',
  });
}

/** Posts do Instagram com capa (dados/instagram.json). Ver visual.cjs. */
const vitrine = (bloco, ctx) => visual.vitrine(bloco, ctx, '../');
/** Os reels da série "Quem faz por…", em pôster vertical. */
const serie = (bloco, ctx) => visual.serie(bloco, ctx, '../');

const RENDERIZADORES = { obras, chips, pautas, leis, imprensa, redes, vitrine, serie, medidas, galeria, leisPaginas };

function montar(lugar, ctx) {
  const url = `${SITE}/quem-faz/${lugar.slug}/`;
  const corpo = [
    hero(lugar),
    placar(lugar),
    lugar.pergunta ? pergunta(lugar) : '',
    ...lugar.secoes.map((bloco) => {
      const render = RENDERIZADORES[bloco.tipo];
      if (!render) throw new Error(`seção de tipo "${bloco.tipo}" não existe`);
      return render(bloco, ctx);
    }),
    fecho(lugar),
    portas(lugar, ctx),
  ]
    .filter(Boolean)
    .join('\n\n');

  const local = lugar.local && {
    contentLocation: {
      '@type': lugar.tipo === 'cidade' ? 'City' : 'AdministrativeArea',
      name: lugar.local,
      containedInPlace: { '@type': 'State', name: 'Santa Catarina' },
    },
  };

  return documento({
    seo: lugar.seo,
    caminho: `quem-faz/${lugar.slug}/`,
    profundidade: 1,
    corpo,
    compartilhar: lugar.compartilhar,
    jsonLd: jsonLdPessoa(lugar.seo, url, local || {}),
    coletadoEm: ctx.leis.coletadoEm,
    tema: lugar.tema,
    notaRodape: /"ilustrativa"/.test(corpo) || corpo.includes('class="ilustrativa"') ? 'Imagens marcadas como ilustrativas: Pexels.' : '',
  });
}

/**
 * Renderiza uma seção fora da página do lugar (as páginas de lei reaproveitam
 * a seção "medidas" do autismo). `qf` é o prefixo até a pasta quem-faz/.
 */
function renderizar(bloco, ctx, qf = '../') {
  if (bloco.tipo === 'medidas') return medidas({ ...bloco, aquiLeis: qf === '../' ? '../projetos-de-lei/' : '../' }, ctx);
  const render = RENDERIZADORES[bloco.tipo];
  if (!render) throw new Error(`seção de tipo "${bloco.tipo}" não existe`);
  return render(bloco, ctx);
}

module.exports = { montar, hero, placar, fecho, portas, cabecaSecao, secao, marcaCifra, seloProposicao, letrasDaMaiorPalavra, renderizar, INFINITO };
