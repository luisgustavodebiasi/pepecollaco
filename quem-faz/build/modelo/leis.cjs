/**
 * As páginas de lei:
 *
 *   /quem-faz/projetos-de-lei/          todas as proposições, agrupadas
 *   /quem-faz/projetos-de-lei/<slug>/   uma página por lei de destaque
 *
 * Regra de ouro herdada do resto da série: número da lei, data, situação e
 * setor vêm SEMPRE de leis.json (e-Legis). O texto editorial fica em
 * dados/leis-paginas.json e só escolhe, descreve e cita.
 */

const { escapar, data } = require('../lib/formato.cjs');
const { icone } = require('../lib/icones.cjs');
const { SITE, documento, jsonLdPessoa } = require('./base.cjs');
const visual = require('./visual.cjs');
const pagina = require('./pagina.cjs');

const SLUG = 'projetos-de-lei';

/* ───────────────────────────── consulta ──────────────────────────── */

function indexar(ctx) {
  const porCodigo = new Map(ctx.leis.proposicoes.map((p) => [p.codigo, p]));
  const proposicao = (codigo) => {
    const p = porCodigo.get(codigo);
    if (!p) throw new Error(`lei ${codigo} não existe em leis.json`);
    return p;
  };
  return { porCodigo, proposicao };
}

const emTramitacao = (p) => !p.virouLei && !p.retirado && !p.rejeitado;

function classeSelo(p) {
  if (p.virouLei) return 'selo-lei';
  if (p.retirado || p.rejeitado) return 'selo-encerrado';
  return 'selo-comissao';
}

// Selo de situação: APROVADO em verde quando virou lei (com o número ao lado),
// o rótulo do e-Legis quando ainda tramita. Mesmo selo em todo o site.
const selo = (p) => pagina.seloProposicao(p);

/** "PL./0281/2023" → "PL 0281/2023" */
const codigoLegivel = (c) => c.replace('./', ' ').replace(/^(\w+)\/(\d+\/\d+)$/, '$1 $2');

/**
 * Nome da entidade numa lei de utilidade pública, tirado da ementa.
 * "Declara de utilidade pública a Associação X, de Laguna, e altera…" → "Associação X"
 */
function nomeEntidade(p) {
  let s = p.ementa.replace(/^Declara de utilidade pública\s+/i, '');
  s = s.split(/\s+e\s+[Aa]ltera\b/)[0];
  s = s.split(/,\s*com sede/)[0];
  s = s.replace(/^(a|o)\s+/i, '');
  if (p.municipio) {
    const m = p.municipio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    s = s.replace(new RegExp(`,?\\s+de\\s+${m}\\b.*$`), '');
  }
  return s.replace(/[\s,]+(de)?\s*$/, '').trim();
}

/* ───────────────────────────── peças ─────────────────────────────── */

