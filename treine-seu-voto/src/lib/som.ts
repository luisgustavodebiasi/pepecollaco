import type { Trecho } from "../config/musica";
import { TRECHOS } from "../config/musica";

/**
 * Som do treino: o clique da tecla, o bipe de confirmação e a música.
 *
 * Duas tecnologias, e a divisão não é capricho:
 *
 *   Clique e confirmação vão por **Web Audio**. São curtíssimos e precisam
 *   disparar sem atraso e sobrepostos: quem digita rápido aperta a segunda
 *   tecla antes de o clique da primeira acabar, e com <audio> o segundo toque
 *   corta o primeiro ou chega tarde. Decodificados uma vez, custam nada.
 *
 *   A música vai por **<audio>**. São faixas de 90 a 110 segundos; decodificar
 *   uma delas em memória passaria de 30 MB, e o <audio> ainda dá busca por
 *   tempo, que é justamente o que a rotação de trechos precisa.
 *
 * Nenhum navegador toca som antes de a pessoa tocar na tela. `prepararSom` roda
 * dentro do primeiro toque e é ele que compra a autorização para a sessão
 * inteira, inclusive para a música, que depois toca sem gesto novo.
 */

const CLIQUE = "/assets/clique.mp3";
const SUCESSO = "/assets/sucesso.mp3";

const VOLUME_MUSICA = 0.5;
const FADE_MS = 1500;

let ctx: AudioContext | null = null;
const amostras = new Map<string, AudioBuffer>();

let musica: HTMLAudioElement | null = null;
let fade: number | null = null;
let quadro: number | null = null;
let mudo = false;
let tocandoAgora: Trecho | null = null;
let preparado = false;

type Ouvinte = () => void;
const ouvintes = new Set<Ouvinte>();

/** (pulso 0..1, se este quadro caiu numa batida) */
type OuvintePulso = (pulso: number, batida: boolean) => void;
const ouvintesPulso = new Set<OuvintePulso>();

function avisar() {
  ouvintes.forEach((f) => f());
}

/**
 * O pulso da música, para o banner bater junto e o confete sair na batida.
 *
 * Assinar não redesenha o React: quem assina escreve direto no DOM, com ref.
 * Sessenta setState por segundo derrubariam a página em celular fraco, que é
 * justamente o aparelho de quem vai abrir isto na rua.
 */
export function assinarPulso(f: OuvintePulso): () => void {
  ouvintesPulso.add(f);
  return () => ouvintesPulso.delete(f);
}

/** Para a interface saber quando mostrar o botão de silenciar. */
export function ouvirMusica(f: Ouvinte): () => void {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

export function estadoDaMusica(): { tocando: boolean; mudo: boolean; titulo: string | null } {
  return { tocando: tocandoAgora !== null, mudo, titulo: tocandoAgora?.titulo ?? null };
}

async function carregar(url: string) {
  if (!ctx || amostras.has(url)) return;
  try {
    const dados = await fetch(url).then((r) => r.arrayBuffer());
    amostras.set(url, await ctx.decodeAudioData(dados));
  } catch {
    // Sem o efeito, o retorno visual da tecla continua de pé.
  }
}

export function prepararSom(): void {
  if (preparado) return;
  preparado = true;

  try {
    const Fabrica = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Fabrica) {
      ctx = new Fabrica();
      void ctx.resume();
      void carregar(CLIQUE);
      void carregar(SUCESSO);
    }
  } catch {
    ctx = null;
  }

  // O contexto pode ser suspenso quando a aba vai para segundo plano. Como a
  // música passa POR DENTRO dele quando o analisador está ligado, um contexto
  // suspenso não deixa a música baixa: deixa muda. Voltar da aba tem de
  // religar, e nenhum gesto novo é exigido para isso.
  try {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && ctx?.state === "suspended") void ctx.resume();
    });
  } catch {
    // sem document, nada a fazer
  }

  try {
    const el = new Audio();
    el.preload = "auto";
    el.volume = 0;
    // Destrava o elemento dentro do gesto: depois disto ele pode ser tocado
    // sem gesto novo, que é o que a confirmação precisa.
    el.src = TRECHOS[0]!.arquivo;
    // Quando a faixa acaba sozinha, o pulso para e o banner some. Sem isto o
    // laço de animação continuaria girando à toa e o banner ficaria anunciando
    // uma música que não está mais tocando.
    el.addEventListener("ended", () => {
      pararPulso();
      tocandoAgora = null;
      avisar();
    });
    void el.play().then(() => el.pause()).catch(() => {});
    musica = el;
  } catch {
    musica = null;
  }
}

