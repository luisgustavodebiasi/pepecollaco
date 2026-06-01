import { defineConfig } from 'vite'

// Build da app de credenciamento (operador).
//
// `base: './'`  → assets com caminho relativo, então a app funciona em
//                 qualquer subpasta (ex.: www.pepecollaco.com/credenciar/).
// `outDir`      → publica o build já na raiz do repositório, na pasta
//                 `/credenciar/`, que o GitHub Pages serve diretamente.
//                 (a pasta `credenciamento/` continua sendo só o código-fonte)
export default defineConfig({
  base: './',
  build: {
    outDir: '../credenciar',
    emptyOutDir: true,
  },
})