function heroGeral(dados, ctx) {
  const total = ctx.leis.totalLeis;
  return `  <header class="hero fundo-campanha veu">
    <div class="wrap hero-grade">
      <div>
        <h1><span class="leve">quem</span> <span class="forte">FAZ</span> <span class="pincel">lei</span></h1>

        <p class="hero-frase">${dados.hero.frase}</p>

        <div class="manchete">
          <span class="cifra">${total} <small>LEIS</small></span>
          <span class="legenda">aprovadas e sancionadas em Santa Catarina</span>
        </div>

        <div class="botoes">
          <a class="btn btn-acento" href="#mudam">Ver as leis</a>
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

function placarGeral(ctx) {
  const L = ctx.leis.proposicoes;
  const celulas = [
    [L.length, 'proposições apresentadas'],
    [ctx.leis.totalLeis, 'viraram lei'],
    [L.filter((p) => p.tipo === 'utilidade-publica' && p.virouLei).length, 'entidades reconhecidas'],
    [L.filter(emTramitacao).length, 'em tramitação'],
  ];
  return visual.secao(
    `      <div class="placar rv">\n${celulas
      .map(([b, s]) => `        <div>\n          <b>${b}</b>\n          <span>${s}</span>\n        </div>`)
      .join('\n')}\n      </div>`,
    { rotulo: 'As leis em números' }
  );
}

/** Card com foto de uma lei de destaque. `qf` até quem-faz/, `aqui` até projetos-de-lei/. */
function cardLei(d, p, ctx, qf, aqui) {
  return `        <a class="lf" href="${aqui}${d.slug}/">
          <span class="lf-foto">${visual.foto(d.foto, ctx, qf, { alt: '' })}${visual.seloIlustrativa(d.foto, ctx)}</span>
          <span class="lf-corpo">
            ${selo(p)}
            <span class="lf-titulo" style="--letras:${pagina.letrasDaMaiorPalavra(d.titulo)}">${escapar(d.titulo)}</span>
            <span class="lf-texto">${escapar(d.curto)}</span>
            <span class="lf-ver">Entender a lei ${icone('arrow-right')}</span>
          </span>
        </a>`;
}

/**
 * Ementa enxuta para as listas. Metade das ementas termina com a mesma cauda
 * burocrática ("e altera o Anexo Único da Lei nº 18.278, de 2021, que
 * 'Consolida…'"), que numa lista de 41 linhas esconde o que muda de uma para
 * outra. A página de cada lei mostra a ementa inteira, sem corte.
 */
function ementaCurta(p) {
  let s = p.ementa;
  // Corta a partir de "e altera o Anexo…" (ou do "o Anexo…" solto, que a Alesc
  // às vezes escreve sem o verbo), desde que sobre uma frase antes: nas
  // ementas que COMEÇAM por "Altera o Anexo", o anexo é o assunto.
  const cauda = s.match(/,?\s+(?:e\s+[Aa]ltera\s+)?o\s+Anexo\s+(?:Único|[IVX]+)\b/);
  if (cauda && cauda.index > 40) s = s.slice(0, cauda.index);
  s = s.replace(/,?\s+que\s+"Consolida[^"]*"/, '');
  // "…Rede Caixa Solidária Brasil, de e Altera…": a Alesc deixou a cidade em
  // branco nessa ementa, e o corte acima sobra com um "de" pendurado.
  s = s.replace(/\s+/g, ' ').trim().replace(/,?\s+de$/, '').replace(/[,;:]$/, '');
  return /[.)]$/.test(s) ? s : `${s}.`;
}

function linhaProposicao(p) {
  const grupo = p.virouLei ? 'lei' : emTramitacao(p) ? 'tramitacao' : 'encerrada';
  return `        <li data-grupo="${grupo}">
          <span class="pl-codigo">${escapar(codigoLegivel(p.codigo))}</span>
          <span class="pl-ementa">${escapar(ementaCurta(p))}</span>
          ${selo(p)}
          <a class="pl-link" href="${p.url}" target="_blank" rel="noopener">e-Legis ${icone('arrow-up-right')}</a>
        </li>`;
}

/* ─────────────────────────── página geral ────────────────────────── */

function montarGeral(ctx) {
  const dados = ctx.leisPaginas;
  const { proposicao } = indexar(ctx);
  const qf = '../';
  const L = ctx.leis.proposicoes;

  const destaques = dados.destaques.map((d) => ({ d, p: proposicao(d.codigo) }));
  const aprovadas = destaques.filter((x) => x.p.virouLei);
  const naFila = destaques.filter((x) => !x.p.virouLei);
  const codigosDestaque = new Set(dados.destaques.map((d) => d.codigo));

  // As outras que ainda tramitam e não têm página própria.
  const outrasNaFila = L.filter((p) => emTramitacao(p) && p.tipo !== 'utilidade-publica' && !codigosDestaque.has(p.codigo));

  const secMudam = visual.secao(
    `${visual.cabeca({ olho: 'Já são lei', titulo: 'As leis que mudam a vida', texto: 'Propostas pelo deputado, aprovadas na Alesc e sancionadas. Toque em cada uma para ver o que muda na prática.' })}

      <div class="leis-foto leis-foto-cinco">
${aprovadas.map(({ d, p }) => cardLei(d, p, ctx, qf, './')).join('\n')}
      </div>`,
    { id: 'mudam', classe: 'faixa-clara' }
  );

  const secFila = visual.secao(
    `${visual.cabeca({ olho: 'Na fila da Alesc', titulo: 'O que ainda tramita', texto: 'Projetos apresentados que seguem nas comissões. A situação de cada um é a do e-Legis, conferida em ' + escapar(data(ctx.leis.coletadoEm)) + '.' })}

      <div class="leis-foto leis-foto-duas">
${naFila.map(({ d, p }) => cardLei(d, p, ctx, qf, './')).join('\n')}
      </div>

      <ul class="pl-lista pl-curta rv">
${outrasNaFila.map(linhaProposicao).join('\n')}
      </ul>`,
    { id: 'fila' }
  );

  const c = dados.ccj;
  const secCcj = `  <section class="fundo-campanha veu" id="ccj">
    <div class="wrap faixa-foto">
      <figure class="faixa-foto-img rv">${visual.foto(c.foto, ctx, qf)}</figure>
      <div class="faixa-foto-texto rv">
        <span class="olho">${escapar(c.olho)}</span>
        <h2>${escapar(c.titulo)}</h2>
        <p>${escapar(c.texto)}</p>
        <div class="botoes">
          <a class="btn btn-vazado" href="https://www.instagram.com/p/${c.post}/" target="_blank" rel="noopener">${icone('instagram')}Ver o post</a>
        </div>
      </div>
    </div>
  </section>`;

  // Utilidade pública, por cidade: a lei que cada cidade tem para mostrar.
  const porCidade = new Map();
  for (const p of L.filter((x) => x.tipo === 'utilidade-publica')) {
    const cidade = p.municipio || 'Santa Catarina';
    if (!porCidade.has(cidade)) porCidade.set(cidade, []);
    porCidade.get(cidade).push(p);
  }
  const cidades = [...porCidade.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'pt'));
  const secComunidade = visual.secao(
    `${visual.cabeca({ olho: 'Utilidade pública', titulo: 'Quem faz pela comunidade', texto: 'O título de utilidade pública estadual abre portas para associações, clubes e entidades receberem apoio. Estas foram reconhecidas por lei do deputado, ou estão a caminho.' })}

      <div class="comunidade">
${cidades
  .map(([cidade, ps]) => `        <article class="cm rv">
          <h3>${icone('map-pin')}${escapar(cidade)}</h3>
          <ul>
${ps
  .map((p) => `            <li><a href="${p.url}" target="_blank" rel="noopener"><span>${escapar(nomeEntidade(p))}</span>${selo(p)}</a></li>`)
  .join('\n')}
          </ul>
        </article>`)
  .join('\n')}
      </div>`,
    { id: 'comunidade', classe: 'faixa-clara' }
  );

  // Só o que já é lei: o que ainda tramita (o Tombo da Polenta, por exemplo)
  // já aparece na fila, e não pode constar em "o que mais virou lei".
  const homenagens = L.filter((p) => p.virouLei && p.tipo !== 'utilidade-publica' && !codigosDestaque.has(p.codigo));
  const secHomenagens = visual.secao(
    `${visual.cabeca({ olho: 'Nomes, títulos e festas', titulo: 'O que mais virou lei', texto: 'Denominação de rodovia, título de cidadão, festa no calendário oficial. Lei pequena, mas lei, e com número.' })}

      <ul class="pl-lista rv">
${homenagens.map(linhaProposicao).join('\n')}
      </ul>`,
    { id: 'homenagens' }
  );

  const contagem = {
    todas: L.length,
    lei: L.filter((p) => p.virouLei).length,
    tramitacao: L.filter(emTramitacao).length,
    encerrada: L.filter((p) => !p.virouLei && !emTramitacao(p)).length,
  };
  const ordenadas = [...L].sort((a, b) => {
    const [, na, aa] = a.codigo.match(/(\d+)\/(\d{4})$/);
    const [, nb, ab] = b.codigo.match(/(\d+)\/(\d{4})$/);
    return ab - aa || nb - na;
  });
  const secTodas = visual.secao(
    `${visual.cabeca({ olho: 'Na íntegra', titulo: `As ${L.length} proposições`, texto: 'Tudo o que o deputado apresentou na Alesc, do mais novo ao mais antigo, com a ementa oficial e o link para a tramitação.' })}

      <div class="pl-filtro rv" role="group" aria-label="Filtrar proposições">
        <button type="button" data-filtro="todas" aria-pressed="true">Todas <b>${contagem.todas}</b></button>
        <button type="button" data-filtro="lei" aria-pressed="false">Viraram lei <b>${contagem.lei}</b></button>
        <button type="button" data-filtro="tramitacao" aria-pressed="false">Em tramitação <b>${contagem.tramitacao}</b></button>
        <button type="button" data-filtro="encerrada" aria-pressed="false">Encerradas <b>${contagem.encerrada}</b></button>
      </div>

      <ul class="pl-lista pl-todas" id="pl-todas">
${ordenadas.map(linhaProposicao).join('\n')}
      </ul>`,
    { id: 'todas', classe: 'faixa-clara' }
  );

  const secRedes = visual.vitrine(
    { olho: 'Nas redes', titulo: 'As leis contadas pelo deputado', shortcodes: dados.redes, limite: 8 },
    ctx, qf
  );

  const lugar = { slug: SLUG, fecho: dados.fecho };
  const corpo = [
    heroGeral(dados, ctx),
    placarGeral(ctx),
    secMudam,
    secFila,
    secCcj,
    secComunidade,
    secHomenagens,
    secTodas,
    secRedes,
    pagina.fecho(lugar, '../../'),
    pagina.portas(lugar, ctx, '../'),
  ].join('\n\n');

  return documento({
    seo: dados.seo,
    caminho: `quem-faz/${SLUG}/`,
    profundidade: 1,
    corpo,
    compartilhar: dados.compartilhar,
    jsonLd: jsonLdPessoa(dados.seo, `${SITE}/quem-faz/${SLUG}/`),
    coletadoEm: ctx.leis.coletadoEm,
    notaRodape: 'Imagens marcadas como ilustrativas: Pexels.',
    scripts: SCRIPT_FILTRO,
  });
}

/** Filtro da lista completa. Sem JavaScript a lista aparece inteira. */
const SCRIPT_FILTRO = `<script>
  (() => {
    const lista = document.getElementById('pl-todas');
    const botoes = document.querySelectorAll('.pl-filtro button');
    botoes.forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filtro;
      botoes.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      for (const li of lista.children) li.hidden = f !== 'todas' && li.dataset.grupo !== f;
    }));
  })();
