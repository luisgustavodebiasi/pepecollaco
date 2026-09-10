import { useEffect, useState } from "react";
import { diasAte, porExtenso } from "../lib/datas";
import s from "./Contagem.module.css";

/**
 * Contagem regressiva em dias. Some sozinha quando a data passa.
 *
 * Sem setInterval: a granularidade é o dia, então basta um timer até a próxima
 * meia-noite local. Um intervalo de um minuto acordaria o telefone 1.440 vezes
 * por dia para não mudar nada.
 */
export function Contagem({ electionDate }: { electionDate: string }) {
  const [dias, setDias] = useState(() => diasAte(electionDate));

  useEffect(() => {
    const agora = new Date();
    const meiaNoite = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate() + 1,
      0,
      0,
      5,
    );
    const id = window.setTimeout(
      () => setDias(diasAte(electionDate)),
      meiaNoite.getTime() - agora.getTime(),
    );
    return () => window.clearTimeout(id);
  }, [electionDate, dias]);

  if (dias === null || dias < 0) return null;

  const data = porExtenso(electionDate);
  let texto: string;
  if (dias === 0) texto = `É hoje. Eleição em ${data}.`;
  else if (dias === 1) texto = `É amanhã, ${data}.`;
  else texto = `Faltam ${dias} dias para ${data}.`;

  return (
    <p className={s.contagem} role="timer" aria-label={texto}>
      {texto}
    </p>
  );
}
