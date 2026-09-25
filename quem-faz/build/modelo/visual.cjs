/**
 * Peças visuais das páginas QUEM FAZ: foto, vitrine de posts, série de vídeos,
 * portas com foto e mosaico.
 *
 * Nada aqui carrega script de terceiro. Post do Instagram vira card com a capa
 * baixada pelo build (redes/capas/) e link para o post: o embed oficial pesa
 * meio megabyte por post, rastreia quem abre e quebra quando o post sai do ar.
 */

const fs = require('fs');
const path = require('path');
const { escapar, milhar, data, resumirLegenda } = require('../lib/formato.cjs');
const { icone } = require('../lib/icones.cjs');

const RAIZ_QF = path.join(__dirname, '..', '..');

/* ───────────────────────────── medidas ─────────────────────────────
   width/height no <img> evitam o salto de layout. A medida sai do próprio
   arquivo WebP, lida do cabeçalho, sem depender de ferramenta externa. */

function medirWebp(arquivo) {
  const b = fs.readFileSync(arquivo);
  const tipo = b.toString('ascii', 12, 16);
  if (tipo === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (tipo === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (tipo === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  throw new Error(`WebP em formato inesperado: ${arquivo}`);
}

/** Mapa id → { alt, ilustrativa, w, h } das fotos de dados/fotos.json. */
function carregarFotos() {
  const { fotos } = JSON.parse(fs.readFileSync(path.join(RAIZ_QF, 'dados', 'fotos.json'), 'utf8'));
  const mapa = new Map();
  for (const f of fotos) {
    const arq = path.join(RAIZ_QF, 'img', `${f.id}.webp`);
    if (!fs.existsSync(arq)) throw new Error(`falta img/${f.id}.webp: rode build/preparar-fotos.cjs`);
    mapa.set(f.id, { ...f, ...medirWebp(arq) });
  }
  return mapa;
}

/** <img> de uma foto do manifesto. `qf` é o prefixo até a pasta quem-faz/. */
function foto(id, ctx, qf, { classe = '', carregar = 'lazy', alt = null } = {}) {
  const f = ctx.fotos.get(id);
  if (!f) throw new Error(`foto "${id}" não existe em dados/fotos.json`);
  return `<img${classe ? ` class="${classe}"` : ''} src="${qf}img/${f.id}.webp" alt="${escapar(alt ?? f.alt)}" width="${f.w}" height="${f.h}" loading="${carregar}" decoding="async" />`;
}

/** Selo "imagem ilustrativa" para foto de banco. Vazio para foto do mandato. */
function seloIlustrativa(id, ctx) {
  return ctx.fotos.get(id)?.ilustrativa ? '<span class="ilustrativa">Imagem ilustrativa</span>' : '';
}

/* ─────────────────────────────── posts ───────────────────────────── */

const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}]/gu;

/**
 * Título do card: a primeira linha da legenda, sem emoji e sem hashtag. É a
 * manchete que o próprio post usa, então o card lê igual ao feed.
 */
function tituloDoPost(legenda, limite = 96) {
  const linhas = String(legenda || '')
    .split('\n')
    .map((l) => l.replace(EMOJI, '').replace(/#\S+/g, '').replace(/\s+/g, ' ').trim())
    .filter((l) => l.replace(/[\p{P}\p{S}\s]/gu, '').length > 2);
  return resumirLegenda(linhas[0] || '', limite);
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const mesAno = (iso) => `${MESES_LONGOS[Number(iso.slice(5, 7)) - 1]} de ${iso.slice(0, 4)}`;

/**
 * A data do post em destaque, sobre a capa: dia grande, mês e ano embaixo.
 * É o que mostra que o assunto não nasceu na campanha.
 */
function quando(iso) {
  return `<span class="ig-quando"><b>${iso.slice(8, 10)}</b><span>${MESES[Number(iso.slice(5, 7)) - 1]}</span><span>${iso.slice(0, 4)}</span></span>`;
}

const TIPOS = {
  reel: { rotulo: 'Reel', icone: 'play' },
  video: { rotulo: 'Vídeo', icone: 'play' },
  carrossel: { rotulo: 'Carrossel', icone: 'images' },
  foto: { rotulo: 'Foto', icone: 'camera' },
};

/**
 * Escolhe posts de dados/instagram.json.
 *   shortcodes  lista fixa, na ordem dada
 *   busca       regex (texto) aplicada à legenda
 *   excluir     shortcodes que nunca entram (curadoria)
 *   limite      quantos, no máximo
 */
function escolherPosts(ctx, { shortcodes, busca, excluir = [], limite = 8 } = {}) {
  const todos = ctx.instagram.posts;
  const fora = new Set([...excluir, ...(ctx.ocultar || [])]);
  let lista;
  if (shortcodes) {
    const porCodigo = new Map(todos.map((p) => [p.shortcode, p]));
    lista = shortcodes.map((sc) => {
      const p = porCodigo.get(sc);
      if (!p) throw new Error(`post ${sc} não está em dados/instagram.json: rode coletar-instagram.cjs --incluir=${sc}`);
      return p;
    });
  } else {
    const re = busca ? new RegExp(busca, 'i') : null;
    lista = todos
      .filter((p) => !fora.has(p.shortcode))
      .filter((p) => !re || re.test(p.legenda))
      .sort((a, b) => (a.data < b.data ? 1 : -1));
  }
  return lista.slice(0, limite);
}

function cardPost(p, qf, { assunto = null } = {}) {
  const t = TIPOS[p.tipo] || TIPOS.foto;
  const ehVideo = p.tipo === 'reel' || p.tipo === 'video';
  return `        <li><a class="ig" href="${escapar(p.link)}" target="_blank" rel="noopener">
          <span class="ig-capa">
            <img src="${qf}${p.capa}" alt="" width="${p.capaW}" height="${p.capaH}" loading="lazy" decoding="async" />
            <span class="ig-tipo">${icone(t.icone)}${t.rotulo}</span>
            ${quando(p.data)}${ehVideo ? `\n            <span class="ig-play">${icone('play')}</span>` : ''}
          </span>
          <span class="ig-corpo">${assunto ? `\n            <span class="ig-assunto">Sobre ${escapar(assunto)}</span>` : ''}
            <span class="ig-topo">${icone('instagram')}<span>@pepecollaco</span><span class="ig-data">${escapar(data(p.data))}</span></span>
            <span class="ig-titulo">${escapar(tituloDoPost(p.legenda))}</span>
            <span class="ig-numeros"><span>${icone('heart')}${milhar(p.curtidas)}</span><span>${icone('message-circle')}${milhar(p.comentarios)}</span><span class="ig-ver" title="Ver no Instagram">${icone('arrow-up-right')}</span></span>
          </span>
        </a></li>`;
}

function cabeca({ olho, titulo, texto }) {
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

/**
 * Vitrine de posts: grade no computador, carrossel de polegar no celular.
 * bloco = { olho, titulo, texto?, shortcodes? | busca?, limite?, id?, classe? }
 */
function vitrine(bloco, ctx, qf) {
  let posts = escolherPosts(ctx, bloco);
  if (!posts.length) throw new Error(`vitrine "${bloco.titulo}" ficou sem post`);

  // Linha do tempo: do post mais antigo ao mais novo, com a frase que diz desde
  // quando o deputado fala do assunto. A frase é montada das datas reais.
  if (bloco.linhaDoTempo) {
    posts = [...posts].sort((a, b) => (a.data < b.data ? -1 : 1));
    const primeiro = posts[0].data;
    const ultimo = posts[posts.length - 1].data;
    const quantos = posts.length === 1 ? 'um post' : `${posts.length} posts`;
    bloco = {
      ...bloco,
      titulo: bloco.titulo || `Falamos disso desde ${primeiro.slice(0, 4)}`,
      texto: bloco.texto || `${quantos} do @pepecollaco sobre ${escapar(bloco.assunto)}, ` +
        (primeiro.slice(0, 7) === ultimo.slice(0, 7)
          ? `em ${mesAno(primeiro)}.`
          : `do primeiro, em <b>${mesAno(primeiro)}</b>, ao mais recente, em <b>${mesAno(ultimo)}</b>.`) +
        ' Não é assunto de campanha: é trabalho de mandato.',
    };
  }

  const cards = posts.map((p) => cardPost(p, qf, { assunto: bloco.linhaDoTempo ? bloco.assunto : null })).join('\n');
  const rodape = `\n\n      <p class="vitrine-rodape rv"><a class="btn btn-vazado" href="https://www.instagram.com/pepecollaco/" target="_blank" rel="noopener">${icone('instagram')}Seguir @pepecollaco</a></p>`;
  return secao(`${cabeca(bloco)}\n\n      <ul class="vitrine${bloco.linhaDoTempo ? ' linha-tempo' : ''}"${bloco.linhaDoTempo ? ` style="--n:${posts.length}"` : ''}>\n${cards}\n      </ul>${bloco.semRodape ? '' : rodape}`, {
    id: bloco.id || 'redes',
    classe: bloco.classe ?? 'faixa-clara',
  });
}

/**
 * A série "Quem faz por…": os reels por cidade, em pôster vertical inteiro.
 * A capa de cada um já é a arte da série, então o card não põe texto por cima.
 * bloco.itens = [{ shortcode, rotulo, pagina? }]
 */
function serie(bloco, ctx, qf) {
  const porCodigo = new Map(ctx.instagram.posts.map((p) => [p.shortcode, p]));
  const itens = bloco.itens
    .map((it) => {
      const p = porCodigo.get(it.shortcode);
      if (!p) throw new Error(`série: post ${it.shortcode} não está em instagram.json`);
      const pagina = it.pagina
        ? `\n          <a class="serie-pagina" href="${it.pagina}">Ver a página ${icone('arrow-right')}</a>`
        : '';
      return `        <li>
          <a class="serie-video" href="${escapar(p.link)}" target="_blank" rel="noopener" aria-label="Assistir Quem faz por ${escapar(it.rotulo)} no Instagram">
            <img src="${qf}${p.capa}" alt="" width="${p.capaW}" height="${p.capaH}" loading="lazy" decoding="async" />
            <span class="ig-play">${icone('play')}</span>
          </a>
          <span class="serie-rotulo">${escapar(it.rotulo)}</span>${pagina}
        </li>`;
    })
    .join('\n');

  return secao(
    `${cabeca(bloco)}\n\n      <ul class="serie">\n${itens}\n      </ul>\n      <p class="serie-dica rv">${icone('arrow-right')}Arraste para o lado. Cada vídeo abre no Instagram.</p>`,
    { id: bloco.id || 'serie', classe: bloco.classe ?? 'fundo-campanha veu' }
  );
}

/**
 * Portas com foto: o índice das páginas. A primeira fileira tem dois cards
 * grandes (as páginas mais procuradas), o resto vem em três colunas.
 * itens = [{ href, rot?, alvo, foto, dado?, texto, grande?, toda? }]
 * `toda` estica o card pela linha inteira: é para o último, quando a conta
 * de três por linha deixaria um sozinho.
 */
function portasFoto(bloco, ctx, qf) {
  const cards = bloco.itens
    .map((it) => `        <a class="pf${it.grande ? ' pf-grande' : ''}${it.toda ? ' pf-toda' : ''}" href="${it.href}">
          ${foto(it.foto, ctx, qf, { classe: 'pf-foto', alt: '' })}
          <span class="pf-seta">${icone('arrow-up-right')}</span>
          <span class="pf-corpo">
            <span class="pf-rot">${escapar(it.rot || 'Quem faz')}</span>
            <span class="pf-alvo">${escapar(it.alvo)}</span>${it.dado ? `\n            <span class="pf-dado">${it.dado}</span>` : ''}
            <span class="pf-texto">${it.texto}</span>
          </span>
        </a>`)
    .join('\n');

  return secao(`${cabeca(bloco)}\n\n      <nav class="portas-foto" aria-label="Páginas por assunto">\n${cards}\n      </nav>`, {
    id: bloco.id || 'assuntos',
    classe: bloco.classe ?? 'faixa-clara',
  });
}

/** Mosaico de fotos do mandato. itens = [{ foto, forma? ('alta' | 'larga') }] */
function mosaico(bloco, ctx, qf) {
  const itens = bloco.itens
    .map((it) => `        <figure class="mo${it.forma ? ` mo-${it.forma}` : ''}">${foto(it.foto, ctx, qf)}</figure>`)
    .join('\n');
  const botao = bloco.botao
    ? `\n\n      <div class="botoes rv">
        <a class="btn btn-acento" href="${bloco.botao.href}">${icone('search')}${escapar(bloco.botao.texto)}</a>
      </div>`
    : '';
  return secao(`${cabeca(bloco)}\n\n      <div class="mosaico">\n${itens}\n      </div>${botao}`, {
    id: bloco.id || 'estrada',
    classe: bloco.classe ?? '',
  });
}

module.exports = {
  quando, mesAno,
  medirWebp, carregarFotos, foto, seloIlustrativa,
  tituloDoPost, escolherPosts, cardPost,
  cabeca, secao, vitrine, serie, portasFoto, mosaico,
};
