/**
 * Regras que iCalendar (RFC 5545) e vCard (RFC 6350) têm em comum, e que são
 * onde esses arquivos costumam quebrar em silêncio.
 */

/**
 * Escape de valor TEXT: contrabarra, ponto e vírgula, vírgula e quebra de
 * linha. Dois-pontos NÃO se escapa, ao contrário do que parece.
 */
export function escapar(valor: string): string {
  return valor
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const codificador = new TextEncoder();

function bytes(texto: string): number {
  return codificador.encode(texto).length;
}

/**
 * Dobra a linha em 75 octetos, com a continuação começando por um espaço.
 *
 * A conta é em BYTES, não em caracteres: "PEPÊ COLLAÇO" tem 12 caracteres e 14
 * bytes, e o corte por caractere estoura o limite em texto com acento, que é
 * todo texto em português. O corte também respeita a fronteira do code point,
 * senão sai meio caractere e o importador recusa o arquivo inteiro.
 */
export function dobrar(linha: string): string {
  if (bytes(linha) <= 75) return linha;

  const pedacos: string[] = [];
  let atual = "";
  let limite = 75;

  for (const caractere of linha) {
    if (bytes(atual) + bytes(caractere) > limite) {
      pedacos.push(atual);
      atual = caractere;
      limite = 74; // o espaço da continuação também conta nos 75
    } else {
      atual += caractere;
    }
  }
  pedacos.push(atual);

  return pedacos.map((p, i) => (i === 0 ? p : ` ${p}`)).join("\r\n");
}

/**
 * Junta as linhas com CRLF, inclusive no fim. Um \n cru faz o Outlook e o
 * Google Calendar recusarem o arquivo, e o erro que eles mostram não diz isso.
 */
export function montar(linhas: string[]): string {
  return linhas.map(dobrar).join("\r\n") + "\r\n";
}
