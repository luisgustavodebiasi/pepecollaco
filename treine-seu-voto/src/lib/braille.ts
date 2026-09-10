/**
 * Braile das teclas.
 *
 * As teclas da urna de referência são moldadas com braile: nas numéricas, uma
 * célula ao lado do dígito; nas de ação, a palavra inteira embaixo do rótulo.
 * Aqui os pontos são desenhados em CSS, e existem pelo mesmo motivo do relevo
 * "TREINO 2026" no corpo: são acabamento, o que faz a peça ser reconhecida
 * como aquele aparelho. Vão marcados como decorativos, porque quem usa leitor
 * de tela é atendido pelo aria-label da tecla, não por pontinhos.
 *
 * Uma célula braile tem seis pontos, numerados assim:
 *
 *     1 4
 *     2 5
 *     3 6
 *
 * Os dígitos usam a célula da letra correspondente (1 = a, 2 = b … 0 = j), sem
 * o sinal de número, que é como as teclas do aparelho são moldadas: no teclado
 * não há ambiguidade que justifique a célula extra.
 */
const ALFABETO: Record<string, number[]> = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5],
  f: [1, 2, 4], g: [1, 2, 4, 5], h: [1, 2, 5], i: [2, 4], j: [2, 4, 5],
  k: [1, 3], l: [1, 2, 3], m: [1, 3, 4], n: [1, 3, 4, 5], o: [1, 3, 5],
  p: [1, 2, 3, 4], q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5], s: [2, 3, 4], t: [2, 3, 4, 5],
  u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6], x: [1, 3, 4, 6],
  y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6],
};

const DIGITOS = "jabcdefghi"; // 0 = j, 1 = a, 2 = b …

/** Uma célula por caractere. Caractere sem equivalente vira célula vazia. */
export function celulasDe(texto: string): number[][] {
  return [...texto.toLocaleLowerCase("pt-BR")]
    .map((c) => {
      if (c >= "0" && c <= "9") return ALFABETO[DIGITOS[Number(c)] ?? "a"] ?? [];
      return ALFABETO[c] ?? [];
    });
}
