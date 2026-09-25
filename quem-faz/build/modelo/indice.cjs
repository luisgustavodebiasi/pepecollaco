/**
 * A página índice, /quem-faz/: a porta de entrada da série.
 *
 * Texto em dados/indice.json. Os números dos cards e do placar são calculados
 * aqui a partir das bases, para o índice nunca dizer um valor diferente da
 * página para onde aponta.
 */

const fs = require('fs');
const path = require('path');
const { escapar, cifra, cifraChip, milhar } = require('../lib/formato.cjs');
const { icone } = require('../lib/icones.cjs');
const { SITE, documento, jsonLdPessoa } = require('./base.cjs');
const visual = require('./visual.cjs');

const PROJETO = path.join(__dirname, '..', '..', '..');

/** Os números que o índice anuncia, todos tirados das bases. */
function numeros(ctx) {
  const e = ctx.emendas;
  const ruas = JSON.parse(fs.readFileSync(path.join(PROJETO, 'ruas', 'ruas.json'), 'utf8'));
  const fotos = JSON.parse(fs.readFileSync(path.join(PROJETO, 'foto', 'pepe-por-elas', 'dados.json'), 'utf8'));
  return {
    total: e.total,
    emendas: e.quantidade,
    municipios: e.municipios,
    leis: ctx.leis.totalLeis,
    porMunicipio: e.porMunicipio,
    porCoordenacao: e.porCoordenacao,
    ruas: ruas.total ?? ruas.ruas.length,
    fotos: (fotos.fotos || []).length,
  };
}

/** "R$ 18,9 mi · 45 emendas" etc. HTML curto, em amarelo no card. */
function dadoDaPorta(chave, n) {
  if (!chave) return null;
  // Cidade não mostra valor recebido (decisão de 25/09/2026): só quantas emendas.
  if (chave.startsWith('emendas:')) {
    const m = n.porMunicipio[chave.split(':')[1]];
    return `<b>${m.n} emendas</b> na cidade`;
  }
  // Região mostra o total. cifra() arredonda para baixo; abaixo de R$ 10 mi
  // vai com uma casa ("R$ 7 mi" esconderia os quebrados, "R$ 7,0" não diz nada).
  if (chave.startsWith('coordenacao:')) {
    const c = n.porCoordenacao[chave.split(':')[1]];
    const cf = cifra(c.valor, c.valor < 1e7 && c.valor % 1e6 >= 1e5 ? 1 : 0);
    return `<b>R$ ${cf.numero} mi</b> nos ${c.municipios} municípios`;
  }
  if (chave === 'municipios') return `<b>${n.municipios} municípios</b> atendidos`;
  if (chave === 'leis') return `<b>${n.leis} leis</b> aprovadas`;
  if (chave === 'ruas') return `<b>${n.ruas} ruas</b> com recurso`;
  if (chave === 'fotos') return `<b>${milhar(n.fotos)} fotos</b> do Pepê por Elas`;
  throw new Error(`índice: dado "${chave}" desconhecido`);
}

function hero(ind, n) {
  const c = cifra(n.total);
  return `  <header class="hero fundo-campanha veu">
    <div class="wrap hero-grade">
      <div>
        <span class="olho">${escapar(ind.hero.olho)}</span>
        <h1 class="h1-assinatura"><span class="leve">QUEM</span> <span class="forte">FAZ</span> <span class="pincel">representa</span></h1>

        <p class="hero-frase">${ind.hero.frase}</p>

        <div class="manchete">
          <span class="cifra">R$ ${c.numero} <small>${c.unidade}</small></span>
          <span class="legenda">destinados a ${n.municipios} municípios de Santa Catarina</span>
        </div>

        <div class="botoes">
          <a class="btn btn-acento" href="#assuntos">Escolher um assunto</a>
          <a class="btn btn-vazado" id="compartilhar" href="#" rel="noopener">Mandar para alguém</a>
        </div>
      </div>

      <div class="hero-retrato">
        <img src="../assets/brand/foto/pepe-busto-900.webp"
             alt="Pepê Collaço, deputado estadual" width="677" height="900" />
      </div>
    </div>
  </header>`;
}

