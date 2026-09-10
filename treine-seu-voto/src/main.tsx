import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { config } from "./config/candidate";
import { registrar } from "./lib/analytics";
import "./estilos/base.css";

/**
 * A cor de destaque vem da configuração e vira custom property antes do
 * primeiro pixel. O CSS traz um valor de segurança igual, para o caso de o
 * JavaScript falhar: a peça não pode aparecer sem a cor da campanha.
 *
 * Junto vai --sobre-marca, calculada: se alguém trocar brandColor por um tom
 * escuro, o texto em cima dele vira branco sozinho em vez de sumir.
 */
function aplicarMarca(cor: string) {
  const raiz = document.documentElement;
  raiz.style.setProperty("--marca", cor);
  raiz.style.setProperty("--sobre-marca", contrasteSobre(cor));
}

function contrasteSobre(hex: string): string {
  const limpo = hex.replace("#", "");
  if (limpo.length !== 6) return "#061a3a";
  const canal = (i: number) => {
    const v = parseInt(limpo.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const luz = 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
  // Compara o contraste com a tinta e com o branco, e devolve o que ganhar.
  const contraTinta = (luz + 0.05) / (0.0107 + 0.05);
  const contraBranco = 1.05 / (luz + 0.05);
  return contraTinta >= contraBranco ? "#061a3a" : "#ffffff";
}

aplicarMarca(config.brandColor);
registrar("page_view");

const raiz = document.getElementById("raiz");
if (raiz) {
  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
