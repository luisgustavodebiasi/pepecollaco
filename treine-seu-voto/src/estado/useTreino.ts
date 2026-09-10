import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { CandidatoConfig } from "../config/candidate";
import { textos } from "../config/candidate";
import { registrar } from "../lib/analytics";
import { vibrar } from "../lib/haptico";
import { trechoDaRodada } from "../config/musica";
import {
  estadoDaMusica,
  ouvirMusica,
  pararMusica,
  prepararSom,
  reativarSom,
  silenciar,
  tocarClique,
  tocarMusica,
  tocarSucesso,
} from "../lib/som";
import { preencher } from "../lib/texto";
import { criarRedutor } from "./redutor";
import type { Estado } from "./tipos";
import { INICIAL } from "./tipos";

const MS_ERRO = 600;
const MS_REALCE = 2000;
const MS_CONFIRMACAO = 700;

export interface Acoes {
  digito: (d: string) => void;
  corrige: () => void;
  branco: () => void;
  confirma: () => void;
  mostrarNumero: () => void;
  treinarDeNovo: () => void;
  silenciarMusica: () => void;
}

export interface EstadoMusica {
  tocando: boolean;
  mudo: boolean;
  titulo: string | null;
}

export interface Treino {
  estado: Estado;
  acoes: Acoes;
  completo: boolean;
  /**
   * Qual tecla acender por 90 ms. Existe só para o teclado do computador: sem
   * isto, quem digita no teclado físico não vê tecla nenhuma responder, e a
   * interface parece ter ignorado o comando.
   */
  teclaAcesa: string | null;
  musica: EstadoMusica;
}

