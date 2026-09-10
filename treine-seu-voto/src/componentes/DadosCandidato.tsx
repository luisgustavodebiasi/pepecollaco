import type { CandidatoConfig } from "../config/candidate";
import s from "./Dados.module.css";

/**
 * O que a tela da urna mostra depois do último dígito: nome, nome de urna,
 * partido e a fotografia à direita, na mesma disposição do aparelho de
 * referência.
 *
 * A foto usa object-fit: contain, e não cover, apesar de cover ser o reflexo
 * automático. O ativo é um busto RECORTADO em fundo transparente: com cover,
 * numa caixa 3:4, o corte come o topo da cabeça.
 */
export function DadosCandidato({ candidato }: { candidato: CandidatoConfig }) {
  return (
    <div className={s.dados} role="group" aria-label="Candidato do treino">
      <dl className={s.lista}>
        <div className={s.linha}>
          <dt>Nome</dt>
          <dd>{candidato.name}</dd>
        </div>
        <div className={s.linha}>
          <dt>Nome de urna</dt>
          <dd className={s.forte}>{candidato.ballotName}</dd>
        </div>
        <div className={s.linha}>
          <dt>Partido</dt>
          <dd>{candidato.party}</dd>
        </div>
      </dl>

      <div className={s.moldura}>
        <img className={s.foto} src={candidato.image} alt="" width={677} height={900} />
      </div>
    </div>
  );
}
