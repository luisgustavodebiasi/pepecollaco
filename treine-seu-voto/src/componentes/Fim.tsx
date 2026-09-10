import { useEffect, useRef } from "react";
import type { CandidatoConfig } from "../config/candidate";
import type { EstadoMusica } from "../estado/useTreino";
import { BannerMusica } from "./BannerMusica";
import type { Confete } from "../lib/confete";
import { criarConfete } from "../lib/confete";
import { assinarPulso } from "../lib/som";
import { porExtenso } from "../lib/datas";
import { Compartilhar } from "./Compartilhar";
import s from "./Fim.module.css";

/**
 * O que a tela do aparelho mostra depois do CONFIRMA. A urna de verdade
 * escreve FIM, e é isso que a pessoa reconhece; embaixo vem o que a peça
 * existe para deixar na cabeça dela, e é o maior elemento da tela.
 */
export function TelaFim({ candidato }: { candidato: CandidatoConfig }) {
  const titulo = useRef<HTMLHeadingElement>(null);

  // Sem isto o foco fica num botão que acabou de sumir e o leitor de tela
  // volta para o body sem dizer que a tela mudou.
  useEffect(() => {
    titulo.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className={s.telaFim}>
      <h1 className={s.fim} ref={titulo} tabIndex={-1}>
        Fim
      </h1>
      <p className={s.nomeUrna}>{candidato.ballotName}</p>
      <p className={s.numero}>{candidato.number}</p>
      <p className={s.frase}>
        Agora você já sabe o número. No dia {porExtenso(candidato.electionDate)}, é só
        digitar.
      </p>

      {/* A assinatura é imagem, e a versão colorida: "QUEM FAZ REPRESENTA" é
          lockup de três degraus com a última palavra em pincel, e a identidade
          proíbe reconstruir lockup com CSS. A versão de fundo escuro sumiria
          nesta tela branca. */}
      <img
        className={s.assinatura}
        src="/marca/quem-faz-representa.webp"
        alt={candidato.slogan}
        width={480}
        height={299}
      />
    </div>
  );
}

interface BlocoProps {
  candidato: CandidatoConfig;
  sequencia: number;
  sequenciaCega: number;
  musica: EstadoMusica;
  aoTreinarDeNovo: () => void;
  aoSilenciar: () => void;
}

/**
 * O bloco da campanha, no lugar que era do teclado. A partir do FIM não há
 * mais o que digitar, e manter um teclado morto embaixo da tela seria pior do
 * que trocá-lo pelo que a pessoa faz agora: treinar de novo ou espalhar.
 */
export function BlocoFim({
  candidato,
  sequencia,
  sequenciaCega,
  musica,
  aoTreinarDeNovo,
  aoSilenciar,
}: BlocoProps) {
  const tela = useRef<HTMLCanvasElement>(null);
  const confete = useRef<Confete | null>(null);

  useEffect(() => {
    const canvas = tela.current;
    if (!canvas) return;
    let vivo = true;

    void criarConfete(canvas).then((c) => {
      if (!vivo) {
        c?.destruir();
        return;
      }
      confete.current = c;
      c?.celebrar();
    });

    // O confete continua saindo enquanto a música toca, uma rajada a cada meio
    // segundo. É o que faz a tela FIM não morrer depois dos três segundos da
    // comemoração, que é justamente quando a pessoa está lendo o número.
    const soltar = assinarPulso((_pulso, batida) => {
      if (batida) confete.current?.batida();
    });

    return () => {
      vivo = false;
      soltar();
      confete.current?.destruir();
      confete.current = null;
    };
  }, []);

  return (
    <div className={s.bloco}>
      <canvas ref={tela} className={s.confete} aria-hidden="true" />

      {sequenciaCega >= 3 ? (
        <p className={s.conquista}>Número decorado! 🎉</p>
      ) : sequencia > 1 ? (
        <p className={s.sequencia}>Você acertou {sequencia}x seguidas</p>
      ) : null}

      {/* Só aparece depois de a música entrar. Antes disso não haveria o que
          mostrar nem o que silenciar, e um controle que não faz nada é pior do
          que nenhum. */}
      {(musica.tocando || musica.mudo) && (
        <BannerMusica musica={musica} aoSilenciar={aoSilenciar} />
      )}

      <div className={s.acoes}>
        <button type="button" className={s.principal} onClick={aoTreinarDeNovo}>
          Treinar de novo
        </button>
      </div>

      <Compartilhar candidato={candidato} />
    </div>
  );
}
