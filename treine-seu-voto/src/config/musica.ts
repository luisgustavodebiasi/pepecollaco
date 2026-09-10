/**
 * A trilha que entra depois da confirmação.
 *
 * A regra que manda aqui é: **nunca duas rodadas seguidas com o mesmo trecho**.
 * Quem treina três, quatro vezes ouvindo o mesmo pedaço de música desiste na
 * terceira. Por isso a lista é uma rotação, e o índice anda com a rodada.
 *
 * Os quatro pontos do jingle foram escolhidos de ouvido pelo gabinete. Os do
 * pagode e do sertanejo saíram de `ferramentas/achar-refrao.py`, que procura a
 * janela de 12 s com maior energia da faixa, que na prática é o refrão. Para
 * mudar qualquer um, mexa só neste arquivo.
 */
export interface Trecho {
  arquivo: string;
  /** Segundo em que a música entra. */
  inicio: number;
  /** Aparece no banner enquanto toca. */
  titulo: string;
}

const JINGLE = { arquivo: "/musica/jingle-pepe.mp3", titulo: "Jingle Pepê" };

export const TRECHOS: readonly Trecho[] = [
  { ...JINGLE, inicio: 38.04 },
  { ...JINGLE, inicio: 45.0 },
  { ...JINGLE, inicio: 53.17 },
  { ...JINGLE, inicio: 56.03 },
  { arquivo: "/musica/pagode.mp3", inicio: 63, titulo: "Esse É Nosso, pagode" },
  {
    arquivo: "/musica/sertanejo.mp3",
    inicio: 72,
    titulo: "Quem Faz Representa, sertanejo",
  },
];

export function trechoDaRodada(rodada: number): Trecho {
  const i = (rodada - 1) % TRECHOS.length;
  return TRECHOS[i] ?? TRECHOS[0]!;
}