export function useTreino(candidato: CandidatoConfig): Treino {
  const redutor = useMemo(() => criarRedutor(candidato.number), [candidato.number]);
  const [estado, despachar] = useReducer(redutor, INICIAL);
  const [teclaAcesa, setTeclaAcesa] = useState<string | null>(null);
  const [musica, setMusica] = useState<EstadoMusica>(() => estadoDaMusica());

  useEffect(() => ouvirMusica(() => setMusica(estadoDaMusica())), []);
  const relogioTecla = useRef<number | null>(null);

  const acender = useCallback((chave: string) => {
    if (relogioTecla.current !== null) window.clearTimeout(relogioTecla.current);
    setTeclaAcesa(chave);
    relogioTecla.current = window.setTimeout(() => setTeclaAcesa(null), 90);
  }, []);

  useEffect(
    () => () => {
      if (relogioTecla.current !== null) window.clearTimeout(relogioTecla.current);
    },
    [],
  );

  const completo = estado.digitados.length === candidato.number.length;

  const digito = useCallback(
    (d: string) => {
      // Primeiro gesto da sessão: é aqui que se compra a autorização de áudio.
      prepararSom();
      tocarClique();
      despachar({ tipo: "DIGITO", digito: d });
    },
    [despachar],
  );

  const corrige = useCallback(() => {
    prepararSom();
    tocarClique();
    vibrar(14);
    despachar({ tipo: "CORRIGE" });
  }, [despachar]);

  const branco = useCallback(() => {
    prepararSom();
    tocarClique();
    vibrar(14);
    despachar({ tipo: "BRANCO", texto: preencher(textos.branco, candidato) });
  }, [despachar, candidato]);

  const confirma = useCallback(() => {
    prepararSom();
    tocarClique();
    if (completo) {
      // Ainda dentro do gesto: som e vibração não podem esperar um efeito.
      tocarSucesso();
      vibrar([0, 18, 40, 30]);
      // A música entra 200 ms depois, ainda por cima da cauda do bipe. Esperar
      // o bipe acabar soaria a corte de rádio; entrar junto abafa a confirmação.
      window.setTimeout(() => tocarMusica(trechoDaRodada(estado.rodada)), 200);
    }
    despachar({ tipo: "CONFIRMA" });
  }, [despachar, completo, estado.rodada]);

  const mostrarNumero = useCallback(() => {
    despachar({ tipo: "MOSTRAR_NUMERO" });
  }, [despachar]);

  const treinarDeNovo = useCallback(() => {
    // A música da rodada anterior morre aqui. Deixar tocando por cima da
    // rodada nova embaralharia o trecho seguinte com o atual.
    pararMusica();
    tocarClique();
    registrar("training_restarted");
    despachar({ tipo: "TREINAR_DE_NOVO" });
  }, [despachar]);

  // Alterna. Silenciar sem volta seria uma porta só de ida: quem tocou por
  // engano ficaria sem música pelo resto da sessão, e a música é parte da peça.
  const silenciarMusica = useCallback(() => {
    if (estadoDaMusica().mudo) {
      reativarSom();
      tocarMusica(trechoDaRodada(estado.rodada));
    } else {
      silenciar();
    }
  }, [estado.rodada]);

  // Retorno tátil do acerto e do erro. Fica em efeito, e não na ação, porque
  // só o redutor sabe se o dígito estava certo.
  useEffect(() => {
    if (estado.erroId > 0) vibrar([0, 45, 70, 45]);
  }, [estado.erroId]);

  useEffect(() => {
    if (estado.digitados.length > 0) vibrar(12);
  }, [estado.digitados.length]);

  // Três timers, cada um dependendo de um contador monotônico. Cada efeito
  // limpa o seu no retorno, então trocar de tela não deixa timer órfão e nunca
  // há dois do mesmo tipo vivos ao mesmo tempo.
  useEffect(() => {
    if (estado.erroId === 0) return;
    const id = window.setTimeout(() => despachar({ tipo: "FIM_ERRO" }), MS_ERRO);
    return () => window.clearTimeout(id);
  }, [estado.erroId]);

  useEffect(() => {
    if (estado.revelaId === 0) return;
    const id = window.setTimeout(() => despachar({ tipo: "FIM_REALCE" }), MS_REALCE);
    return () => window.clearTimeout(id);
  }, [estado.revelaId]);

  useEffect(() => {
    if (estado.fase !== "confirmando") return;
    const id = window.setTimeout(
      () => despachar({ tipo: "FIM_CONFIRMACAO" }),
      MS_CONFIRMACAO,
    );
    return () => window.clearTimeout(id);
  }, [estado.fase]);

  useEffect(() => {
    if (estado.fase === "fim") {
      registrar("training_completed", {
        rodada: estado.rodada,
        sequencia: estado.sequencia,
      });
    }
    // Nunca acompanha o que foi digitado: só que uma rodada terminou.
  }, [estado.fase, estado.rodada, estado.sequencia]);

  // Teclado do computador. Um ouvinte só, na janela, e não um por tecla.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;

      const alvo = evento.target as HTMLElement | null;
      const emBotao = alvo?.tagName === "BUTTON" || alvo?.tagName === "A";
      // Enter e espaço num botão focado já são ativação nativa. Despachar aqui
      // faria a ação acontecer duas vezes para quem navega por Tab.
      if (emBotao && (evento.key === "Enter" || evento.key === " ")) return;

      if (estado.fase !== "treino") return;

      if (/^[0-9]$/.test(evento.key)) {
        evento.preventDefault();
        acender(evento.key);
        digito(evento.key);
        return;
      }
      if (evento.key === "Backspace") {
        evento.preventDefault();
        acender("corrige");
        corrige();
        return;
      }
      if (evento.key === "Enter") {
        evento.preventDefault();
        acender("confirma");
        confirma();
      }
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [estado.fase, digito, corrige, confirma, acender]);

  const acoes = useMemo<Acoes>(
    () => ({ digito, corrige, branco, confirma, mostrarNumero, treinarDeNovo, silenciarMusica }),
    [digito, corrige, branco, confirma, mostrarNumero, treinarDeNovo, silenciarMusica],
  );

  return { estado, acoes, completo, teclaAcesa, musica };
}
