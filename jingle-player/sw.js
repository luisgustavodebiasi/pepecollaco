/* ==========================================================================
   Service worker · player de jingles 11223
   Suba VERSAO a cada publicação: é o que aposenta o cache antigo.
   ========================================================================== */
const VERSAO      = "v3";
const CACHE_CASCA = "jingle-casca-" + VERSAO;
const CACHE_MIDIA = "jingle-midia-v1";   // preenchido pela página, com progresso

/* A casca é tudo que a tela precisa para abrir. O áudio NÃO entra aqui: são
   7,8 MB, e uma instalação que baixa tudo de uma vez falha inteira se a rede
   oscilar. A página busca as faixas depois, uma a uma, mostrando progresso. */
const CASCA = [
  "./", "./index.html", "./app.css", "./app.js", "./manifest.webmanifest",
  "./fontes/acumin-400.woff2", "./fontes/acumin-700.woff2", "./fontes/acumin-wide-900.woff2",
  "./img/capa-01.webp", "./img/capa-02.webp", "./img/capa-03.webp",
  "./img/capa-01-512.jpg", "./img/capa-02-512.jpg", "./img/capa-03-512.jpg",
  "./img/marca-collaco.webp", "./img/setas-tile.svg", "./img/seta-branca.svg",
  "./img/icone-512.png", "./img/icone-maskable-512.png",
  "./img/apple-touch-icon.png", "./img/favicon-32.png", "./img/favicon.ico",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_CASCA)
      .then((c) => c.addAll(CASCA))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(
        nomes.filter((n) => n.startsWith("jingle-casca-") && n !== CACHE_CASCA)
             .map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

/* Rede primeiro com prazo curto, para a navegação pegar versão nova quando há
   sinal; sem sinal, cai no cache na hora. */
async function redePrimeiro(req, prazo = 2500) {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), prazo);
  try {
    const r = await fetch(req, { signal: controle.signal });
    clearTimeout(relogio);
    const c = await caches.open(CACHE_CASCA);
    c.put(req, r.clone());
    return r;
  } catch {
    clearTimeout(relogio);
    return (await caches.match(req)) || (await caches.match("./index.html"));
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") { e.respondWith(redePrimeiro(req)); return; }

  if (url.pathname.endsWith(".mp3")) { e.respondWith(servirAudio(req, url)); return; }

  /* Resto: cache primeiro, revalidando em segundo plano. */
  e.respondWith((async () => {
    const guardado = await caches.match(req, { ignoreVary: true });
    const daRede = fetch(req).then((r) => {
      if (r.ok) caches.open(CACHE_CASCA).then((c) => c.put(req, r.clone()));
      return r;
    }).catch(() => null);
    return guardado || (await daRede) || new Response("", { status: 504 });
  })());
});

/* Áudio guardado, servido inclusive em pedaços.
   O <audio> pede faixas de bytes (Range) para poder buscar posição. O Cache
   Storage guarda a resposta inteira e ignora esse cabeçalho: devolver 200 para
   um pedido de Range funciona no Chrome, mas o Safari recusa e a faixa não
   toca. Como o iPhone é justamente o aparelho mais provável no painel do
   carro, montamos o 206 na mão. */
async function servirAudio(req, url) {
  const c = await caches.open(CACHE_MIDIA);
  let resp = (await c.match(url.pathname, { ignoreSearch: true, ignoreVary: true }))
          || (await c.match(req,          { ignoreSearch: true, ignoreVary: true }));

  if (!resp) {
    try {
      const r = await fetch(req);
      // Só guarda resposta inteira: um 206 no cache serviria pedaço errado depois.
      if (r.ok && r.status === 200) c.put(url.pathname, r.clone());
      return r;
    } catch {
      return new Response("", { status: 504, statusText: "sem rede e sem cache" });
    }
  }

  const range = req.headers.get("range");
  if (!range) return resp;

  const buf = await resp.arrayBuffer();
  const total = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return resp;

  let inicio = m[1] ? parseInt(m[1], 10) : 0;
  let fim    = m[2] ? parseInt(m[2], 10) : total - 1;
  if (isNaN(inicio) || inicio < 0) inicio = 0;
  if (isNaN(fim) || fim >= total)  fim = total - 1;
  if (inicio > fim) {
    return new Response("", { status: 416,
      headers: { "Content-Range": "bytes */" + total } });
  }

  return new Response(buf.slice(inicio, fim + 1), {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type":   "audio/mpeg",
      "Content-Range":  "bytes " + inicio + "-" + fim + "/" + total,
      "Content-Length": String(fim - inicio + 1),
      "Accept-Ranges":  "bytes",
    },
  });
}