function disparar(url: string, ganho: number) {
  if (!ctx) return;
  const amostra = amostras.get(url);
  if (!amostra) return;
  try {
    if (ctx.state === "suspended") void ctx.resume();
    const fonte = ctx.createBufferSource();
    fonte.buffer = amostra;
    const volume = ctx.createGain();
    volume.gain.value = ganho;
    fonte.connect(volume).connect(ctx.destination);
    fonte.start();
  } catch {
    // idem
  }
}

export function tocarClique(): void {
  disparar(CLIQUE, 0.55);
}

export function tocarSucesso(): void {
  disparar(SUCESSO, 0.7);
}

const PERIODO_FESTA = 500;

let inicioFesta = 0;
let ultimaBatida = -1;

/**
 * O compasso da festa: uma batida a cada 500 ms, relógio fixo.
 *
 * Já foi um analisador de espectro, que seguia a música de verdade. Saiu por
 * dois motivos. O primeiro é que ele obrigava a música a passar POR DENTRO do
 * Web Audio, e um contexto suspenso ali não deixa a música baixa: deixa muda.
 * Era o único risco aberto da peça no iPhone. O segundo é que meio segundo é
 * mais festa do que a batida real: as faixas têm 131, 92 e 88 BPM, e num
 * pagode de 88 o confete sairia a cada 0,68 s, devagar demais para o efeito
 * que se quer.
 *
 * Se um dia valer trocar pelo compasso de cada faixa, os andamentos saem de
 * `ferramentas/achar-batida.py`.
 */
function passoDoPulso() {
  quadro = requestAnimationFrame(passoDoPulso);
  const el = musica;
  if (!el || el.paused) return;

  const decorrido = performance.now() - inicioFesta;
  const indice = Math.floor(decorrido / PERIODO_FESTA);
  const fase = (decorrido % PERIODO_FESTA) / PERIODO_FESTA;
  // Sobe de uma vez na batida e decai até o meio do compasso.
  const pulso = Math.max(0, 1 - fase * 1.7);

  const batida = indice !== ultimaBatida;
  if (batida) ultimaBatida = indice;

  ouvintesPulso.forEach((f) => f(pulso, batida));
}

function comecarPulso() {
  if (quadro === null) {
    inicioFesta = performance.now();
    ultimaBatida = -1;
    quadro = requestAnimationFrame(passoDoPulso);
  }
}

function pararPulso() {
  if (quadro !== null) {
    cancelAnimationFrame(quadro);
    quadro = null;
  }
  ouvintesPulso.forEach((f) => f(0, false));
}

function rampa(el: HTMLAudioElement, de: number, para: number, ms: number) {
  if (fade !== null) cancelAnimationFrame(fade);
  const inicio = performance.now();
  const passo = (agora: number) => {
    const t = Math.min(1, (agora - inicio) / ms);
    el.volume = de + (para - de) * t;
    if (t < 1) fade = requestAnimationFrame(passo);
    else fade = null;
  };
  fade = requestAnimationFrame(passo);
}

/**
 * Entra logo depois do bipe de confirmação, subindo do zero. A sobreposição é
 * de propósito: cortar o bipe para começar a música soaria a corte de rádio.
 */
export function tocarMusica(trecho: Trecho): void {
  if (mudo || !musica) return;
  const el = musica;
  if (ctx?.state === "suspended") void ctx.resume();

  const comecar = () => {
    try {
      el.currentTime = Math.min(trecho.inicio, Math.max(0, (el.duration || trecho.inicio + 1) - 1));
    } catch {
      // Safari recusa currentTime antes de ter duração; o loadedmetadata resolve.
    }
    el.volume = 0;
    void el
      .play()
      .then(() => {
        tocandoAgora = trecho;
        avisar();
        rampa(el, 0, VOLUME_MUSICA, FADE_MS);
        comecarPulso();
      })
      .catch(() => {});
  };

  const mesmoArquivo = el.src.endsWith(trecho.arquivo);
  if (!mesmoArquivo) {
    el.src = trecho.arquivo;
    el.addEventListener("loadedmetadata", comecar, { once: true });
    el.load();
  } else if (el.readyState >= 1) {
    comecar();
  } else {
    el.addEventListener("loadedmetadata", comecar, { once: true });
  }
}

export function pararMusica(): void {
  if (!musica) return;
  if (fade !== null) {
    cancelAnimationFrame(fade);
    fade = null;
  }
  musica.pause();
  pararPulso();
  tocandoAgora = null;
  avisar();
}

/** Silenciar é decisão da sessão: nenhuma rodada seguinte volta a tocar. */
export function silenciar(): void {
  mudo = true;
  pararMusica();
}

export function reativarSom(): void {
  mudo = false;
  avisar();
}
