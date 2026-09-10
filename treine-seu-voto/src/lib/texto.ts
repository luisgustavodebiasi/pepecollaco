import type { CandidatoConfig } from "../config/candidate";

/**
 * Troca {chave} pelo valor correspondente da configuração. É o único lugar do
 * app que faz interpolação: um template que cita uma chave inexistente sai
 * como veio, visível, em vez de virar "undefined" no meio de uma frase.
 */
export function preencher(molde: string, candidato: CandidatoConfig): string {
  return molde.replace(/\{(\w+)\}/g, (inteiro, chave: string) => {
    const valor = (candidato as unknown as Record<string, unknown>)[chave];
    return typeof valor === "string" ? valor : inteiro;
  });
}

/**
 * "DEPUTADO ESTADUAL" vira "Deputado estadual".
 *
 * A caixa alta é da interface, que imita a tela da urna. Dentro de um arquivo
 * de calendário ou de um cartão de contato ela vira grito no meio da agenda
 * de quem salvou, e é a única linha em caixa alta da lista inteira.
 */
export function sentenca(texto: string): string {
  const baixo = texto.toLocaleLowerCase("pt-BR");
  return baixo.charAt(0).toLocaleUpperCase("pt-BR") + baixo.slice(1);
}
