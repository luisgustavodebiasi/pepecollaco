import type { CandidatoConfig } from "../config/candidate";
import { textos } from "../config/candidate";
import { dataLocal, paraIcs } from "./datas";
import { escapar, montar } from "./serial";
import { preencher, sentenca } from "./texto";

/** AAAAMMDDTHHMMSSZ, o carimbo de geração, sempre em UTC. */
function carimbo(agora: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${agora.getUTCFullYear()}${p(agora.getUTCMonth() + 1)}${p(agora.getUTCDate())}` +
    `T${p(agora.getUTCHours())}${p(agora.getUTCMinutes())}${p(agora.getUTCSeconds())}Z`
  );
}

/**
 * Lembrete da eleição, como evento de dia inteiro.
 *
 * Três decisões que o arquivo não explica sozinho:
 *
 *   DTSTART;VALUE=DATE, sem hora e sem fuso. É a única forma de o evento cair
 *   no dia 4 em qualquer aparelho: com hora em UTC, um telefone configurado em
 *   outro fuso mostra o dia errado, que aqui seria o erro mais caro possível.
 *
 *   DTEND é EXCLUSIVO, então vai o dia seguinte. Sem DTEND alguns clientes
 *   criam evento de duração zero, e o iPhone não mostra isso na visão de mês.
 *
 *   UID estável, e não aleatório. Quem salvar duas vezes atualiza o evento em
 *   vez de ficar com dois lembretes iguais na agenda.
 */
export function montarIcs(candidato: CandidatoConfig, agora = new Date()): string {
  const dia = dataLocal(candidato.electionDate);
  if (!dia) return "";

  const seguinte = new Date(dia.getTime());
  seguinte.setDate(seguinte.getDate() + 1);

  const dominio = candidato.siteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const titulo = preencher(textos.lembrete, candidato);
  const descricao =
    `${sentenca(candidato.office)}. Nome de urna: ${candidato.ballotName}, ` +
    `número ${candidato.number}, ${candidato.party}. ` +
    `Treine em ${candidato.siteUrl}`;

  return montar([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pepe Collaco 11223//Treine seu voto//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:treine-seu-voto-${candidato.number}-${paraIcs(dia)}@${dominio}`,
    `DTSTAMP:${carimbo(agora)}`,
    `DTSTART;VALUE=DATE:${paraIcs(dia)}`,
    `DTEND;VALUE=DATE:${paraIcs(seguinte)}`,
    `SUMMARY:${escapar(titulo)}`,
    `DESCRIPTION:${escapar(descricao)}`,
    `URL:${candidato.siteUrl}`,
    "BEGIN:VALARM",
    // Véspera às 14h: a hora em que se decide se vai votar de manhã.
    "TRIGGER:-PT10H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapar(titulo)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]);
}

export const NOME_ICS = "lembrete-da-eleicao.ics";
export const MIME_ICS = "text/calendar;charset=utf-8";