</script>`;

/* ─────────────────────────── página de lei ───────────────────────── */

function montarLei(d, ctx) {
  const dados = ctx.leisPaginas;
  const { proposicao } = indexar(ctx);
  const p = proposicao(d.codigo);
  const qf = '../../';
  const raiz = '../../../';
  const caminho = `quem-faz/${SLUG}/${d.slug}/`;

  const ficha = p.virouLei
    ? [
        [p.rotulo.replace(/^LEI Nº /, ''), 'número da lei'],
        [p.leiData, 'sancionada em'],
        [p.entrada, 'apresentada em'],
        [p.materia, 'área'],
      ]
    : [
        ['Em tramitação', escapar(p.situacao).toLowerCase()],
        [p.setor.replace(/^Comissão de /, ''), 'onde está agora'],
        [p.entrada, 'apresentado em'],
        [p.materia, 'área'],
      ];

  // O título pode ter palavra enorme ("OVINOCAPRINOCULTURA", 19 letras): o
  // corpo é calibrado pela maior palavra, para caber na coluna sem quebrar.
  const hero = `  <header class="hero hero-lei fundo-campanha veu">${d.tema === 'autismo' ? `\n    ${pagina.INFINITO}` : ''}
    <div class="wrap hero-lei-grade">
      <div class="hero-lei-texto">
        <a class="volta" href="../">${icone('arrow-right')}Quem faz lei</a>
        <h1 class="h1-lei" style="--letras:${pagina.letrasDaMaiorPalavra(d.titulo)}">${escapar(d.titulo)}</h1>
        <div class="hero-lei-selos">${selo(p)}<span class="selo selo-codigo">${escapar(codigoLegivel(p.codigo))}</span></div>
        <p class="hero-frase">${escapar(d.frase)}</p>
        <div class="botoes">
          <a class="btn btn-acento" href="${p.url}" target="_blank" rel="noopener">Ver a tramitação ${icone('arrow-up-right')}</a>
          <a class="btn btn-vazado" id="compartilhar" href="#" rel="noopener">Mandar para alguém</a>
        </div>
      </div>
      <figure class="hero-lei-foto">
        ${visual.foto(d.foto, ctx, qf, { carregar: 'eager' })}${visual.seloIlustrativa(d.foto, ctx)}
      </figure>
    </div>
  </header>`;

  const secFicha = visual.secao(
    `      <div class="placar placar-ficha rv">\n${ficha
      .map(([b, s]) => `        <div>\n          <b>${escapar(b)}</b>\n          <span>${s}</span>\n        </div>`)
      .join('\n')}\n      </div>`,
    { rotulo: 'Ficha da lei' }
  );

  // Fotos de apoio, ao pé da coluna "na prática". Quadro de vídeo do mandato
  // leva legenda dizendo de onde veio; foto de banco leva o selo ilustrativa.
  const apoios = (d.fotosApoio || []).map((a) => `
            <figure class="lei-apoio">${visual.foto(a.foto, ctx, qf)}${visual.seloIlustrativa(a.foto, ctx)}${a.legenda ? `<figcaption>${escapar(a.legenda)}</figcaption>` : ''}</figure>`).join('');
  const apoio = apoios ? `\n          <div class="lei-apoios">${apoios}\n          </div>` : '';

  const secTexto = visual.secao(
    `      <div class="lei-duas">
        <div class="rv">
          <span class="olho">O que diz ${p.virouLei ? 'a lei' : 'o projeto'}</span>
          <blockquote class="ementa">
            <p>${escapar(p.ementa)}</p>
            <cite>Ementa oficial · ${escapar(codigoLegivel(p.codigo))} · Alesc</cite>
          </blockquote>
          <a class="lei-fonte" href="${p.url}" target="_blank" rel="noopener">Ler a tramitação completa no e-Legis</a>
        </div>
        <div class="rv">
          <span class="olho">Na prática</span>
          <ul class="pratica">
