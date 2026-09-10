import { celulasDe } from "../lib/braille";
import s from "./Braille.module.css";

const PONTOS = [1, 2, 3, 4, 5, 6];

/**
 * Os pontos moldados da tecla. Decoração: quem usa leitor de tela é atendido
 * pelo aria-label do botão, e um punhado de <i> vazios só atrapalharia ali.
 */
export function Braille({ texto }: { texto: string }) {
  return (
    <span className={s.braille} aria-hidden="true">
      {celulasDe(texto).map((celula, i) => (
        <span className={s.celula} key={i}>
          {PONTOS.map((p) => (
            <i key={p} className={celula.includes(p) ? s.aceso : undefined} />
          ))}
        </span>
      ))}
    </span>
  );
}
