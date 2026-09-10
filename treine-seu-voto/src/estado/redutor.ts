import type { Acao, Estado } from "./tipos";
import { INICIAL } from "./tipos";

/**
 * A regra que este arquivo existe para garantir: `digitados` é SEMPRE um
 * prefixo correto do número. Um dígito errado não entra no estado, só aparece
 * na tela por 600 ms. Por isso é impossível chegar ao fim com o número errado,
 * por mais que se tente, e é por isso que a máquina é uma função pura e não
 * seis useState espalhados por seis componentes.
 */
export function criarRedutor(numero: string) {
  return function redutor(estado: Estado, acao: Acao): Estado {
    switch (acao.tipo) {
      case "DIGITO": {
        if (estado.fase !== "treino") return estado;
        if (estado.digitados.length >= numero.length) return estado;

        const esperado = numero[estado.digitados.length];
        if (acao.digito === esperado) {
          const digitados = estado.digitados + acao.digito;
          const completo = digitados.length === numero.length;
          return {
            ...estado,
            digitados,
            erroDigito: null,
            mensagem: completo
              ? { texto: "Número completo. Agora é só apertar CONFIRMA.", tom: "acerto" }
              : null,
          };
        }

        return {
          ...estado,
          // digitados intacto: o dígito errado é descartado.
          erroDigito: acao.digito,
          erroId: estado.erroId + 1,
          revelaId: estado.revelaId + 1,
          numeroAberto: true,
          consultou: true,
          errou: true,
          mensagem: { texto: `Quase! O próximo é o ${esperado ?? ""}.`, tom: "erro" },
        };
      }

      case "FIM_ERRO":
        return estado.erroDigito === null ? estado : { ...estado, erroDigito: null };

      case "FIM_REALCE":
        // Só apaga o REALCE grande. O número continua aberto pelo resto da
        // rodada: quem errou não deve ter de errar de novo para reler.
        return estado.revelaId === 0 ? estado : { ...estado, revelaId: 0 };

      case "CORRIGE":
        if (estado.fase !== "treino") return estado;
        return {
          ...estado,
          digitados: "",
          erroDigito: null,
          // numeroAberto NÃO muda. CORRIGE não pode virar atalho para burlar o
          // teste de memória da rodada 2: quem quiser ver o número tem o botão
          // "não lembro", e esse marca a consulta.
          mensagem: { texto: "Apagado. Pode digitar de novo.", tom: "info" },
        };

      case "BRANCO":
        if (estado.fase !== "treino") return estado;
        // Não grava nada, não conta nada, não muda contador nenhum.
        return {
          ...estado,
          digitados: "",
          erroDigito: null,
          mensagem: { texto: acao.texto, tom: "info" },
        };

      case "CONFIRMA": {
        if (estado.fase !== "treino") return estado;
        if (estado.digitados.length !== numero.length) {
          return {
            ...estado,
            mensagem: {
              texto: `Digite os ${numero.length} números primeiro.`,
              tom: "info",
            },
          };
        }
        return { ...estado, fase: "confirmando", mensagem: null };
      }

      case "FIM_CONFIRMACAO": {
        if (estado.fase !== "confirmando") return estado;
        return {
          ...estado,
          fase: "fim",
          sequencia: estado.errou ? 0 : estado.sequencia + 1,
          sequenciaCega: estado.errou || estado.consultou ? 0 : estado.sequenciaCega + 1,
        };
      }

      case "MOSTRAR_NUMERO":
        if (estado.fase !== "treino") return estado;
        return {
          ...estado,
          numeroAberto: true,
          consultou: true,
          revelaId: estado.revelaId + 1,
          mensagem: { texto: `O número é ${numero}.`, tom: "info" },
        };

      case "TREINAR_DE_NOVO":
        if (estado.fase !== "fim") return estado;
        return {
          ...INICIAL,
          rodada: estado.rodada + 1,
          sequencia: estado.sequencia,
          sequenciaCega: estado.sequenciaCega,
          // Da rodada 2 em diante a tela nasce escondida: aqui é que o treino
          // vira teste de memória.
          numeroAberto: false,
          consultou: false,
        };

      default:
        return estado;
    }
  };
}
