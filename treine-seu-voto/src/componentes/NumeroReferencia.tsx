import s from "./Urna.module.css";

interface Props {
  numero: string;
  aberto: boolean;
  realcado: boolean;
  aoMostrar: () => void;
}

/**
 * O número à vista. Na rodada 1 ele nasce aberto: o objetivo é ensinar, não
 * testar às cegas. Da rodada 2 em diante ele nasce escondido, e volta sozinho
 * quando a pessoa erra, ou quando ela pede.
 *
 * O número fica em pílula amarela com texto tinta, e não em texto amarelo: é o
 * par de contraste canônico da identidade, 10,8 contra 1, e amarelo escrito
 * sobre a tela clara da urna reprovaria.
 */
export function NumeroReferencia({ numero, aberto, realcado, aoMostrar }: Props) {
  if (!aberto) {
    return (
      <button type="button" className={s.naoLembro} onClick={aoMostrar}>
        Não lembro, mostrar o número
      </button>
    );
  }

  return (
    <p className={s.referencia} data-realcado={realcado || undefined}>
      <span className={s.referenciaRotulo}>O número é</span>
      <strong className={s.referenciaNumero}>{numero}</strong>
    </p>
  );
}
