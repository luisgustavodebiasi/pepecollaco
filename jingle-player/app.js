/* ==========================================================================
   Player de jingles · Pepê Collaço 11223
   Feito para carreata: tem que tocar com a tela apagada, sobreviver à perda de
   sinal e ser operável por alguém dentro de um carro em movimento.
   ========================================================================== */
(() => {
"use strict";

const CACHE_MIDIA = "jingle-midia-v1";

/* As faixas. O bpm não é enfeite: é o que sincroniza a animação, em vez de
   analisar o áudio. Analisar exigiria Web Audio, e pendurar o <audio> num
   AudioContext é justamente o que arrisca a reprodução parar com a tela
   bloqueada. Como o andamento de cada faixa é conhecido e fixo, o tempo do
   próprio <audio> descreve o compasso sem tocar no caminho do som. */
/* A ordem daqui é a ordem que toca. Os números nos nomes de arquivo seguem a
   ordem do EP na entrega à distribuidora (sertanejo, pagode, funk) e por isso
   não acompanham esta lista: renomear desalinharia da ENTREGA-DISTRIBUIDORA e
   ainda obrigaria todo mundo a rebaixar os 7,8 MB de áudio. */
const FAIXAS = [
  { arquivo:"audio/03-ele-foi-la-e-fez.mp3",    titulo:"Ele Foi Lá e Fez",
    estilo:"funk",           bpm:128, dur:90.92,  capa:"img/capa-03.webp", capa512:"img/capa-03-512.jpg" },
  { arquivo:"audio/01-quem-faz-representa.mp3", titulo:"Quem Faz Representa",
    estilo:"sertanejo raiz", bpm:88,  dur:109.88, capa:"img/capa-01.webp", capa512:"img/capa-01-512.jpg" },
  { arquivo:"audio/02-esse-e-nosso.mp3",        titulo:"Esse É Nosso",
    estilo:"pagode",         bpm:92,  dur:109.20, capa:"img/capa-02.webp", capa512:"img/capa-02-512.jpg" },
];

const $ = (s) => document.querySelector(s);
const audio      = $("#audio");
const capaEl     = $("#capa");
const tituloEl   = $("#titulo");
const subEl      = $("#subtitulo");
const buscaEl    = $("#busca");
const decorridoEl= $("#decorrido");
const restanteEl = $("#restante");
const listaEl    = $("#lista");
const barrasEl   = $("#barras");
const volumeEl   = $("#volume");
const volumeVal  = $("#volumeValor");
const linhaVolume= $("#linhaVolume");
const btTocar    = $("#btTocar");
const btTela     = $("#btTela");
const txTela     = $("#txTela");
const btEstado   = $("#btEstado");
const txEstado   = $("#txEstado");
const preparando = $("#preparando");

/* Preferências. Se der ruim (aba privada, storage bloqueado), o player toca
   igual, só não lembra de nada. */
const pref = {
  ler(chave, padrao){ try { const v = localStorage.getItem("jingle:"+chave);
    return v === null ? padrao : JSON.parse(v); } catch { return padrao; } },
  gravar(chave, valor){ try { localStorage.setItem("jingle:"+chave, JSON.stringify(valor)); } catch {} },
};

let indice     = Math.min(pref.ler("faixa", 0), FAIXAS.length - 1);
let modo       = ["playlist","uma","aleatorio"].includes(pref.ler("modo","playlist"))
                 ? pref.ler("modo","playlist") : "playlist";
let volumeAlvo = Math.min(1, Math.max(0, pref.ler("volume", 1)));
let deveTocar  = false;      // intenção do usuário, não estado do elemento
let sorteio    = [];         // ordem embaralhada do modo aleatório

/* No iOS o volume do <audio> é somente leitura: quem manda são os botões
   físicos. Detectamos em vez de checar user-agent, e escondemos o controle
   onde ele não teria efeito nenhum. */
const suportaVolume = (() => {
  const a = document.createElement("audio");
  try { a.volume = 0.42; return Math.abs(a.volume - 0.42) < 0.01; } catch { return false; }
})();

/* ---------------------------------------------------------------- tempo --- */
const mmss = (s) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m + ":" + String(r).padStart(2, "0");
};

/* ------------------------------------------------------------- reprodução --- */

function carregar(i, tocarDepois) {
  indice = (i + FAIXAS.length) % FAIXAS.length;
  const f = FAIXAS[indice];
  audio.src = f.arquivo;
  audio.load();
  capaEl.src = f.capa;
  capaEl.alt = "Capa de " + f.titulo;
  tituloEl.textContent = f.titulo;
  subEl.textContent = f.estilo + " · " + f.bpm + " bpm";
  buscaEl.value = 0;
  buscaEl.style.setProperty("--prog", "0%");
  atualizarLista();
  anunciarMidia();
  pref.gravar("faixa", indice);
  if (tocarDepois) tocar();
}

function tocar() {
  deveTocar = true;
  aplicarVolume(suportaVolume ? 0 : volumeAlvo);   // entra em fade quando dá
  const p = audio.play();
  if (p && p.catch) p.catch(() => { deveTocar = false; pintarBotao(); });
  pintarBotao();
  pedirTela();
}

function pausar() {
  deveTocar = false;
  audio.pause();
  pintarBotao();
}

function alternar() { deveTocar ? pausar() : tocar(); }

function proxima(automatica) {
  if (modo === "uma" && automatica) {           // repetir uma: volta ao início
    audio.currentTime = 0;
    tocar();
    return;
  }
  if (modo === "aleatorio") { carregar(sortearProxima(), true); return; }
  carregar(indice + 1, true);
}

function anterior() {
  // Convenção de player: se já passou de 3 s, "anterior" reinicia a faixa.
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  if (modo === "aleatorio") { carregar(sortearProxima(), true); return; }
  carregar(indice - 1, true);
}

/* Embaralha o índice sem repetir a faixa atual em seguida, e sem repetir a
   ordem enquanto o ciclo não fecha. */
function sortearProxima() {
  if (sorteio.length === 0) {
    sorteio = FAIXAS.map((_, i) => i).filter((i) => i !== indice);
    for (let i = sorteio.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sorteio[i], sorteio[j]] = [sorteio[j], sorteio[i]];
    }
  }
  return sorteio.pop();
}

