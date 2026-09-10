import { movimentoReduzido } from "./haptico";

/**
 * Confete da tela FIM.
 *
 * Duas funções distintas: `celebrar` é a comemoração de ter acertado, três
 * rajadas em dois segundos e meio; `batida` é a rajada que sai a cada meio
 * segundo enquanto a música toca, e é ela que faz a tela continuar viva
 * enquanto a faixa rola. Ela alterna os cantos e sorteia posição, ângulo e
 * quantidade dentro de faixas estreitas: rajada sempre igual, no mesmo lugar,
 * vira padrão e o olho para de ver em dez segundos.
 *
 * A cada quatro batidas vem uma rajada de baixo, no meio, mais alta. É o que
 * dá o compasso de festa em vez de metralhadora nas laterais.
 *
 * O canvas é próprio e não o do body: assim ele morre junto com a tela e não
 * fica um <canvas> órfão em cima da interface. `useWorker: false` é de
 * propósito, o worker depende de transferir OffscreenCanvas e tem histórico de
 * falhar calado no Safari, que é metade de quem vai abrir isto.
 */
const CORES = ["#FFC400", "#FAAA40", "#00B171", "#FFFFFF", "#8BC1DC"];

export interface Confete {
  celebrar: () => void;
  batida: () => void;
  destruir: () => void;
}

export async function criarConfete(tela: HTMLCanvasElement): Promise<Confete | null> {
  if (movimentoReduzido()) return null;

  const { default: confetti } = await import("canvas-confetti");
  const disparar = confetti.create(tela, { resize: true, useWorker: false });
  const relogios: number[] = [];
  let lado = 0;

  const rajada = (
    quantidade: number,
    x: number,
    angulo: number,
    velocidade: number,
    escala: number,
  ) => {
    void disparar({
      particleCount: quantidade,
      spread: 62,
      startVelocity: velocidade,
      angle: angulo,
      origin: { x, y: 0.78 },
      colors: CORES,
      scalar: escala,
      ticks: 140,
      disableForReducedMotion: true,
    });
  };

  return {
    celebrar() {
      rajada(40, 0.5, 90, 42, 0.9);
      relogios.push(window.setTimeout(() => rajada(40, 0.16, 62, 42, 0.9), 320));
      relogios.push(window.setTimeout(() => rajada(40, 0.84, 118, 42, 0.9), 680));
    },
    batida() {
      lado += 1;
      const sorte = (a: number, b: number) => a + Math.random() * (b - a);

      if (lado % 4 === 0) {
        rajada(26, sorte(0.42, 0.58), 90, sorte(46, 56), 0.8);
        return;
      }

      const daEsquerda = lado % 2 === 0;
      rajada(
        Math.round(sorte(14, 20)),
        daEsquerda ? sorte(0.04, 0.16) : sorte(0.84, 0.96),
        daEsquerda ? sorte(50, 68) : sorte(112, 130),
        sorte(34, 46),
        0.72,
      );
    },
    destruir() {
      relogios.forEach((id) => window.clearTimeout(id));
      disparar.reset();
    },
  };
}
