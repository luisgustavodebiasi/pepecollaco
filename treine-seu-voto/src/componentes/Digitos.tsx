import s from "./Urna.module.css";

interface Props {
  total: number;
  digitados: string;
  erroDigito: string | null;
}

/**
 * As caixas do número.
 *
 * O dígito errado APARECE por 600 ms, em vermelho e tremendo, e só então some.
 * Não entra no estado, então continua sendo impossível terminar com o número
 * errado; mas quem errou precisa ver o que apertou, senão a correção não
 * ensina nada, só frustra.
 */
export function Digitos({ total, digitados, erroDigito }: Props) {
  const caixas = Array.from({ length: total }, (_, i) => i);

  return (
    <>
      <div className={s.digitos} role="group" aria-label="Número digitado">
        {caixas.map((i) => {
          const aceito = i < digitados.length;
          const errado = !aceito && i === digitados.length && erroDigito !== null;
          const conteudo = aceito ? digitados[i] : errado ? erroDigito : "";
          return (
            <span
              key={i}
              className={s.caixa}
              data-estado={aceito ? "aceito" : errado ? "errado" : "vazio"}
              aria-hidden="true"
            >
              {conteudo}
            </span>
          );
        })}
      </div>
      {/* As caixas são decorativas para o leitor de tela; o progresso vem aqui,
          numa frase que não muda de forma a cada dígito. */}
      <span className="sr-only" role="status" aria-live="polite">
        {digitados.length} de {total} dígitos digitados
      </span>
    </>
  );
}
