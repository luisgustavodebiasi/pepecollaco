/* ═══════════════════════════════════════════════════════════════════════
   Galeria de um evento: grade, visor e a ponte para a busca por rosto.

   Carrega só dados.json (poucos KB). O reconhecimento — 18 MB entre modelo
   e runtime — só entra em cena se a pessoa pedir, por import dinâmico de
   busca.js. Quem só quer olhar as fotos não paga por isso.
   ═══════════════════════════════════════════════════════════════════════ */

const BASE = location.pathname.replace(/[^/]*$/, '');   // /foto/<slug>/

/* Acima disto a página escreve "Você"; abaixo, "Talvez". O número e o porquê
   estão documentados junto da comparação, em busca.js — aqui ele só rotula. */
const LIMIAR_CERTO = 0.42;

const el = {
  grade: document.querySelector('[data-grade]'),
  contagem: document.querySelector('[data-contagem]'),
  limpar: document.querySelector('[data-limpar]'),
  abrirBusca: document.querySelector('[data-busca-abrir]'),
};

const dados = await (await fetch(`${BASE}dados.json`)).json();
const FOTOS = dados.fotos;

/* O que a grade está mostrando agora, na ordem em que aparece: índices de
   FOTOS. O visor navega por esta lista, e não pelas 260 — depois de buscar,
   a seta "próxima" tem de ir para a próxima foto SUA. */
let listaAtual = FOTOS.map((_, i) => i);

/* Resultado da última busca, indexado por foto, ou null quando a grade
   mostra tudo. Guarda também qual rosto casou, para o visor emoldurá-lo. */
let resultado = null;

/* ── Grade ──────────────────────────────────────────────────────────── */

/* As miniaturas entram por IntersectionObserver em vez de loading="lazy"
   puro para poder animar a entrada e para não disparar 260 requisições
   quando alguém arrasta a barra de rolagem até o fim de uma vez. */
const observador = new IntersectionObserver((entradas, obs) => {
  for (const e of entradas) {
    if (!e.isIntersecting) continue;
    const img = e.target;
    img.src = img.dataset.src;
    img.addEventListener('load', () => img.classList.add('pronta'), { once: true });
    obs.unobserve(img);
  }
}, { rootMargin: '600px 0px' });

function cartao(indice, semelhanca) {
  const foto = FOTOS[indice];
  const b = document.createElement('button');
  b.className = 'cartao';
  b.type = 'button';
  b.dataset.indice = indice;
  b.style.aspectRatio = `${foto.l} / ${foto.a}`;
  b.setAttribute('aria-label', `Abrir foto ${indice + 1} de ${FOTOS.length}`);

  if (semelhanca != null) {
    const selo = document.createElement('span');
    const certo = semelhanca >= LIMIAR_CERTO;
    selo.className = certo ? 'selo' : 'selo talvez';
    selo.textContent = certo ? 'Você' : 'Talvez';
    b.append(selo);
  }

  const img = document.createElement('img');
  img.alt = '';
  img.width = foto.l;
  img.height = foto.a;
  img.dataset.src = `${BASE}p/${foto.id}.webp`;
  b.append(img);
  observador.observe(img);
  return b;
}

function desenhar(lista) {
  el.grade.replaceChildren();
  if (!lista.length) {
    el.grade.innerHTML =
      '<p class="vazio"><strong>Não achamos você nestas fotos.</strong>' +
      'Tente outra foto sua, de frente e com boa luz — ou role a grade, ' +
      'o reconhecimento não é perfeito.</p>';
    return;
  }
  const lote = document.createDocumentFragment();
  for (const item of lista) {
    lote.append(typeof item === 'number' ? cartao(item) : cartao(item.foto, item.s));
  }
  el.grade.append(lote);
}

function mostrarTudo() {
  resultado = null;
  listaAtual = FOTOS.map((_, i) => i);
  el.contagem.innerHTML = `${FOTOS.length} fotos`;
  el.limpar.hidden = true;
  desenhar(listaAtual);
}

