import { useState } from "react";
import type { CandidatoConfig } from "../config/candidate";
import { textos } from "../config/candidate";
import { registrar } from "../lib/analytics";
import { baixarTexto } from "../lib/baixar";
import { MIME_ICS, NOME_ICS, montarIcs } from "../lib/calendario";
import { abrirWhatsapp, compartilhar, copiarLink } from "../lib/compartilhar";
import { MIME_VCF, NOME_VCF, montarVcf } from "../lib/contato";
import { curta } from "../lib/datas";
import { preencher } from "../lib/texto";
import s from "./Fim.module.css";

export function Compartilhar({ candidato }: { candidato: CandidatoConfig }) {
  const [copiado, setCopiado] = useState(false);
  const temShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const texto = preencher(candidato.shareText, candidato);

  return (
    <div className={s.compartilhar}>
      <div className={s.botoes}>
        <button
          type="button"
          className={s.secundario}
          aria-label="Compartilhar no WhatsApp"
          onClick={() => {
            registrar("shared", { canal: "whatsapp" });
            abrirWhatsapp(texto, candidato.siteUrl);
          }}
        >
          WhatsApp
        </button>

        {temShare && (
          <button
            type="button"
            className={s.secundario}
            aria-label="Compartilhar o treino"
            onClick={() => {
              // Sem nada assíncrono antes: no iOS, um await aqui consome a
              // autorização do toque e a folha não abre, sem erro nenhum.
              registrar("shared", { canal: "nativo" });
              compartilhar(texto, candidato.siteUrl);
            }}
          >
            Compartilhar
          </button>
        )}

        <button
          type="button"
          className={s.secundario}
          aria-label="Copiar o link do treino"
          onClick={() => {
            void copiarLink(candidato.siteUrl).then((deu) => {
              setCopiado(deu);
              window.setTimeout(() => setCopiado(false), 2200);
            });
          }}
        >
          {copiado ? "Link copiado" : "Copiar link"}
        </button>

        <button
          type="button"
          className={s.secundario}
          aria-label="Salvar lembrete da eleição no calendário"
          onClick={() => {
            registrar("reminder_saved");
            baixarTexto(montarIcs(candidato), NOME_ICS, MIME_ICS);
          }}
        >
          Salvar lembrete
        </button>

        <button
          type="button"
          className={s.secundario}
          aria-label="Salvar o número na agenda de contatos"
          onClick={() => {
            registrar("contact_saved");
            baixarTexto(montarVcf(candidato), NOME_VCF, MIME_VCF);
          }}
        >
          Salvar contato
        </button>
      </div>

      {/* O iPhone nem sempre baixa um blob: às vezes abre a folha "Abrir com",
          às vezes não faz nada visível. Com o lembrete escrito aqui embaixo,
          a falha é inofensiva: a informação continua na tela. */}
      <p className={s.reserva}>
        Se não abrir sozinho: {curta(candidato.electionDate)},{" "}
        {preencher(textos.lembrete, candidato)}.
      </p>
    </div>
  );
}