function pintarBotao() {
  document.body.classList.toggle("tocando", deveTocar && !audio.paused);
  btTocar.setAttribute("aria-label", deveTocar ? "Pausar" : "Tocar");
  if ("mediaSession" in navigator) {
    navigator.mediaSession.playbackState = deveTocar ? "playing" : "paused";
  }
}

/* ------------------------------------------------------------------ fade --- */
/* A faixa 1 termina em corte seco, no meio do som. Em looping isso estala.
   O fade é de reprodução, no volume do elemento: o MP3 continua fiel ao WAV. */
const FADE_SAI = 0.22;   // s antes do fim
const FADE_ENTRA = 0.10; // s depois do início

function aplicarVolume(v) {
  if (!suportaVolume) return;
  audio.volume = Math.min(1, Math.max(0, v));
}

function volumeDoMomento() {
  if (!suportaVolume) return volumeAlvo;
  const t = audio.currentTime, d = audio.duration || FAIXAS[indice].dur;
  if (t < FADE_ENTRA) return volumeAlvo * (t / FADE_ENTRA);
  const faltando = d - t;
  if (faltando < FADE_SAI && faltando >= 0) return volumeAlvo * (faltando / FADE_SAI);
  return volumeAlvo;
}

/* --------------------------------------------------------------- eventos --- */

audio.addEventListener("ended", () => proxima(true));

/* Resiliência: um arquivo que falha não pode matar a carreata. Pula. */
audio.addEventListener("error", () => {
  if (!deveTocar) return;
  setTimeout(() => proxima(true), 400);
});

audio.addEventListener("play",  pintarBotao);
audio.addEventListener("pause", pintarBotao);

audio.addEventListener("loadedmetadata", () => {
  if (isFinite(audio.duration)) {
    FAIXAS[indice].dur = audio.duration;
    atualizarLista();
  }
});

