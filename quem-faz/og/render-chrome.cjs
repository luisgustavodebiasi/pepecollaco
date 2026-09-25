/* ══════════════════════════════════════════════════════════════════════════
   Imagens de compartilhamento das páginas novas (índice e leis), com o
   Google Chrome instalado no Mac em vez do Playwright.

   Mesmo molde de render.cjs (template.html, 1200×630, Acumin e degradê de
   verdade). Existe porque o Playwright mora em gerador-materiais/, que nem
   sempre está instalado; o Chrome do sistema em modo headless faz a mesma
   foto sem dependência nenhuma.

     cd quem-faz/og
     node render-chrome.cjs              # todas as páginas abaixo
     node render-chrome.cjs indice       # só esta

   As páginas de lei saem de dados/leis-paginas.json + leis.json: número da lei
   e data vêm da base, como no resto da série.
   ══════════════════════════════════════════════════════════════════════════ */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const RAIZ = path.resolve(__dirname, '..', '..');
const QF = path.join(RAIZ, 'quem-faz');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const ler = (nome) => JSON.parse(fs.readFileSync(path.join(QF, 'dados', nome), 'utf8'));

function paginas() {
  const leis = ler('leis.json');
  const emendas = ler('emendas.json');
  const { destaques } = ler('leis-paginas.json');
  const porCodigo = new Map(leis.proposicoes.map((p) => [p.codigo, p]));
  const mi = Math.floor(emendas.total / 1e6);

  const lista = {
    indice: {
      pasta: '.',
      titulo: '', destaque: 'REPRESENTA',
      numero: `R$ ${mi}`, unidade: 'MILHÕES',
      legenda: `em ${emendas.municipios} municípios. O mandato por assunto e por cidade`,
    },
    'projetos-de-lei': {
      pasta: 'projetos-de-lei',
      titulo: '', destaque: 'LEI',
      numero: String(leis.totalLeis), unidade: 'LEIS',
      legenda: 'aprovadas em Santa Catarina. Poucos projetos, grandes impactos',
    },
  };

  for (const d of destaques) {
    const p = porCodigo.get(d.codigo);
    const [num, ano] = p.virouLei
      ? p.rotulo.replace(/^LEI Nº /, '').split('/')
      : [p.codigo.replace('./', ' ').split('/')[0], p.codigo.split('/').pop()];
    lista[`lei/${d.slug}`] = {
      pasta: `projetos-de-lei/${d.slug}`,
      titulo: '', destaque: 'LEI',
      numero: p.virouLei ? num : num.replace('PL', 'PL '), unidade: `/${ano}`,
      legenda: d.titulo + (p.virouLei ? '' : ', em tramitação'),
    };
  }
  return lista;
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.otf': 'font/otf',
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
  if (!fs.existsSync(CHROME)) throw new Error(`Chrome não encontrado em ${CHROME}`);
  const todas = paginas();
  const pedidos = process.argv.slice(2);
  const alvos = pedidos.length ? pedidos : Object.keys(todas);

  const app = await servir();
  const porta = app.address().port;

  for (const chave of alvos) {
    const pg = todas[chave];
    if (!pg) throw new Error(`página desconhecida: ${chave} (cadastradas: ${Object.keys(todas).join(', ')})`);
    const { pasta, ...parametros } = pg;
    const url = `http://127.0.0.1:${porta}/quem-faz/og/template.html?${new URLSearchParams(parametros)}`;
    const png = path.join(QF, pasta, 'og.png');
    const jpg = path.join(QF, pasta, 'og.jpg');

    // execFile, não exec: o Chrome roda em processo filho enquanto este
    // processo segue servindo os arquivos, por isso a chamada é assíncrona.
    await new Promise((ok, falha) => {
      require('node:child_process').execFile(CHROME, [
        '--headless=new', '--disable-gpu', '--hide-scrollbars',
        '--window-size=1200,630', '--virtual-time-budget=6000',
        `--screenshot=${png}`, url,
      ], (erro) => (erro && !fs.existsSync(png) ? falha(erro) : ok()));
    });

    execFileSync('magick', [png, '-crop', '1200x630+0+0', '+repage', '-quality', '88', jpg]);
    fs.unlinkSync(png);
    const kb = (fs.statSync(jpg).size / 1024).toFixed(0);
    console.log(`✓ ${path.relative(QF, jpg)}  ${kb} KB${kb > 300 ? '  ⚠ pesado para o WhatsApp' : ''}`);
  }

  app.close();
}

principal().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