function placar(n) {
  const c = cifra(n.total);
  const celulas = [
    [`R$ ${c.numero} <small>${c.curta}</small>`, 'destinados pelo mandato'],
    [`${n.emendas}`, 'emendas e convênios'],
    [`${n.municipios}`, 'municípios atendidos'],
    [`${n.leis}`, 'leis aprovadas'],
  ];
  return visual.secao(
    `      <div class="placar rv">\n${celulas
      .map(([b, s]) => `        <div>\n          <b>${b}</b>\n          <span>${s}</span>\n        </div>`)
      .join('\n')}\n      </div>`,
    { rotulo: 'O mandato em números' }
  );
}

function fecho() {
  return `  <section class="fundo-campanha veu">
    <div class="wrap fecho">
      <img class="marca-vote rv" src="../assets/brand/marca/vote-11223-escuro-960.webp"
           alt="Vote Pepê 11223, Deputado Estadual" width="960" height="879" />
      <p class="lema assinatura rv"><span class="q">Quem</span><span class="f">faz</span><span class="pincel">representa</span></p>
      <div class="botoes rv">
        <a class="btn btn-acento" id="compartilhar-2" href="#">Mandar no WhatsApp</a>
        <a class="btn btn-vazado" href="${SITE}/">Conhecer o mandato</a>
      </div>
    </div>
  </section>`;
}

function montarIndice(ctx) {
  const ind = ctx.indice;
  const n = numeros(ctx);
  const qf = './';

  const portas = ind.portas.map((p) => ({
    href: p.href || `${p.slug}/`,
    rot: p.rot,
    alvo: p.alvo,
    foto: p.foto,
    grande: p.grande,
    toda: p.toda,
    dado: p.dado ? dadoDaPorta(p.dado, n) : p.dadoTexto ? `<b>${escapar(p.dadoTexto)}</b>` : null,
    texto: escapar(p.texto),
  }));

  const naSerie = new Set(ind.serie.map((s) => s.shortcode));

  const corpo = [
    hero(ind, n),
    placar(n),
    visual.portasFoto(
      { olho: 'Por onde começar', titulo: 'Escolha um assunto', texto: 'Cada página abre no celular em segundos e cabe num link de WhatsApp. Os valores são somas das emendas destinadas pelo mandato.', itens: portas },
      ctx, qf
    ),
    visual.serie(
      {
        olho: 'A série',
        titulo: 'Quem faz por cada cidade',
        texto: 'Um vídeo por cidade, gravado onde a obra está. É a mesma conta das páginas, contada pelo próprio deputado.',
        itens: ind.serie.map((s) => ({ ...s, pagina: s.pagina ? `${qf}${s.pagina}` : null })),
      },
      ctx, qf
    ),
    visual.vitrine(
      {
        olho: 'Nas redes',
        titulo: 'O que saiu esta semana',
        texto: 'Os posts mais recentes do @pepecollaco. Toque para abrir no Instagram.',
        excluir: [...naSerie],
        limite: 8,
      },
      ctx, qf
    ),
    visual.mosaico(
      {
        olho: 'Na estrada',
        titulo: 'De perto, em cada canto',
        texto: 'Encontros, festas de comunidade, a tribuna da Alesc. As fotos do Pepê por Elas estão inteiras na galeria, com busca pelo rosto.',
        itens: ind.estrada,
        botao: { href: '../foto/', texto: 'Procurar meu rosto nas fotos' },
      },
      ctx, qf
    ),
    fecho(),
  ].join('\n\n');

  return documento({
    seo: ind.seo,
    caminho: 'quem-faz/',
    profundidade: 0,
    corpo,
    compartilhar: ind.compartilhar,
    jsonLd: jsonLdPessoa(ind.seo, `${SITE}/quem-faz/`),
    coletadoEm: ctx.leis.coletadoEm,
    notaRodape: 'Vídeos e posts: Instagram @pepecollaco. Imagens marcadas como ilustrativas: Pexels.',
  });
}

module.exports = { montarIndice, numeros };
