/**
 * Monta o HTML de uma página "quem faz" a partir do objeto do lugar
 * (dados/lugares.json) e das bases normalizadas.
 *
 * Cada seção é uma função pura. A ordem quem manda é `lugar.secoes`, então dá
 * para uma cidade ter "ruas" e outra não, sem tocar no gerador.
 */

const { escapar, cifra, cifraChip, milhar, data, resumirLegenda } = require('../lib/formato.cjs');

const SITE = 'https://www.pepecollaco.com';

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
  const titulo = h.titulo
    .map((p) => `<span class="${p.estilo}">${escapar(p.texto)}</span>`)
    .join(' ');

  return `  <header class="hero fundo-campanha veu">
    <div class="wrap hero-grade">
      <div>
        <h1>${titulo}</h1>

        <p class="hero-frase">${h.frase}</p>

        <div class="manchete">
          ${marcaCifra(h.valor, { mais: h.mais, casas: h.casas ?? null })}
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

  const itens = lista
    .map((c) => `        <li>${escapar(c.nome)}${c.valor ? ` <b>${cifraChip(c.valor)}</b>` : ''}</li>`)
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

  const card = (item) => {
    const p = porCodigo.get(item.codigo);
    if (!p) throw new Error(`lei ${item.codigo} não existe em leis.json`);

    const classe = p.virouLei ? 'selo-lei' : p.retirado || p.rejeitado ? 'selo-encerrado' : 'selo-comissao';
    return `        <article class="lei rv">
          <h3 class="lei-t">${escapar(item.titulo)}</h3>
          <p class="lei-d">${item.texto}</p>
          <span class="selo ${classe}">${escapar(p.rotulo)}</span>
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

