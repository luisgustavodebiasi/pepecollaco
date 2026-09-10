/**
 * Vibração curta no toque.
 *
 * Existe com a ressalva de que METADE do público não vai sentir: o Safari do
 * iPhone não implementa navigator.vibrate, e não há como contornar pela web.
 * O retorno visual da tecla é o que garante que ninguém fica sem resposta.
 */
export function vibrar(padrao: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(padrao);
    }
  } catch {
    // Alguns navegadores lançam quando a página não está visível. Silêncio.
  }
}

export function movimentoReduzido(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
