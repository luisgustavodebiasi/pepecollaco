/**
 * A ÚNICA fonte de dados do candidato. Nenhum componente escreve número, nome,
 * partido, cor ou data à mão: tudo desce daqui por props.
 *
 * Trocar de candidato é editar este arquivo e trocar dois arquivos em
 * public/ (a foto e, se for o caso, o lockup da marca). Nada mais.
 */
export interface CandidatoConfig {
  /** Número de urna. O comprimento manda no número de caixas na tela. */
  number: string;
  /** Nome civil, como consta no registro. */
  name: string;
  /** Nome de urna, como aparece na tela da urna de verdade. */
  ballotName: string;
  party: string;
  office: string;
  /** Caminho a partir da raiz do site. Retrato, de preferência 3:4. */
  image: string;
  /**
   * Assinatura da campanha. Aqui ela é o texto alternativo do lockup em
   * public/marca/quem-faz-representa.webp, que aparece na tela FIM, e não uma
   * linha de texto: a identidade proíbe reconstruir lockup com CSS, e
   * "QUEM FAZ REPRESENTA" é lockup de três degraus com a última palavra em
   * pincel.
   */
  slogan: string;
  /** Cor de destaque. Vira --marca no :root; ver main.tsx. */
  brandColor: string;
  /** AAAA-MM-DD. Lido como data LOCAL, nunca por new Date(string). */
  electionDate: string;
  siteUrl: string;
  /**
   * Telefone do gabinete, em E.164. Entra SOMENTE no cartão de contato
   * (`lib/contato.ts`): é o que transforma o .vcf num contato de verdade, com
   * quem dá para falar, em vez de um cartão só com o número de urna. Não
   * aparece na interface e não vira link em lugar nenhum.
   */
  phone: string;
  /** Aceita {number} {ballotName} {name} {party} {office} {siteUrl}. */
  shareText: string;
  /**
   * Identificação legal da propaganda. Sai vazio de fábrica, e o rodapé só
   * renderiza a linha quando ela tem conteúdo.
   *
   * Valor pronto para colar quando a assessoria jurídica liberar, o mesmo já
   * usado nos anúncios da campanha na Meta:
   *
   *   "Propaganda Eleitoral · ELEICAO 2026 FELIPPE LUIZ COLLACO DEPUTADO
   *    ESTADUAL CNPJ 68.472.001/0001-72"
   */
  legalNotice: string;
}

export const config: CandidatoConfig = {
  number: "11223",
  name: "Felippe Luiz Collaço",
  ballotName: "PEPÊ COLLAÇO",
  party: "PP",
  office: "DEPUTADO ESTADUAL",
  image: "/assets/candidate.webp",
  slogan: "QUEM FAZ REPRESENTA",
  brandColor: "#FFC400",
  electionDate: "2026-10-04",
  siteUrl: "https://vote.pepecollaco.com",
  phone: "+5548999412599",
  shareText: "Treinei meu voto: {ballotName}, {number}. Treine o seu:",
  legalNotice: "",
};

/**
 * Textos da interface que citam dados do candidato. Ficam aqui, e não dentro
 * dos componentes, para que trocar o número não deixe uma frase mentindo no
 * meio da tela. Todos passam por preencher() em lib/texto.ts.
 */
export const textos = {
  subtitulo: "Digite {number} e confirme. É assim no dia da eleição.",
  /* Da segunda rodada em diante o número sai da tela, e o subtítulo não pode
     entregá-lo de volta: seria o teste de memória fazendo cola consigo mesmo. */
  subtituloMemoria: "Agora de memória. Digite o número e confirme.",
  branco:
    "Aqui o treino é do voto {number}. O voto em branco existe na urna de " +
    "verdade e é uma escolha sua; aqui ele não registra nada.",
  lembrete: "Votar {number} · {ballotName}",
} as const;
