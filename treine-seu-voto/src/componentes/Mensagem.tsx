import type { Mensagem as TipoMensagem } from "../estado/tipos";
import s from "./Urna.module.css";

/**
 * Uma região viva só, e "polite".
 *
 * Duas regiões, ou "assertive" no erro, interromperiam o leitor de tela no
 * meio da palavra a cada tecla errada. E o elemento existe SEMPRE no DOM,
 * mesmo vazio: região criada depois do primeiro render não é anunciada pelo
 * VoiceOver, e a altura mínima evita que o layout pule quando o texto entra.
 */
export function Mensagem({ mensagem }: { mensagem: TipoMensagem | null }) {
  return (
    <p
      className={s.mensagem}
      data-tom={mensagem?.tom}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {mensagem?.texto ?? ""}
    </p>
  );
}