${d.pratica.map((t) => `            <li>${icone('circle-check-big')}<span>${escapar(t)}</span></li>`).join('\n')}
          </ul>${apoio}
        </div>
      </div>`,
    { id: 'lei', classe: 'faixa-clara' }
  );

  const secGanha = visual.secao(
    `${visual.cabeca({ olho: 'Para quem', titulo: 'Quem ganha com isso' })}

      <ul class="ganha">
${d.quemGanha.map((t) => `        <li>${icone(d.icone || 'users')}<span>${escapar(t)}</span></li>`).join('\n')}
      </ul>`,
    { id: 'quem-ganha' }
  );

  const cit = d.citacao;
  const fundoCitacao = d.fotoFaixa
    ? `\n    <div class="citacao-fundo">${visual.foto(d.fotoFaixa, ctx, qf, { alt: '' })}</div>`
    : '';
  const secCitacao = `  <section class="fundo-campanha veu${d.fotoFaixa ? ' citacao-com-foto' : ''}">${fundoCitacao}
    <div class="wrap citacao rv">
      <blockquote>
        <p>${escapar(cit.texto)}</p>
        <cite><img src="${raiz}assets/brand/foto/pepe-busto-900.webp" alt="" width="677" height="900" />Pepê Collaço, no Instagram</cite>
      </blockquote>
      <a class="btn btn-vazado" href="https://www.instagram.com/p/${cit.post}/" target="_blank" rel="noopener">${icone('instagram')}Ver o post</a>
    </div>
  </section>`;

  const secRedes = visual.vitrine(
    {
      olho: `${d.titulo} nas redes`,
      shortcodes: d.posts,
      limite: 6,
      id: 'redes',
      classe: 'faixa-clara',
      linhaDoTempo: true,
      assunto: d.assunto || d.titulo,
    },
    ctx, qf
  );

  // Nas leis do autismo, o que mais o mandato fez pela causa: vem da mesma
  // seção "medidas" da página pelo-autismo, para as duas nunca divergirem.
  const medidasAutismo = d.tema === 'autismo'
    ? ctx.lugares?.['pelo-autismo']?.secoes?.find((x) => x.tipo === 'medidas')
    : null;
  const secMedidas = medidasAutismo
    ? pagina.renderizar({
        ...medidasAutismo,
        olho: 'Pelo autismo',
        titulo: 'Esta lei não anda sozinha',
        texto: 'O que mais o mandato fez pelas pessoas com TEA e pelas famílias atípicas de Santa Catarina.',
        itens: medidasAutismo.itens.filter((m) => m.codigo !== d.codigo),
        classe: '',
      }, ctx, '../../')
    : '';

  const outras = dados.destaques.filter((x) => x.slug !== d.slug).slice(0, 6);
  const secOutras = visual.secao(
    `${visual.cabeca({ olho: 'Quem faz lei', titulo: 'Outras leis do deputado' })}

      <div class="leis-foto leis-foto-mini">
