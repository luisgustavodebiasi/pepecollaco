import s from "./Rodape.module.css";

/**
 * O rodapé é obrigação, não enfeite: ele é a negativa explícita de vínculo com
 * a Justiça Eleitoral. Fica no fluxo, no fim da grade, e não em position:fixed,
 * porque fixo no iPhone briga com a barra de endereço que aparece e some.
 * A página não rola, então estar no fim do fluxo é estar sempre visível.
 */
export function Rodape({ legalNotice }: { legalNotice: string }) {
  const legal = legalNotice.trim();
  return (
    <footer className={s.rodape}>
      <p className={s.aviso}>
        Esta é uma ferramenta de treino e demonstração de campanha. Não possui
        vínculo com a Justiça Eleitoral ou com o sistema oficial de votação.
      </p>
      {legal !== "" && <p className={s.legal}>{legal}</p>}
    </footer>
  );
}
