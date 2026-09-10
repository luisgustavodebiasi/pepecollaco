/**
 * Telemetria que NÃO instala nada.
 *
 * O app não carrega GA4, Tag Manager nem Plausible. Esta função só entrega o
 * evento para o que já estiver na página, nessa ordem, e fica em silêncio
 * quando não há nada. Mesma forma usada no app de credenciamento.
 *
 * O que nunca entra aqui: dígito, tecla, conteúdo digitado, ordem de acerto.
 * O app não tem servidor e não grava voto; a telemetria não pode ser a porta
 * dos fundos por onde o voto sairia.
 */
export type EventoTreino =
  | "page_view"
  | "training_completed"
  | "training_restarted"
  | "shared"
  | "reminder_saved"
  | "contact_saved";

type Props = Record<string, string | number | boolean | undefined>;

interface JanelaComAnalytics {
  gtag?: (comando: string, evento: string, props?: Props) => void;
  dataLayer?: unknown[];
  plausible?: (evento: string, opcoes?: { props: Props }) => void;
}

export function registrar(nome: EventoTreino, props: Props = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as JanelaComAnalytics;
  try {
    if (typeof w.gtag === "function") w.gtag("event", nome, props);
    else if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event: nome, ...props });
    else if (typeof w.plausible === "function") w.plausible(nome, { props });
  } catch {
    // Telemetria nunca pode derrubar a interação de quem está usando a página.
  }
}