${outras.map((x) => cardLei(x, proposicao(x.codigo), ctx, qf, '../')).join('\n')}
      </div>

      <div class="botoes rv">
        <a class="btn btn-acento" href="../">Ver as ${ctx.leis.proposicoes.length} proposições</a>
      </div>`,
    { id: 'outras' }
  );

  const lugar = { slug: SLUG, fecho: dados.fecho };
  const corpo = [
    hero,
    secFicha,
    secTexto,
    secGanha,
    secCitacao,
    secRedes,
    secMedidas,
    secOutras,
    pagina.fecho(lugar, raiz),
    pagina.portas(lugar, ctx, qf),
  ].join('\n\n');

  const seo = {
    titulo: `${d.titulo}${p.virouLei ? `: ${p.rotulo.replace('LEI Nº', 'Lei nº')}` : ''}`,
    descricao: `${d.frase} ${p.virouLei ? `Lei estadual nº ${p.rotulo.replace(/^LEI Nº /, '')}, de autoria do deputado Pepê Collaço.` : 'Projeto de lei do deputado Pepê Collaço, em tramitação na Alesc.'}`,
    ogDescricao: d.curto,
  };

  return {
    caminho,
    html: documento({
      seo,
      caminho,
      profundidade: 2,
      corpo,
      compartilhar: `${d.titulo}: ${d.curto} Lei do Pepê Collaço.`.replace('. Lei do', p.virouLei ? '. Lei do' : '. Projeto do'),
      jsonLd: jsonLdPessoa(seo, `${SITE}/${caminho}`, {
        mentions: {
          '@type': 'Legislation',
          name: d.titulo,
          legislationIdentifier: p.virouLei ? p.rotulo.replace(/^LEI Nº /, 'Lei nº ') : codigoLegivel(p.codigo),
          legislationJurisdiction: 'Santa Catarina',
          url: p.url,
        },
      }),
      coletadoEm: ctx.leis.coletadoEm,
      notaRodape: corpo.includes('class="ilustrativa"') ? 'Imagens marcadas como ilustrativas: Pexels.' : '',
      tema: d.tema,
    }),
  };
}

module.exports = { montarGeral, montarLei, SLUG, nomeEntidade, codigoLegivel, ementaCurta, cardLei, indexar };
