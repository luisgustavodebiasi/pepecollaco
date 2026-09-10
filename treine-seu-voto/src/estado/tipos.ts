export type Fase = "treino" | "confirmando" | "fim";

export type Tom = "info" | "acerto" | "erro";

export interface Mensagem {
  texto: string;
  tom: Tom;
}

export interface Estado {
  fase: Fase;
  /** 1-based. A rodada 1 é a que mostra o número; da 2 em diante é de memória. */
  rodada: number;
  /** Sempre um prefixo CORRETO do número. Dígito errado nunca entra aqui. */
  digitados: string;
  /**
   * Contadores monotônicos, e não booleanos, porque é o que faz o timer
   * reagendar no segundo erro seguido. Com booleano, `erro` já seria true, a
   * dependência do efeito não mudaria, o setTimeout não seria refeito e o
   * dígito vermelho ficaria preso na tela.
   */
  erroId: number;
  revelaId: number;
  /** O dígito errado que a pessoa apertou. Aparece em vermelho e some em 600 ms. */
  erroDigito: string | null;
  /** O número de referência está na tela agora. */
  numeroAberto: boolean;
  /** Nesta rodada o número já ficou à vista em algum momento. */
  consultou: boolean;
  /** Nesta rodada houve pelo menos um dígito errado. */
  errou: boolean;
  mensagem: Mensagem | null;
  /** Rodadas seguidas sem errar nenhum dígito. */
  sequencia: number;
  /** Rodadas seguidas sem errar E sem ver o número. É o gatilho do "decorado". */
  sequenciaCega: number;
}

export type Acao =
  | { tipo: "DIGITO"; digito: string }
  | { tipo: "FIM_ERRO" }
  | { tipo: "FIM_REALCE" }
  | { tipo: "CORRIGE" }
  | { tipo: "BRANCO"; texto: string }
  | { tipo: "CONFIRMA" }
  | { tipo: "FIM_CONFIRMACAO" }
  | { tipo: "MOSTRAR_NUMERO" }
  | { tipo: "TREINAR_DE_NOVO" };

export const INICIAL: Estado = {
  fase: "treino",
  rodada: 1,
  digitados: "",
  erroId: 0,
  revelaId: 0,
  erroDigito: null,
  // A rodada 1 mostra o número por definição, então ela já nasce "consultada".
  // A consequência é honesta e está no README: a sequência cega só pode
  // começar a contar da rodada 2.
  numeroAberto: true,
  consultou: true,
  errou: false,
  mensagem: null,
  sequencia: 0,
  sequenciaCega: 0,
};
