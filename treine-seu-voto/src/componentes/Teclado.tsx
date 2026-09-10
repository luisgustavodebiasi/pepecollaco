import { Tecla } from "./Tecla";
import s from "./Teclado.module.css";

interface Props {
  aoDigito: (d: string) => void;
  aoBranco: () => void;
  aoCorrige: () => void;
  aoConfirma: () => void;
  confirmaLiberado: boolean;
  teclaAcesa: string | null;
}

const NUMEROS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * A ordem do DOM segue a leitura do teclado da urna, linha a linha, e é ela que
 * a navegação por Tab percorre: 1 2 3 BRANCO, 4 5 6 CORRIGE, 7 8 9 CONFIRMA,
 * 0. O CONFIRMA ocupa duas linhas pelo CSS, não por mudança de ordem.
 */
export function Teclado({
  aoDigito,
  aoBranco,
  aoCorrige,
  aoConfirma,
  confirmaLiberado,
  teclaAcesa,
}: Props) {
  const numero = (d: string) => (
    <Tecla
      key={d}
      rotulo={d}
      ariaLabel={`Digitar ${d}`}
      variante="numero"
      aoAcionar={() => aoDigito(d)}
      acesa={teclaAcesa === d}
    />
  );

  return (
    <div className={s.teclado}>
      {NUMEROS.slice(0, 3).map(numero)}
      <Tecla
        rotulo="BRANCO"
        ariaLabel="Voto em branco"
        variante="branco"
        aoAcionar={aoBranco}
      />

      {NUMEROS.slice(3, 6).map(numero)}
      <Tecla
        rotulo="CORRIGE"
        ariaLabel="Corrigir, apagar os números digitados"
        variante="corrige"
        aoAcionar={aoCorrige}
        acesa={teclaAcesa === "corrige"}
      />

      {NUMEROS.slice(6, 9).map(numero)}
      {/*
        CONFIRMA nunca usa o atributo `disabled`. Com ele o botão sai da ordem
        de tabulação e não responde a nada: quem tenta apertar não recebe
        explicação nenhuma. Com aria-disabled ele continua focável, responde ao
        toque e a mensagem na tela diz o que falta.
      */}
      <Tecla
        rotulo="CONFIRMA"
        ariaLabel="Confirmar o voto de treino"
        variante="confirma"
        aoAcionar={aoConfirma}
        inativa={!confirmaLiberado}
        descritaPor={confirmaLiberado ? undefined : "dica-confirma"}
        acesa={teclaAcesa === "confirma"}
      />

      <Tecla
        rotulo="0"
        ariaLabel="Digitar 0"
        variante="numero"
        aoAcionar={() => aoDigito("0")}
        acesa={teclaAcesa === "0"}
        classe={s.zero}
      />

      <span id="dica-confirma" className="sr-only">
        Digite o número completo para liberar o CONFIRMA.
      </span>
    </div>
  );
}
