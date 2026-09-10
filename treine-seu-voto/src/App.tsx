import { config } from "./config/candidate";
import { Contagem } from "./componentes/Contagem";
import { Rodape } from "./componentes/Rodape";
import { Urna } from "./componentes/Urna";
import { useTreino } from "./estado/useTreino";
import s from "./estilos/App.module.css";

/**
 * Único módulo que importa a configuração do candidato. Tudo desce por props,
 * e as funções de lib/ recebem a configuração por argumento: nenhum componente
 * escreve número, nome, partido ou data à mão.
 */
export default function App() {
  const { estado, acoes, completo, teclaAcesa, musica } = useTreino(config);

  return (
    <div className={s.casca}>
      <Contagem electionDate={config.electionDate} />

      <main className={s.palco}>
        <Urna
          candidato={config}
          estado={estado}
          acoes={acoes}
          completo={completo}
          teclaAcesa={teclaAcesa}
          musica={musica}
        />
      </main>

      <Rodape legalNotice={config.legalNotice} />
    </div>
  );
}
