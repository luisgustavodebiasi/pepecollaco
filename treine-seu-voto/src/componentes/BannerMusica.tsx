import { useEffect, useRef } from "react";
import type { EstadoMusica } from "../estado/useTreino";
import { assinarPulso } from "../lib/som";
import s from "./BannerMusica.module.css";

interface Props {
  musica: EstadoMusica;
  aoSilenciar: () => void;
}

/**
 * O banner do que está tocando, pulsando na batida.
 *
 * O pulso é escrito direto no DOM, numa custom property, e não em estado do
 * React: são sessenta atualizações por segundo, e sessenta renders por segundo
 * derrubariam a página no celular fraco que é justamente o aparelho de quem vai
 * abrir isto na rua.
 */
export function BannerMusica({ musica, aoSilenciar }: Props) {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!musica.tocando) return;
    return assinarPulso((pulso) => {
      caixa.current?.style.setProperty("--pulso", pulso.toFixed(3));
    });
  }, [musica.tocando]);

  return (
    <div className={s.banner} ref={caixa} data-tocando={musica.tocando || undefined}>
      <span className={s.equalizador} aria-hidden="true">
        <i />
        <i />
        <i />
      </span>

      <span className={s.faixa}>
        {musica.mudo ? "Música desligada" : (musica.titulo ?? "Tocando")}
      </span>

      <button
        type="button"
        className={s.botao}
        onClick={aoSilenciar}
        aria-pressed={musica.mudo}
        aria-label={musica.mudo ? "Ligar a música" : "Silenciar a música"}
      >
        {musica.mudo ? "Ligar" : "Silenciar"}
      </button>
    </div>
  );
}
