/**
 * Datas da eleição.
 *
 * new Date("2026-10-04") NÃO serve: a forma só-data é interpretada como
 * meia-noite em UTC, que no Brasil é dia 3 às 21h. A contagem regressiva
 * mostraria um dia a mais e a peça erraria justamente o número que ela existe
 * para ensinar. Por isso o parse é manual, em data local.
 */
export function dataLocal(iso: string): Date | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!partes) return null;
  const [, ano, mes, dia] = partes;
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

/** Dias inteiros de hoje até a data. Negativo quando já passou. */
export function diasAte(iso: string, agora = new Date()): number | null {
  const alvo = dataLocal(iso);
  if (!alvo) return null;
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "4 de outubro". Sem o ano: a eleição é a do ano corrente da campanha. */
export function porExtenso(iso: string): string {
  const data = dataLocal(iso);
  if (!data) return iso;
  return `${data.getDate()} de ${MESES[data.getMonth()] ?? ""}`;
}

/** "04/10/2026", para onde a data precisa caber curta. */
export function curta(iso: string): string {
  const data = dataLocal(iso);
  if (!data) return iso;
  const dd = String(data.getDate()).padStart(2, "0");
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${data.getFullYear()}`;
}

/** AAAAMMDD, o formato de data do iCalendar. */
export function paraIcs(data: Date): string {
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  const dd = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}${mm}${dd}`;
}