/* Cão de guarda: se a intenção é tocar mas o elemento parou sozinho (ligação
   telefônica, o sistema roubando o foco de áudio), retoma. Só age quando o
   usuário não mandou pausar. */
setInterval(() => {
  if (deveTocar && audio.paused && audio.readyState >= 2) {
    audio.play().catch(() => {});
  }
}, 2000);

btTocar.addEventListener("click", alternar);
$("#btProxima").addEventListener("click", () => proxima(false));
$("#btAnterior").addEventListener("click", anterior);

let arrastando = false;
buscaEl.addEventListener("input", () => { arrastando = true; });
buscaEl.addEventListener("change", () => {
  const d = audio.duration || FAIXAS[indice].dur;
  audio.currentTime = (buscaEl.value / 1000) * d;
  arrastando = false;
});

volumeEl.addEventListener("input", () => {
  volumeAlvo = volumeEl.value / 100;
  volumeVal.textContent = volumeEl.value;
  volumeEl.style.setProperty("--prog", volumeEl.value + "%");
  /* Parado, aplica o alvo direto: volumeDoMomento() devolveria 0 se a faixa
     estivesse na posição zero, e o controle pareceria não funcionar. */
  aplicarVolume(deveTocar && !audio.paused ? volumeDoMomento() : volumeAlvo);
  pref.gravar("volume", volumeAlvo);
});

document.querySelectorAll(".modo").forEach((b) => {
  b.addEventListener("click", () => {
    modo = b.dataset.modo;
    sorteio = [];
    document.querySelectorAll(".modo").forEach((o) =>
      o.setAttribute("aria-checked", String(o === b)));
    /* "Repetir uma" também no elemento: se a aba dormir e o rAF parar, o
       navegador ainda emenda o loop sozinho. */
    audio.loop = (modo === "uma");
    pref.gravar("modo", modo);
  });
});

/* Teclado, para quando roda num notebook ligado à caixa de som do evento. */
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input,button")) return;
  if (e.code === "Space")      { e.preventDefault(); alternar(); }
  if (e.code === "ArrowRight") proxima(false);
  if (e.code === "ArrowLeft")  anterior();
});

/* ------------------------------------------------------- trava de tela --- */
/* Numa carreata a tela apagar não para o som, mas apagar atrapalha quem opera.
   Wake Lock morre sozinho quando a aba perde o foco: por isso o retorno. */
let travaTela = null;
let querTela = pref.ler("tela", true);

async function pedirTela() {
  if (!querTela || !("wakeLock" in navigator)) return;
  try {
    travaTela = await navigator.wakeLock.request("screen");
    travaTela.addEventListener("release", () => { travaTela = null; });
  } catch {}
  pintarTela();
}
function soltarTela() {
  if (travaTela) { travaTela.release().catch(() => {}); travaTela = null; }
  pintarTela();
}
function pintarTela() {
  const ligado = querTela && !!travaTela;
  btTela.setAttribute("aria-pressed", String(querTela));
  txTela.textContent = !("wakeLock" in navigator)
    ? "Tela ligada: não suportado neste navegador"
    : (querTela ? (ligado ? "Tela travada ligada" : "Tela ligada ao tocar")
                : "Manter a tela ligada");
}
btTela.addEventListener("click", () => {
  querTela = !querTela;
  pref.gravar("tela", querTela);
  querTela ? pedirTela() : soltarTela();
  pintarTela();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && deveTocar) pedirTela();
});

/* ---------------------------------------------------------- MediaSession --- */
/* É o que faz o título aparecer no painel do carro por Bluetooth e o que
   entrega botões na tela de bloqueio. Sem isso, o operador precisa desbloquear
   o telefone para trocar de faixa. */
