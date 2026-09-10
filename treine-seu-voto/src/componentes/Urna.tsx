import { useEffect, useRef } from "react";
import type { CandidatoConfig } from "../config/candidate";
import { textos } from "../config/candidate";
import type { Estado } from "../estado/tipos";
import type { Acoes, EstadoMusica } from "../estado/useTreino";
import { preencher } from "../lib/texto";
import { DadosCandidato } from "./DadosCandidato";
import { Digitos } from "./Digitos";
import { BlocoFim, TelaFim } from "./Fim";
import { Mensagem } from "./Mensagem";
import { NumeroReferencia } from "./NumeroReferencia";
import { Teclado } from "./Teclado";
import s from "./Urna.module.css";

interface Props {
  candidato: CandidatoConfig;
  estado: Estado;
  acoes: Acoes;
  completo: boolean;
  teclaAcesa: string | null;
  musica: EstadoMusica;
}

/**
 * O aparelho inteiro, e é sempre o mesmo objeto na tela: o que muda é o que a
 * tela mostra e o que ocupa a área do teclado. No fim do voto a urna de
 * verdade escreve FIM na tela; aqui ela faz o mesmo, e o teclado dá lugar ao
 * bloco da campanha, porque a partir dali não há mais o que digitar.
 */
export function Urna({ candidato, estado, acoes, completo, teclaAcesa, musica }: Props) {
  const tela = useRef<HTMLDivElement>(null);
  const fim = estado.fase === "fim";

  // Em tela curta o bloco do candidato pode não caber inteiro. Em vez de
  // encolher até ficar ilegível, a tela rola até ele: é a recompensa de ter
  // acertado, e não pode ficar pela metade.
  useEffect(() => {
    if (!completo || fim) return;
    const el = tela.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    const id = window.setTimeout(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, 280);
    return () => window.clearTimeout(id);
  }, [completo, fim]);

  return (
    <section
      className={s.urna}
      data-confirmando={estado.fase === "confirmando" || undefined}
    >
      <div className={s.moldura}>
        <div className={s.tela} ref={tela}>
          {fim ? (
            <TelaFim candidato={candidato} />
          ) : (
            <>
              <p className={s.cabecalho}>
                <span className={s.cargo}>{candidato.office}</span>
                <span className={s.selo}>TREINO</span>
              </p>

              <div className={s.linhaNumero}>
                <span className={s.rotulo}>Número:</span>
                <Digitos
                  total={candidato.number.length}
                  digitados={estado.digitados}
                  erroDigito={estado.erroDigito}
                />
              </div>

              {completo ? (
                <DadosCandidato candidato={candidato} />
              ) : (
                <>
                  <h1 className={s.titulo}>Treine seu voto</h1>
                  <p className={s.subtitulo}>
                    {preencher(
                      estado.numeroAberto ? textos.subtitulo : textos.subtituloMemoria,
                      candidato,
                    )}
                  </p>
                  <NumeroReferencia
                    numero={candidato.number}
                    aberto={estado.numeroAberto}
                    realcado={estado.revelaId > 0}
                    aoMostrar={acoes.mostrarNumero}
                  />
                </>
              )}

              <Mensagem mensagem={estado.mensagem} />

              {/* Preso no pé da tela, como na urna de referência. Fica visível
                  o tempo todo, e não só depois do número completo: é ele que
                  dá à tela a proporção do aparelho de verdade, em vez de um
                  vazio branco embaixo do texto. */}
              <div className={s.rodapeTela}>
                <hr className={s.regua} />
                <p className={s.instrucoes}>
                  Aperte a tecla:
                  <br />
                  <strong>CONFIRMA</strong> para confirmar este voto
                  <br />
                  <strong>CORRIGE</strong> para reiniciar este voto
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {fim ? (
        <BlocoFim
          candidato={candidato}
          sequencia={estado.sequencia}
          sequenciaCega={estado.sequenciaCega}
          musica={musica}
          aoTreinarDeNovo={acoes.treinarDeNovo}
          aoSilenciar={acoes.silenciarMusica}
        />
      ) : (
        <>
          <div className={s.faixaCorpo}>
            {/* No aparelho de referência esta placa moldada traz o brasão da
                Justiça Eleitoral e "UE 2020". Aqui ela traz a marca da
                campanha, que é o que esta peça é. */}
            <span className={s.placa}>
              <img
                src="/marca/vote-11223-claro.webp"
                alt="Vote Pepê 11223, deputado estadual"
                width={480}
                height={440}
              />
            </span>
            <span className={s.relevo} aria-hidden="true">
              TREINO 2026
            </span>
          </div>

          <Teclado
            aoDigito={acoes.digito}
            aoBranco={acoes.branco}
            aoCorrige={acoes.corrige}
            aoConfirma={acoes.confirma}
            confirmaLiberado={completo}
            teclaAcesa={teclaAcesa}
          />
        </>
      )}
    </section>
  );
}
