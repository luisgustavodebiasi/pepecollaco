/**
 * Compartilhamento.
 *
 * A regra dura, aprendida no gerador de peças da campanha: no iOS a folha de
 * compartilhamento só abre se navigator.share for chamado AINDA DENTRO do
 * gesto. Qualquer await antes consome a autorização do toque e nada acontece,
 * sem erro nenhum na tela. Por isso não há nada assíncrono antes da chamada.
 *
 * E fechar a folha lança AbortError. Isso é desistência, não falha: não pode
 * virar mensagem de erro nem cair no plano B.
 */
export type ResultadoCompartilhar = "nativo" | "whatsapp";

export function abrirWhatsapp(texto: string, url: string): void {
  const mensagem = `${texto} ${url}`.trim();
  window.open(
    `https://wa.me/?text=${encodeURIComponent(mensagem)}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export function compartilhar(texto: string, url: string): ResultadoCompartilhar {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    abrirWhatsapp(texto, url);
    return "whatsapp";
  }
  navigator.share({ title: "Treine seu voto", text: texto, url }).catch(() => {
    // AbortError e recusa do sistema caem aqui. Os dois são silêncio.
  });
  return "nativo";
}

export async function copiarLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    // WebView antigo, ou permissão negada.
    try {
      const campo = document.createElement("textarea");
      campo.value = url;
      campo.setAttribute("readonly", "");
      campo.style.position = "fixed";
      campo.style.opacity = "0";
      document.body.appendChild(campo);
      campo.select();
      const deu = document.execCommand("copy");
      campo.remove();
      return deu;
    } catch {
      return false;
    }
  }
}
