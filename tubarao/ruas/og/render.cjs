/* ══════════════════════════════════════════════════════════════════════════
   Gera a imagem de compartilhamento da página tubarao/ruas.

   Fotografa template.html com o Chromium em 1200×630 e grava tubarao/ruas/og.jpg.
   Mesmo esquema de quem-faz/og/render.cjs: um servidor mínimo sobre a raiz do
   site (máscara e fonte não funcionam direito em file://) e o Playwright do
   gerador-materiais, que não é dependência deste repositório:

     cd pepecollaco-site/tubarao/ruas/og
     NODE_PATH="../../../../gerador-materiais/node_modules" node render.cjs
   ══════════════════════════════════════════════════════════════════════════ */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..', '..');   // pepecollaco-site/
const { chromium } = require('playwright');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.otf': 'font/otf',
};

function servir() {
  const app = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    const alvo = path.join(RAIZ, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (!alvo.startsWith(RAIZ) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) {
      res.writeHead(404).end('não encontrado');
      return;
    }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(alvo)] || 'application/octet-stream' });
    fs.createReadStream(alvo).pipe(res);
  });
  return new Promise((ok) => app.listen(0, '127.0.0.1', () => ok(app)));
}

async function principal() {
  const app = await servir();
  const porta = app.address().port;
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  await pagina.goto(`http://127.0.0.1:${porta}/tubarao/ruas/og/template.html`, {
    waitUntil: 'networkidle',
  });
  await pagina.waitForSelector('html[data-pronto="1"]', { timeout: 15000 });

  const saida = path.join(RAIZ, 'tubarao', 'ruas', 'og.jpg');
  await pagina.screenshot({ path: saida, type: 'jpeg', quality: 88 });

  const kb = (fs.statSync(saida).size / 1024).toFixed(0);
  const aviso = kb > 300 ? '  ⚠ pesado para o WhatsApp' : '';
  console.log(`✓ tubarao/ruas/og.jpg  ${kb} KB${aviso}`);

  await navegador.close();
  app.close();
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