function fecho(lugar) {
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
      <img class="marca-vote rv" src="../../assets/brand/marca/vote-11223-escuro-960.webp"
           alt="Vote Pepê 11223, Deputado Estadual" width="960" height="879" />
      <p class="lema rv">${lema}</p>${l.apoio ? `\n      <p class="chips-nota rv">${l.apoio}</p>` : ''}
      <div class="botoes rv">
        <a class="btn btn-acento" id="compartilhar-2" href="#">Mandar no WhatsApp</a>
        <a class="btn btn-vazado" href="${SITE}/">Conhecer o mandato</a>
      </div>
    </div>
  </section>`;
}

/** Grade de links para as outras páginas. Slug atual sai da lista. */
function portas(lugar, ctx) {
  const itens = ctx.portas
    .filter((p) => p.slug !== lugar.slug)
    .map((p) =>
      p.existe
        ? `        <a href="../${p.slug}/"><span class="rot">Quem faz</span><span class="alvo">${escapar(p.rotulo)}</span></a>`
        : `        <span class="porta-vazia"><span class="rot">Quem faz</span><span class="alvo">${escapar(p.rotulo)}</span></span>`
    )
    .join('\n');

  return secao(
    `${cabecaSecao({ olho: 'Também tem', titulo: 'Quem faz pelo quê' })}\n      <div class="portas rv">\n${itens}\n      </div>`,
    { classe: 'faixa-clara' }
  );
}

/* ──────────────────────────── documento ─────────────────────────── */

const RENDERIZADORES = { obras, chips, pautas, leis, imprensa, redes };

function jsonLd(lugar) {
  const dado = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: lugar.seo.titulo,
    description: lugar.seo.descricao,
    url: `${SITE}/quem-faz/${lugar.slug}/`,
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', name: 'Pepê Collaço 11223', url: `${SITE}/` },
    about: {
      '@type': 'Person',
      name: 'Pepê Collaço',
      alternateName: 'Felippe Luiz Collaço',
      jobTitle: 'Deputado Estadual de Santa Catarina',
      affiliation: { '@type': 'PoliticalParty', name: 'Progressistas' },
    },
    ...(lugar.local && {
      contentLocation: {
        '@type': lugar.tipo === 'cidade' ? 'City' : 'AdministrativeArea',
        name: lugar.local,
        containedInPlace: { '@type': 'State', name: 'Santa Catarina' },
      },
    }),
  };
  return JSON.stringify(dado, null, 2).split('\n').map((l) => `    ${l}`).join('\n');
}

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

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0E1E46" />

  <title>${escapar(lugar.seo.titulo)} | Pepê Collaço 11223</title>
  <meta name="description" content="${escapar(lugar.seo.descricao)}" />

  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Pepê Collaço 11223" />
  <meta property="og:title" content="${escapar(lugar.seo.titulo)}" />
  <meta property="og:description" content="${escapar(lugar.seo.ogDescricao || lugar.seo.descricao)}" />
  <meta property="og:image" content="${url}og.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />

  <link rel="canonical" href="${url}" />
  <link rel="icon" href="../../assets/brand/simbolo/favicon-32.png" sizes="32x32" />
  <link rel="icon" href="../../assets/brand/simbolo/favicon-512.png" sizes="512x512" />
  <link rel="apple-touch-icon" href="../../assets/brand/simbolo/apple-touch-icon.png" />

  <!-- Acumin Pro (texto) pelo kit licenciado da Adobe Fonts. A cópia
       self-hosted em assets/brand/fontes/ segue como reserva no --fonte, e só
       é baixada se este kit não responder, por isso ela não é pré-carregada.

       A Acumin Pro Wide (display) NÃO está no kit da Adobe: ela vem só da
       cópia self-hosted, e desenha o título do hero. Por ser crítica para a
       primeira dobra, os dois pesos que aparecem lá em cima, a Black do título
       e a Extra Light da unidade, são pré-carregados. -->
  <link rel="preconnect" href="https://use.typekit.net" crossorigin />
  <link rel="preconnect" href="https://p.typekit.net" crossorigin />
  <link rel="stylesheet" href="https://use.typekit.net/ojd2pjl.css" />
  <link rel="preload" href="../../assets/brand/fontes/acumin-wide-900.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="../../assets/brand/fontes/acumin-wide-275.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="../../assets/brand/css/tipografia.css" />
  <link rel="stylesheet" href="../../assets/brand/css/tokens.css" />
  <link rel="stylesheet" href="../quem-faz.css" />

  <script type="application/ld+json">
${jsonLd(lugar)}
  </script>
</head>
<body>
  <script>document.documentElement.classList.add('js');</script>

${corpo}

  <footer>
    <div class="wrap">
      <img src="../../assets/brand/marca/collaco-11223-escuro-480.webp"
           alt="Pepê Collaço 11223" width="480" height="439" />
      <p>
        Pepê Collaço · Deputado Estadual de Santa Catarina · Progressistas ·
        Federação União Progressista.<br />
        Valores destinados pelo mandato entre 2023 e 2026, conforme o controle de
        emendas do gabinete. Situação dos projetos de lei conforme o e-Legis da
        Alesc em ${escapar(data(ctx.leis.coletadoEm))}.
        <a href="${SITE}/">pepecollaco.com</a>
      </p>
    </div>
  </footer>

<script src="../quem-faz.js" defer></script>
<script>
  const texto = ${JSON.stringify(lugar.compartilhar)};
  const url = ${JSON.stringify(url)};

  for (const id of ['compartilhar', 'compartilhar-2']) {
    const b = document.getElementById(id);
    if (!b) continue;
    b.href = 'https://wa.me/?text=' + encodeURIComponent(texto + ' ' + url);
    b.target = '_blank';
    b.addEventListener('click', (e) => {
      if (!navigator.share) return;
      e.preventDefault();
      navigator.share({ title: ${JSON.stringify(lugar.seo.titulo)}, text: texto, url }).catch(() => {});
    });
  }
</script>
</body>
</html>
`;
}

module.exports = { montar };
