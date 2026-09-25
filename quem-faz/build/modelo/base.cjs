/**
 * A casca de toda página QUEM FAZ: <head>, rodapé e o script de compartilhar.
 *
 * As páginas moram em três profundidades (/quem-faz/, /quem-faz/<slug>/ e
 * /quem-faz/projetos-de-lei/<slug>/), e os caminhos são relativos para a
 * página abrir igual no GitHub Pages e num servidor local. Quem chama diz a
 * profundidade; daqui saem os dois prefixos:
 *
 *   raiz  do documento até a raiz do site        ("../../")
 *   qf    do documento até a pasta quem-faz/     ("../")
 */

const { escapar, data } = require('../lib/formato.cjs');
const { sprite } = require('../lib/icones.cjs');

const SITE = 'https://www.pepecollaco.com';

function prefixos(profundidade) {
  const raiz = '../'.repeat(profundidade + 1);
  const qf = profundidade === 0 ? './' : '../'.repeat(profundidade);
  return { raiz, qf };
}

function jsonLdPessoa(seo, url, extra = {}) {
  const dado = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.titulo,
    description: seo.descricao,
    url,
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', name: 'Pepê Collaço 11223', url: `${SITE}/` },
    about: {
      '@type': 'Person',
      name: 'Pepê Collaço',
      alternateName: 'Felippe Luiz Collaço',
      jobTitle: 'Deputado Estadual de Santa Catarina',
      affiliation: { '@type': 'PoliticalParty', name: 'Progressistas' },
    },
    ...extra,
  };
  return JSON.stringify(dado, null, 2).split('\n').map((l) => `    ${l}`).join('\n');
}

/**
 * @param {object} p
 * @param {object} p.seo          { titulo, descricao, ogDescricao? }
 * @param {string} p.caminho      caminho público, com barra no fim ("quem-faz/pela-amurel/")
 * @param {number} p.profundidade 0 para /quem-faz/, 1 para /quem-faz/x/, 2 para /quem-faz/x/y/
 * @param {string} p.corpo        HTML das seções
 * @param {string} p.compartilhar texto que acompanha o link no WhatsApp
 * @param {string} p.jsonLd       bloco JSON-LD já formatado
 * @param {string} p.coletadoEm   data da coleta do e-Legis, para o rodapé
 * @param {string} [p.notaRodape] frase extra no rodapé (crédito de imagem, por exemplo)
 * @param {string} [p.scripts]    <script> extra no fim do body
 */
function documento(p) {
  const { raiz, qf } = prefixos(p.profundidade);
  const url = `${SITE}/${p.caminho}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#0E1E46" />

  <title>${escapar(p.seo.titulo)} | Pepê Collaço 11223</title>
  <meta name="description" content="${escapar(p.seo.descricao)}" />

  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Pepê Collaço 11223" />
  <meta property="og:title" content="${escapar(p.seo.titulo)}" />
  <meta property="og:description" content="${escapar(p.seo.ogDescricao || p.seo.descricao)}" />
  <meta property="og:image" content="${url}og.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />

  <link rel="canonical" href="${url}" />
  <link rel="icon" href="${raiz}assets/brand/simbolo/favicon-32.png" sizes="32x32" />
  <link rel="icon" href="${raiz}assets/brand/simbolo/favicon-512.png" sizes="512x512" />
  <link rel="apple-touch-icon" href="${raiz}assets/brand/simbolo/apple-touch-icon.png" />

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
  <link rel="preload" href="${raiz}assets/brand/fontes/acumin-wide-900.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="${raiz}assets/brand/fontes/acumin-wide-275.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="stylesheet" href="${raiz}assets/brand/css/tipografia.css" />
  <link rel="stylesheet" href="${raiz}assets/brand/css/tokens.css" />
  <link rel="stylesheet" href="${qf}quem-faz.css" />

  <script type="application/ld+json">
${p.jsonLd}
  </script>
</head>
<body>
  <script>document.documentElement.classList.add('js');</script>
${sprite()}

${p.corpo}

  <footer>
    <div class="wrap">
      <img src="${raiz}assets/brand/marca/collaco-11223-escuro-480.webp"
           alt="Pepê Collaço 11223" width="480" height="439" />
      <p>
        Pepê Collaço · Deputado Estadual de Santa Catarina · Progressistas ·
        Federação União Progressista.<br />
        Valores destinados pelo mandato entre 2023 e 2026, conforme o controle de
        emendas do gabinete. Situação dos projetos de lei conforme o e-Legis da
        Alesc em ${escapar(data(p.coletadoEm))}.${p.notaRodape ? `<br />\n        ${p.notaRodape}` : ''}
        <a href="${SITE}/">pepecollaco.com</a>
      </p>
    </div>
  </footer>

<script src="${qf}quem-faz.js" defer></script>
<script>
  const texto = ${JSON.stringify(p.compartilhar)};
  const url = ${JSON.stringify(url)};

  for (const id of ['compartilhar', 'compartilhar-2']) {
    const b = document.getElementById(id);
    if (!b) continue;
    b.href = 'https://wa.me/?text=' + encodeURIComponent(texto + ' ' + url);
    b.target = '_blank';
    b.addEventListener('click', (e) => {
      if (!navigator.share) return;
      e.preventDefault();
      navigator.share({ title: ${JSON.stringify(p.seo.titulo)}, text: texto, url }).catch(() => {});
    });
  }
</script>${p.scripts ? `\n${p.scripts}` : ''}
</body>
</html>
`;
}

module.exports = { SITE, prefixos, documento, jsonLdPessoa };