/** Recebe [{foto, s}] já ordenado por semelhança. */
function mostrarResultado(achados) {
  resultado = new Map(achados.map((a) => [a.foto, a]));
  listaAtual = achados.map((a) => a.foto);
  const certos = achados.filter((a) => a.s >= LIMIAR_CERTO).length;
  el.contagem.innerHTML = achados.length
    ? `<strong>${achados.length}</strong> ${achados.length === 1 ? 'foto sua' : 'fotos suas'}` +
      (certos < achados.length ? ` · ${certos} com certeza, ${achados.length - certos} talvez` : '')
    : 'Nenhuma foto encontrada';
  el.limpar.hidden = false;
  desenhar(achados);
  document.getElementById('grade').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

el.limpar.addEventListener('click', mostrarTudo);
el.grade.addEventListener('click', (e) => {
  const cartao = e.target.closest('.cartao');
  if (cartao) abrirVisor(Number(cartao.dataset.indice));
});

mostrarTudo();

/* ── Visor ──────────────────────────────────────────────────────────── */

const visor = document.createElement('div');
visor.className = 'visor';
visor.hidden = true;
visor.innerHTML = `
  <div class="visor-topo">
    <p class="visor-indice" data-contador></p>
    <button class="icone" type="button" data-fechar aria-label="Fechar">
      <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
  </div>
  <div class="visor-palco" data-palco>
    <button class="icone seta esq" type="button" data-anterior aria-label="Foto anterior">
      <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>
    </button>
    <img data-foto alt="" />
    <button class="icone seta dir" type="button" data-proxima aria-label="Próxima foto">
      <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
    </button>
  </div>
  <div class="visor-pe">
    <a class="botao-principal" data-baixar download>
      <svg viewBox="0 0 24 24"><path d="M12 4v11m0 0l-4.2-4.2M12 15l4.2-4.2M4.5 19.5h15"/></svg>
      Baixar
    </a>
    <button class="botao-vazado" type="button" data-compartilhar hidden>
      <svg viewBox="0 0 24 24"><path d="M15.5 8.5V5l6 6-6 6v-3.6c-4.3 0-7.3 1.3-9.5 4.1 .9-4.4 3.5-8.5 9.5-9z"/></svg>
      Compartilhar
    </button>
  </div>`;
document.body.append(visor);

const v = {
  img: visor.querySelector('[data-foto]'),
  palco: visor.querySelector('[data-palco]'),
  contador: visor.querySelector('[data-contador]'),
  baixar: visor.querySelector('[data-baixar]'),
  compartilhar: visor.querySelector('[data-compartilhar]'),
};
let atual = 0;        // índice dentro de listaAtual, não dentro de FOTOS
let devolverFoco = null;

function abrirVisor(indiceFoto) {
  devolverFoco = document.activeElement;
  visor.hidden = false;
  document.body.style.overflow = 'hidden';
  irPara(listaAtual.indexOf(indiceFoto));
  visor.querySelector('[data-fechar]').focus();
}

function fecharVisor() {
  visor.hidden = true;
  document.body.style.overflow = '';
  v.img.removeAttribute('src');
  devolverFoco?.focus();
}

function irPara(posicao) {
  atual = (posicao + listaAtual.length) % listaAtual.length;
  const iFoto = listaAtual[atual];
  const foto = FOTOS[iFoto];
  v.img.src = `${BASE}g/${foto.id}.webp`;
  v.img.alt = `Foto ${iFoto + 1} do evento`;
  v.contador.textContent = resultado
    ? `${atual + 1} de ${listaAtual.length} suas`
    : `${atual + 1} de ${FOTOS.length}`;
  v.baixar.href = `${BASE}g/${foto.id}.webp`;
  v.baixar.download = `${dados.evento.slug}-${foto.id}.webp`;
  v.palco.querySelector('.marcador')?.remove();
  const achado = resultado?.get(iFoto);
  if (achado) v.img.addEventListener('load', () => marcarRosto(achado.rosto), { once: true });
}

/** Desenha a moldura em volta do rosto que casou, para quem está numa foto
    de 40 pessoas não precisar caçar a si mesmo. Recebe o índice do rosto
    que a busca apontou — nunca o primeiro rosto da foto. */
function marcarRosto(indiceRosto) {
  const rostos = dados.rostos;
  if (indiceRosto == null) return;
  // A imagem está em object-fit: contain; a moldura precisa da caixa pintada.
  const cx = v.img.getBoundingClientRect();
  const pai = v.palco.getBoundingClientRect();
  const i = indiceRosto * 4;
  const marca = document.createElement('div');
  marca.className = 'marcador';
  marca.style.left = `${cx.left - pai.left + (rostos.caixa[i] / 1000) * cx.width}px`;
  marca.style.top = `${cx.top - pai.top + (rostos.caixa[i + 1] / 1000) * cx.height}px`;
  marca.style.width = `${(rostos.caixa[i + 2] / 1000) * cx.width}px`;
  marca.style.height = `${(rostos.caixa[i + 3] / 1000) * cx.height}px`;
  v.palco.append(marca);
}

visor.querySelector('[data-fechar]').addEventListener('click', fecharVisor);
visor.querySelector('[data-anterior]').addEventListener('click', () => irPara(atual - 1));
visor.querySelector('[data-proxima]').addEventListener('click', () => irPara(atual + 1));
visor.addEventListener('click', (e) => { if (e.target === visor) fecharVisor(); });

document.addEventListener('keydown', (e) => {
  if (visor.hidden) return;
  if (e.key === 'Escape') fecharVisor();
  if (e.key === 'ArrowLeft') irPara(atual - 1);
  if (e.key === 'ArrowRight') irPara(atual + 1);
});

/* Arrastar para trocar de foto: no celular as setas estão escondidas, e
   arrastar é o gesto que a pessoa já espera de uma galeria. */
let toqueX = null;
v.palco.addEventListener('touchstart', (e) => { toqueX = e.changedTouches[0].clientX; }, { passive: true });
v.palco.addEventListener('touchend', (e) => {
  if (toqueX === null) return;
  const d = e.changedTouches[0].clientX - toqueX;
  if (Math.abs(d) > 45) irPara(atual + (d < 0 ? 1 : -1));
  toqueX = null;
}, { passive: true });

/* Compartilhar direto para WhatsApp e Instagram, que é o que a pessoa quer
   fazer com a foto. Só aparece onde o navegador sabe mandar arquivo. */
if (navigator.canShare?.({ files: [new File([''], 'x.webp', { type: 'image/webp' })] })) {
  v.compartilhar.hidden = false;
  v.compartilhar.addEventListener('click', async () => {
    const foto = FOTOS[atual];
    try {
      const blob = await (await fetch(`${BASE}g/${foto.id}.webp`)).blob();
      await navigator.share({
        files: [new File([blob], `${dados.evento.slug}-${foto.id}.webp`, { type: 'image/webp' })],
        text: `${dados.evento.titulo} · Pepê Collaço 11223`,
      });
    } catch { /* a pessoa cancelou; não há o que tratar */ }
  });
}

/* ── Ponte para a busca ─────────────────────────────────────────────── */

el.abrirBusca.addEventListener('click', async () => {
  el.abrirBusca.disabled = true;
  try {
    const { abrirBusca } = await import(`/foto/app/busca.js`);
    await abrirBusca({ BASE, dados, mostrarResultado });
  } finally {
    el.abrirBusca.disabled = false;
  }
});
