import type { CSSProperties } from "react";
import { Braille } from "./Braille";
import s from "./Teclado.module.css";

export type VarianteTecla = "numero" | "branco" | "corrige" | "confirma";

interface Props {
  rotulo: string;
  ariaLabel: string;
  variante: VarianteTecla;
  aoAcionar: () => void;
  /** Desabilitada por aria, nunca pelo atributo: ver o comentário no Teclado. */
  inativa?: boolean;
  descritaPor?: string;
  acesa?: boolean;
  /** Para o zero, que precisa cair numa coluna específica da grade. */
  classe?: string;
}

/**
 * A tecla segue o molde do aparelho de referência: nas numéricas o dígito fica
 * encostado à esquerda com a célula braile ao lado; nas de ação o rótulo fica
 * no alto, à esquerda, com a palavra inteira em braile embaixo.
 */
export function Tecla({
  rotulo,
  ariaLabel,
  variante,
  aoAcionar,
  inativa = false,
  descritaPor,
  acesa = false,
  classe,
}: Props) {
  const numerica = variante === "numero";

  return (
    <button
      type="button"
      className={classe ? `${s.tecla} ${classe}` : s.tecla}
      /* O rótulo das teclas de ação é dimensionado para encher a largura, e
         quem sabe a largura que ele precisa é o número de letras: BRANCO cabe
         em corpo maior que CONFIRMA. Ver o clamp em Teclado.module.css. */
      style={numerica ? undefined : ({ "--letras": rotulo.length } as CSSProperties)}
      data-variante={variante}
      data-inativa={inativa || undefined}
      data-acesa={acesa || undefined}
      aria-label={ariaLabel}
      aria-disabled={inativa || undefined}
      aria-describedby={descritaPor}
      onClick={aoAcionar}
    >
      <span className={numerica ? s.digito : s.rotulo}>{rotulo}</span>
      <Braille texto={rotulo} />
    </button>
  );
}
