/* ══════════════════════════════════════════════════════════════════════════
   Gerador das imagens de compartilhamento das páginas QUEM FAZ.

   Fotografa template.html com o Chromium em 1200×630 e grava o JPG dentro da
   pasta da página. Usa a Acumin de verdade, o degradê de verdade e o retrato
   de verdade, por isso o navegador, e não uma montagem à mão.

   O pacote playwright não é dependência deste repositório (o site é estático).
   Ele já existe em gerador-materiais/, então rode apontando o NODE_PATH:

     cd pepecollaco-site/quem-faz/og
     NODE_PATH="../../../gerador-materiais/node_modules" node render.cjs
     NODE_PATH="../../../gerador-materiais/node_modules" node render.cjs por-tubarao

   Sem argumento, gera todas as páginas cadastradas abaixo.
   ══════════════════════════════════════════════════════════════════════════ */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..', '..');   // pepecollaco-site/
const { chromium } = require('playwright');

/* Cada página e o que a OG dela mostra. Título curto, um número, uma linha.

   Os números de por-tubarao e pela-amurel são apurados por
   build/normalizar.cjs a partir de EMENDAS /emendas_site_historico.csv e
   conferidos no build das páginas. Ao mexer neles aqui, rode
   `node build/gerar-paginas.cjs` antes: se o valor não fechar com a base, o
   build reclama.

   As demais páginas ainda não foram migradas para o gerador e seus números
   seguem escritos à mão, defasados em relação ao HTML publicado. */
const PAGINAS = {
  'por-tubarao': {
    titulo: 'por',
    destaque: 'TUBARÃO',
    numero: 'R$ 18,9',
    unidade: 'MILHÕES',
    legenda: 'destinados a Tubarão em 45 emendas do mandato',
  },
  'pelo-sul': {
    titulo: 'pelo',
    destaque: 'SUL',
    numero: '+R$ 119',
    unidade: 'MILHÕES',
    legenda: 'em 43 municípios do Sul Catarinense',
  },
  'pela-amurel': {
    titulo: 'pela',
    destaque: 'AMUREL',
    numero: 'R$ 88',
    unidade: 'MILHÕES',
    legenda: 'nos 20 municípios da AMUREL, sem deixar nenhum de fora',
  },
  'pelo-autismo': {
    titulo: 'pelo',
    destaque: 'AUTISMO',
    numero: 'R$ 4,7',
    unidade: 'MILHÕES',
    legenda: 'em terapia e acolhimento para famílias atípicas de 18 municípios',
  },
  'pela-educacao': {
    titulo: 'pela',
    destaque: 'EDUCAÇÃO',
    numero: 'R$ 13,2',
    unidade: 'MILHÕES',
    legenda: 'em creches, escolas e transporte escolar de 39 municípios',
  },
  'pelas-cidades': {
    titulo: 'pelas',
    destaque: 'CIDADES',
    numero: '113',
    unidade: 'MUNICÍPIOS',
    legenda: 'de Santa Catarina atendidos, do litoral à serra',
  },
  'projetos-de-lei': {
    titulo: 'projetos de',
    destaque: 'LEI',
    numero: '',
    unidade: '',
    legenda: 'Poucos projetos, grandes impactos',
  },
};

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

/* Servidor mínimo sobre a raiz do site. É por http, e não file://, porque o
   Chromium trata máscara e fonte de origem file:// com regras próprias. */
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
  const pedidos = process.argv.slice(2);
  const alvos = pedidos.length ? pedidos : Object.keys(PAGINAS);

  const desconhecida = alvos.find((s) => !PAGINAS[s]);
  if (desconhecida) {
    console.error(`Página desconhecida: ${desconhecida}`);
    console.error(`Cadastradas: ${Object.keys(PAGINAS).join(', ')}`);
    process.exit(1);
  }

  const app = await servir();
  const porta = app.address().port;
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  for (const slug of alvos) {
    const q = new URLSearchParams(PAGINAS[slug]).toString();
    await pagina.goto(`http://127.0.0.1:${porta}/quem-faz/og/template.html?${q}`, {
      waitUntil: 'networkidle',
    });
    // o molde só marca data-pronto depois de ajustar o corpo do título
    await pagina.waitForSelector('html[data-pronto="1"]', { timeout: 15000 });

    const pasta = path.join(RAIZ, 'quem-faz', slug);
    fs.mkdirSync(pasta, { recursive: true });
    const saida = path.join(pasta, 'og.jpg');
    await pagina.screenshot({ path: saida, type: 'jpeg', quality: 88 });

    const kb = (fs.statSync(saida).size / 1024).toFixed(0);
    const aviso = kb > 300 ? '  ⚠ pesado para o WhatsApp' : '';
    console.log(`✓ ${slug}/og.jpg  ${kb} KB${aviso}`);
  }

  await navegador.close();
  app.close();
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
