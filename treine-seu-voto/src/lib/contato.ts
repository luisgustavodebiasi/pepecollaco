import type { CandidatoConfig } from "../config/candidate";
import { curta } from "./datas";
import { escapar, montar } from "./serial";
import { sentenca } from "./texto";

/**
 * O cartão de contato, para o número ficar na agenda do eleitor.
 *
 * vCard 3.0 e não 4.0: os aplicativos de Contatos do iPhone e do Android
 * importam 3.0 sem atrito, e no 4.0 ainda aparece campo perdido.
 *
 * O número DE URNA vai em ORG e em NOTE, nunca em TEL: em TEL o aparelho
 * ofereceria discar 11223, o que é enganoso. O TEL leva o telefone do
 * gabinete, que é um número para o qual se liga de verdade, e é ele que faz o
 * cartão valer a pena guardar depois da eleição.
 *
 * Sem PHOTO: foto em base64 multiplica o arquivo por quarenta, e a dobra de
 * linha de valor binário é justamente onde os importadores mais falham.
 */
export function montarVcf(candidato: CandidatoConfig): string {
  const partes = candidato.ballotName.trim().split(/\s+/);
  const primeiro = partes[0] ?? candidato.ballotName;
  const sobrenome = partes.slice(1).join(" ");

  const nota =
    `Vote ${candidato.number} em ${curta(candidato.electionDate)}. ` +
    `${candidato.ballotName}, ${candidato.office.toLocaleLowerCase("pt-BR")} pelo ${candidato.party}. ` +
    `Treine em ${candidato.siteUrl}`;

  return montar([
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapar(sobrenome)};${escapar(primeiro)};;;`,
    `FN:${escapar(`${candidato.ballotName} ${candidato.number}`)}`,
    `ORG:${escapar(`${candidato.number} · ${sentenca(candidato.office)}`)}`,
    `TITLE:${escapar(sentenca(candidato.office))}`,
    `TEL;TYPE=CELL,VOICE:${candidato.phone}`,
    `NOTE:${escapar(nota)}`,
    `URL:${candidato.siteUrl}`,
    "END:VCARD",
  ]);
}

export const NOME_VCF = "numero-na-agenda.vcf";
export const MIME_VCF = "text/vcard;charset=utf-8";