function anunciarMidia() {
  if (!("mediaSession" in navigator)) return;
  const f = FAIXAS[indice];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: f.titulo,
    artist: "Pepê Collaço 11223",
    album: "Quem Faz Representa",
    artwork: [{ src: f.capa512, sizes: "512x512", type: "image/jpeg" }],
  });
}
if ("mediaSession" in navigator) {
  const ms = navigator.mediaSession;
  ms.setActionHandler("play",  tocar);
  ms.setActionHandler("pause", pausar);
  ms.setActionHandler("nexttrack",     () => proxima(false));
  ms.setActionHandler("previoustrack", anterior);
  try { ms.setActionHandler("stop", pausar); } catch {}
}

/* ------------------------------------------------------------- animação --- */

for (let i = 0; i < 7; i++) barrasEl.appendChild(document.createElement("i"));
const barras = [...barrasEl.querySelectorAll("i")];

const cv = document.getElementById("fundo");
const ctx = cv.getContext("2d");
let larg = 0, alt = 0, dpr = 1;

function medir() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  larg = cv.clientWidth; alt = cv.clientHeight;
  cv.width = Math.round(larg * dpr); cv.height = Math.round(alt * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", medir);

/* Setas subindo. A seta da marca aponta sempre para cima e nunca gira: aqui
   ela só sobe e desvanece, que é o movimento que a identidade permite. */
const setas = Array.from({ length: 16 }, () => ({
  x: Math.random(), y: Math.random(), v: 0.010 + Math.random() * 0.020,
  t: 12 + Math.random() * 26, o: 0.05 + Math.random() * 0.09,
}));

function desenharSeta(x, y, t, o, p) {
  const e = t * (1 + p * 0.16);
  ctx.globalAlpha = o;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = Math.max(1.4, e * 0.17);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - e/2, y + e/3);
  ctx.lineTo(x,       y - e/3);
  ctx.lineTo(x + e/2, y + e/3);
  ctx.stroke();
}

let ultimo = performance.now();

function quadro(agora) {
  const dt = Math.min((agora - ultimo) / 1000, 0.05);
  ultimo = agora;

  const f = FAIXAS[indice];
  const t = audio.currentTime;
  const rodando = deveTocar && !audio.paused;

  /* O compasso vem do relógio da própria faixa. Batida = 60/bpm. */
  const periodo = 60 / f.bpm;
  const fase = rodando ? (t % periodo) / periodo : 0;
  const pulso = rodando ? Math.pow(1 - fase, 3) : 0;
  document.documentElement.style.setProperty("--pulso", pulso.toFixed(3));

  /* Barras: cada uma atrasa um pouco em relação à anterior, o que desenha uma
     onda percorrendo em vez de sete barras piscando juntas. */
  barras.forEach((b, i) => {
    const atraso = (i / barras.length) * 0.55;
    const fi = ((fase + atraso) % 1);
    const env = Math.pow(1 - fi, 2.4);
    const altura = rodando ? 0.16 + env * 0.84 : 0.16;
    b.style.transform = "scaleY(" + altura.toFixed(3) + ")";
  });

  /* Fundo */
  if (larg && alt) {
    ctx.clearRect(0, 0, larg, alt);
    const brilho = 0.05 + pulso * 0.05;
    const g = ctx.createRadialGradient(larg/2, alt*0.34, 0, larg/2, alt*0.34, Math.max(larg,alt)*0.6);
    g.addColorStop(0, "rgba(255,196,0," + brilho.toFixed(3) + ")");
    g.addColorStop(1, "rgba(255,196,0,0)");
    ctx.globalAlpha = 1; ctx.fillStyle = g;
    ctx.fillRect(0, 0, larg, alt);

    for (const s of setas) {
      if (rodando) { s.y -= s.v * dt; if (s.y < -0.08) { s.y = 1.08; s.x = Math.random(); } }
      desenharSeta(s.x * larg, s.y * alt, s.t, s.o, pulso);
    }
    ctx.globalAlpha = 1;
  }

  /* Progresso, tempo e fade */
  const d = audio.duration || f.dur;
  if (d) {
    const frac = Math.min(t / d, 1);
    if (!arrastando) {
      buscaEl.value = Math.round(frac * 1000);
      buscaEl.style.setProperty("--prog", (frac * 100).toFixed(1) + "%");
    }
    decorridoEl.textContent = mmss(t);
    restanteEl.textContent = "-" + mmss(d - t);
  }
  if (rodando) aplicarVolume(volumeDoMomento());

  requestAnimationFrame(quadro);
}

