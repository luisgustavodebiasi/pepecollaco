import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Build estático do treino de voto. Sem SSR, sem rota: uma página só.
//
// `assetsDir: "estaticos"` não é preferência de gosto. O Vite emite os bundles
// com hash em `dist/assets/` por padrão, e `public/assets/` desemboca no mesmo
// lugar: a foto e o som do briefing colidiriam com o JavaScript. Tirando o
// bundle para `/estaticos/`, `/assets/` fica sendo exatamente o que a
// especificação pediu, e o `vercel.json` pode dar cache imutável a um e cache
// curto ao outro sem confundir os dois.
export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: "estaticos",
    target: "es2022",
    cssCodeSplit: false,
  },
});