/* --------------------------------------------------------------- lista --- */
function atualizarLista() {
  listaEl.innerHTML = "";
  FAIXAS.forEach((f, i) => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.className = "faixa";
    b.type = "button";
    b.setAttribute("aria-current", String(i === indice));
    b.innerHTML =
      '<span class="faixa-n">' + (i + 1) + '</span>' +
      '<span class="faixa-txt"><span class="faixa-nome"></span>' +
      '<span class="faixa-meta"></span></span>' +
      '<span class="faixa-dur"></span>';
    b.querySelector(".faixa-nome").textContent = f.titulo;
    b.querySelector(".faixa-meta").textContent = f.estilo + " · " + f.bpm + " bpm";
    b.querySelector(".faixa-dur").textContent = mmss(f.dur);
    b.addEventListener("click", () => carregar(i, true));
    li.appendChild(b);
    listaEl.appendChild(li);
  });
}

/* ------------------------------------------------------------- offline --- */
/* O ponto do app. As faixas são baixadas uma vez e ficam no Cache Storage;
   depois disso a carreata pode rodar o dia inteiro sem sinal nenhum. */

function pintarEstado(estado, texto) {
  btEstado.dataset.estado = estado;
  txEstado.textContent = texto;
}

async function jaTemTudo() {
  if (!("caches" in window)) return false;
  const c = await caches.open(CACHE_MIDIA);
  for (const f of FAIXAS) if (!(await c.match(f.arquivo))) return false;
  return true;
}

async function baixarTudo(mostrarTela) {
  if (!("caches" in window)) { pintarEstado("falta", "sem suporte a offline"); return; }
  const c = await caches.open(CACHE_MIDIA);
  const faltando = [];
  for (const f of FAIXAS) if (!(await c.match(f.arquivo))) faltando.push(f);

  if (faltando.length === 0) { pintarEstado("pronto", "pronto sem internet"); return; }
  if (!navigator.onLine) { pintarEstado("falta", "falta baixar, sem conexão"); return; }

  if (mostrarTela) preparando.hidden = false;
  pintarEstado("baixando", "baixando…");

  let feitos = 0;
  for (const f of faltando) {
    $("#preparandoTexto").textContent =
      "Baixando " + (feitos + 1) + " de " + faltando.length + ": " + f.titulo;
    try {
      await c.add(f.arquivo);
    } catch {
      preparando.hidden = true;
      pintarEstado("falta", "falhou, toque para tentar");
      return;
    }
    feitos++;
    $("#preparandoBarra").style.width = Math.round((feitos / faltando.length) * 100) + "%";
  }
  preparando.hidden = true;
  pintarEstado("pronto", "pronto sem internet");
}

btEstado.addEventListener("click", () => baixarTudo(true));
window.addEventListener("online",  () => baixarTudo(false));
window.addEventListener("offline", async () => {
  pintarEstado(await jaTemTudo() ? "pronto" : "falta",
    await jaTemTudo() ? "pronto sem internet" : "sem conexão e falta baixar");
});

/* ----------------------------------------------------------- inicializa --- */
async function iniciar() {
  medir();
  atualizarLista();
  audio.loop = (modo === "uma");
  document.querySelectorAll(".modo").forEach((o) =>
    o.setAttribute("aria-checked", String(o.dataset.modo === modo)));

  volumeEl.value = Math.round(volumeAlvo * 100);
  volumeVal.textContent = volumeEl.value;
  volumeEl.style.setProperty("--prog", volumeEl.value + "%");
  if (!suportaVolume) linhaVolume.hidden = true;   // iOS: só botão físico
  aplicarVolume(volumeAlvo);

  carregar(indice, false);
  pintarTela();
  requestAnimationFrame(quadro);

  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("sw.js"); } catch {}
  }

  if (await jaTemTudo()) pintarEstado("pronto", "pronto sem internet");
  else baixarTudo(true);
}

iniciar();
})();
