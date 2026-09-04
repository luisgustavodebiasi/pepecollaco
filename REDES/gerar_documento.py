#!/usr/bin/env python3
"""
gerar_documento.py — transforma o CSV consolidado num documento HTML de consulta,
autossuficiente, para achar rápido o post de qualquer assunto.

    cd REDES && python3 gerar_documento.py

Entra: posts_conteudo_3anos_unico.csv
Sai:   acervo-posts.html   (abre com duplo clique, não precisa de servidor)

Visual: identidade Pepê Collaço 11223 (_IDENTIDADE/CLAUDE.md). Fundo, cores e
textura de setas vêm de lá. A fonte é Archivo, que o próprio guia indica como
substituta da Acumin onde a licença não cobre webfont.
"""

import base64
import csv
import json
import re
import unicodedata
from pathlib import Path

AQUI = Path(__file__).parent
ENTRADA = AQUI / "posts_conteudo_3anos_unico.csv"
SAIDA = AQUI / "acervo-posts.html"
# mesma página sem o esqueleto html/head/body, para publicar como Artifact
SAIDA_ARTIFACT = AQUI / "acervo-posts.artifact.html"
TEXTURA = AQUI.parent / "_IDENTIDADE/dist/textura/setas-tile.svg"

# Assuntos e municípios viram atalhos de busca. Só entra o que tem post.
ASSUNTOS = [
    "pavimentação", "asfalto", "saúde", "hospital", "autismo", "APAE",
    "dragagem", "molhes", "enrocamento", "BR-101", "SC-370", "ponte",
    "creche", "escola", "ginásio", "quadra", "ambulância", "equoterapia",
    "bombeiros", "polícia", "trator", "agricultura", "emenda", "ultrassom",
]
MUNICIPIOS = [
    "Tubarão", "Laguna", "Braço do Norte", "Capivari", "Sangão", "Gravatal",
    "Garopaba", "Jaguaruna", "Paulo Lopes", "Pescaria Brava", "Orleans",
    "Içara", "Criciúma", "Imbituba", "Armazém", "São Ludgero", "Treze de Maio",
    "Ituporanga", "Urubici", "Araranguá",
]


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower()


def n(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def main():
    linhas = list(csv.DictReader(ENTRADA.open(encoding="utf-8-sig")))

    posts = []
    for r in linhas:
        posts.append({
            "d": r["data"],
            "r": r["redes"],
            "t": r["tipo"],
            "u": r["link"],
            "uf": r["link_facebook"],
            "cu": n(r["curtidas"]),
            "co": n(r["comentarios"]),
            "en": n(r["engajamento"]),
            "al": n(r["alcance"]),
            "vi": n(r["visualizacoes"]),
            "sa": n(r["salvamentos"]),
            "sg": n(r["novos_seguidores"]),
            "l": r["legenda"],
        })

    corpo_busca = [sem_acento(p["l"]) for p in posts]

    def conta(termo):
        alvo = sem_acento(termo)
        return sum(1 for t in corpo_busca if alvo in t)

    atalhos_assunto = [(a, conta(a)) for a in ASSUNTOS]
    atalhos_assunto = sorted([x for x in atalhos_assunto if x[1] >= 3], key=lambda x: -x[1])
    atalhos_cidade = [(m, conta(m)) for m in MUNICIPIOS]
    atalhos_cidade = sorted([x for x in atalhos_cidade if x[1] >= 3], key=lambda x: -x[1])

    anos = sorted({p["d"][:4] for p in posts}, reverse=True)
    com_metrica = sum(1 for p in posts if p["al"])
    datas = sorted(p["d"] for p in posts)

    textura_uri = ""
    if TEXTURA.exists():
        b64 = base64.b64encode(TEXTURA.read_bytes()).decode()
        textura_uri = f"url('data:image/svg+xml;base64,{b64}')"

    html = TEMPLATE
    for marcador, valor in [
        ("/*TEXTURA*/", textura_uri or "none"),
        ("/*POSTS*/", json.dumps(posts, ensure_ascii=False, separators=(",", ":"))),
        ("/*ASSUNTOS*/", json.dumps(atalhos_assunto, ensure_ascii=False)),
        ("/*CIDADES*/", json.dumps(atalhos_cidade, ensure_ascii=False)),
        ("/*ANOS*/", json.dumps(anos)),
        ("__TOTAL__", str(len(posts))),
        ("__METRICA__", str(com_metrica)),
        ("__INICIO__", datas[0]),
        ("__FIM__", datas[-1]),
    ]:
        html = html.replace(marcador, valor)

    SAIDA.write_text(html, encoding="utf-8")

    # o Artifact embrulha o arquivo no próprio esqueleto, então vai só o miolo
    miolo = html
    for corte in ["<!doctype html>", '<html lang="pt-BR">', "<head>", "</head>",
                  "<body>", "</body>", "</html>", '<meta charset="utf-8">',
                  '<meta name="viewport" content="width=device-width, initial-scale=1">']:
        miolo = miolo.replace(corte, "")
    SAIDA_ARTIFACT.write_text(miolo.strip() + "\n", encoding="utf-8")

    kb = SAIDA.stat().st_size / 1024
    print(f"✔ {SAIDA}  ({kb:.0f} KB, {len(posts)} posts)")
    print(f"✔ {SAIDA_ARTIFACT}  (mesma página, para publicar)")
    print(f"  atalhos: {len(atalhos_assunto)} assuntos, {len(atalhos_cidade)} municípios")


TEMPLATE = r"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Acervo de Posts do Mandato</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&display=swap">
<style>
:root{
  --azul-foco:#0082BF; --navy:#123F68; --navy-escuro:#12314F;
  --abismo:#0E1E46; --tinta:#061A3A;
  --azul-claro:#8BC1DC; --amarelo:#FFC400; --laranja:#FF9C33; --verde:#00B171;
  --grad-fundo:radial-gradient(120% 130% at 18% 0%,
    #0082BF 0%, #006A9E 22%, #045E8D 38%, #12456D 56%,
    #10365F 70%, #0E2D53 82%, #0F264B 91%, #0E1E46 100%);
  --fonte:"Archivo","Helvetica Neue",Arial,sans-serif;
  --borda:color-mix(in srgb, var(--azul-claro) 22%, transparent);
  --ficha:color-mix(in srgb, var(--tinta) 62%, transparent);
  --raio:6px;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0; min-height:100vh; font-family:var(--fonte); color:#fff;
  background:var(--abismo); background-image:var(--grad-fundo);
  background-attachment:fixed;
  -webkit-font-smoothing:antialiased;
}
body::before{
  content:""; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-color:#fff; opacity:.07;
  -webkit-mask-image:/*TEXTURA*/; mask-image:/*TEXTURA*/;
  -webkit-mask-size:308px 491px; mask-size:308px 491px;
}
.pagina{position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:0 20px 80px}

/* ── cabeçalho ─────────────────────────────────────────── */
header{padding:56px 0 28px}
.eyebrow{
  font-size:12px; letter-spacing:.18em; text-transform:uppercase;
  color:var(--azul-claro); font-weight:600; margin:0 0 10px;
}
h1{
  font-family:var(--fonte); font-stretch:125%; font-weight:900;
  font-size:clamp(30px,5.2vw,52px); line-height:1.02; margin:0;
  text-wrap:balance; text-transform:uppercase;
}
.sub{
  margin:14px 0 0; max-width:62ch; color:var(--azul-claro);
  font-size:15px; line-height:1.6;
}
.sub b{color:#fff; font-weight:700}

/* ── busca ─────────────────────────────────────────────── */
.busca-caixa{
  position:sticky; top:0; z-index:5; margin-top:26px;
  padding:14px 20px 14px; margin-inline:-20px;
  background:color-mix(in srgb, var(--abismo) 72%, transparent);
  -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px);
}
.campo{position:relative; display:flex; align-items:center}
.campo svg{position:absolute; left:16px; width:19px; height:19px; opacity:.55; pointer-events:none}
#q{
  width:100%; padding:15px 92px 15px 46px; font-family:var(--fonte); font-size:17px;
  color:#fff; background:color-mix(in srgb, var(--tinta) 80%, transparent);
  border:1.5px solid var(--borda); border-radius:var(--raio); outline:none;
}
#q::placeholder{color:color-mix(in srgb, var(--azul-claro) 70%, transparent)}
#q:focus{border-color:var(--amarelo); box-shadow:0 0 0 3px color-mix(in srgb, var(--amarelo) 25%, transparent)}
.limpar{
  position:absolute; right:14px; background:none; border:0; color:var(--azul-claro);
  font-family:var(--fonte); font-size:13px; cursor:pointer; padding:8px 10px; border-radius:4px;
}
.limpar:hover{color:#fff; background:color-mix(in srgb, var(--azul-claro) 14%, transparent)}
.limpar:focus-visible{outline:2px solid var(--amarelo); outline-offset:2px}

/* ── atalhos ───────────────────────────────────────────── */
.atalhos{display:flex; flex-direction:column; gap:10px; margin:18px 0 4px}
.trilha{display:flex; align-items:baseline; gap:10px; flex-wrap:wrap}
.trilha > span{
  font-size:11px; letter-spacing:.14em; text-transform:uppercase;
  color:color-mix(in srgb, var(--azul-claro) 75%, transparent);
  min-width:82px; font-weight:600;
}
.chip{
  font-family:var(--fonte); font-size:13px; padding:5px 11px; cursor:pointer;
  color:var(--azul-claro); background:color-mix(in srgb, var(--tinta) 55%, transparent);
  border:1px solid var(--borda); border-radius:100px; transition:.12s;
}
.chip b{font-variant-numeric:tabular-nums; opacity:.6; font-weight:400; margin-left:5px}
.chip:hover{color:#fff; border-color:var(--azul-claro)}
.chip[aria-pressed="true"]{background:var(--amarelo); color:var(--tinta); border-color:var(--amarelo); font-weight:700}
.chip[aria-pressed="true"] b{opacity:.65; color:var(--tinta)}
.chip:focus-visible{outline:2px solid var(--amarelo); outline-offset:2px}

/* ── filtros ───────────────────────────────────────────── */
.filtros{
  display:flex; flex-wrap:wrap; gap:18px 26px; align-items:center;
  padding:16px 0; margin-top:12px; border-top:1px solid var(--borda);
  border-bottom:1px solid var(--borda);
}
.grupo{display:flex; align-items:center; gap:8px}
.grupo label{font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--azul-claro); font-weight:600}
select{
  font-family:var(--fonte); font-size:14px; color:#fff; padding:7px 10px;
  background:var(--navy-escuro); border:1px solid var(--borda); border-radius:4px; cursor:pointer;
}
select:focus-visible{outline:2px solid var(--amarelo); outline-offset:1px}
.contador{margin-left:auto; font-size:14px; color:var(--azul-claro); font-variant-numeric:tabular-nums}
.contador b{color:var(--amarelo); font-weight:700; font-size:17px}

/* ── lista ─────────────────────────────────────────────── */
.lista{display:flex; flex-direction:column; gap:1px; margin-top:2px}
.ficha{
  display:grid; grid-template-columns:132px 1fr; gap:22px;
  padding:22px 4px; border-bottom:1px solid color-mix(in srgb, var(--azul-claro) 12%, transparent);
}
.ficha:hover{background:var(--ficha)}
.lado{display:flex; flex-direction:column; gap:9px}
.data{font-variant-numeric:tabular-nums; font-size:15px; font-weight:700; letter-spacing:.01em}
.selos{display:flex; flex-wrap:wrap; gap:5px}
.selo{
  font-size:10px; letter-spacing:.1em; text-transform:uppercase; font-weight:700;
  padding:3px 7px; border-radius:3px; white-space:nowrap;
}
.selo.reels{background:var(--laranja); color:var(--tinta)}
.selo.feed{background:var(--azul-claro); color:var(--tinta)}
.selo.post{background:color-mix(in srgb, var(--azul-claro) 30%, transparent); color:#fff}
.selo.ambas{background:var(--verde); color:var(--tinta)}
.metricas{display:flex; flex-direction:column; gap:3px; margin-top:3px}
.metrica{display:flex; justify-content:space-between; gap:10px; font-size:12.5px; line-height:1.5}
.metrica span{color:color-mix(in srgb, var(--azul-claro) 85%, transparent)}
.metrica b{font-variant-numeric:tabular-nums; font-weight:700}
.metrica.destaque b{color:var(--amarelo)}
.sem-dado{font-size:11.5px; color:color-mix(in srgb, var(--azul-claro) 55%, transparent); line-height:1.4; margin-top:2px}

.corpo{min-width:0}
.legenda{
  margin:0; font-size:15px; line-height:1.62; white-space:pre-wrap;
  overflow-wrap:anywhere; max-width:68ch;
}
.legenda mark{background:var(--amarelo); color:var(--tinta); padding:0 2px; border-radius:2px; font-weight:700}
.dobra{
  display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden;
}
.acoes{display:flex; flex-wrap:wrap; gap:8px; margin-top:14px}
.acao{
  font-family:var(--fonte); font-size:12.5px; font-weight:600; cursor:pointer;
  padding:6px 12px; border-radius:4px; text-decoration:none; white-space:nowrap;
  color:var(--azul-claro); background:none; border:1px solid var(--borda); transition:.12s;
}
.acao:hover{color:#fff; border-color:var(--azul-claro)}
.acao:focus-visible{outline:2px solid var(--amarelo); outline-offset:2px}
.acao.principal{background:var(--amarelo); color:var(--tinta); border-color:var(--amarelo)}
.acao.principal:hover{background:#fff; border-color:#fff; color:var(--tinta)}

.vazio{padding:70px 0; text-align:center; color:var(--azul-claro); font-size:16px; line-height:1.7}
.mais{display:block; margin:32px auto 0; padding:13px 30px; font-family:var(--fonte);
  font-size:14px; font-weight:700; cursor:pointer; color:var(--tinta);
  background:var(--amarelo); border:0; border-radius:var(--raio);
}
.mais:hover{background:#fff}
.mais:focus-visible{outline:2px solid #fff; outline-offset:3px}

footer{
  margin-top:56px; padding-top:26px; border-top:1px solid var(--borda);
  font-size:13px; line-height:1.7; color:color-mix(in srgb, var(--azul-claro) 88%, transparent);
  max-width:74ch;
}
footer b{color:#fff}
footer code{
  font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px;
  background:color-mix(in srgb, var(--tinta) 70%, transparent); padding:1px 5px; border-radius:3px;
}
@media (max-width:720px){
  .ficha{grid-template-columns:1fr; gap:12px}
  .lado{flex-direction:row; flex-wrap:wrap; align-items:center; gap:10px}
  .metricas{flex-direction:row; flex-wrap:wrap; gap:12px; width:100%}
  .metrica{gap:6px}
  .trilha > span{min-width:100%}
  .contador{margin-left:0; width:100%}
}
@media (prefers-reduced-motion:reduce){*{transition:none !important; scroll-behavior:auto}}
</style>
</head>
<body>
<div class="pagina">

<header>
  <p class="eyebrow">Redes do mandato · Instagram e Facebook</p>
  <h1>Acervo de posts</h1>
  <p class="sub">Tudo que foi publicado entre <b>__INICIO__</b> e <b>__FIM__</b>:
  <b>__TOTAL__ posts</b> com legenda inteira, link e engajamento. Busque o assunto,
  pegue o link, cite no site. Alcance e visualizações existem em <b>__METRICA__</b> deles.</p>
</header>

<div class="busca-caixa">
  <div class="campo">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>
    </svg>
    <input id="q" type="search" autocomplete="off" spellcheck="false"
      placeholder="Buscar na legenda: ginásio de Sangão, enrocamento, SC-370, autismo...">
    <button class="limpar" id="limpar" hidden>limpar</button>
  </div>
</div>

<div class="atalhos">
  <div class="trilha" id="chips-assunto"><span>Assuntos</span></div>
  <div class="trilha" id="chips-cidade"><span>Municípios</span></div>
</div>

<div class="filtros">
  <div class="grupo"><label for="f-ano">Ano</label>
    <select id="f-ano"><option value="">todos</option></select></div>
  <div class="grupo"><label for="f-rede">Rede</label>
    <select id="f-rede">
      <option value="">todas</option>
      <option value="instagram">Instagram</option>
      <option value="facebook">Facebook</option>
      <option value="ambas">nas duas</option>
    </select></div>
  <div class="grupo"><label for="f-tipo">Formato</label>
    <select id="f-tipo">
      <option value="">todos</option>
      <option value="REELS">Reels</option>
      <option value="FEED">Feed</option>
      <option value="post">post do Facebook</option>
    </select></div>
  <div class="grupo"><label for="f-ordem">Ordenar</label>
    <select id="f-ordem">
      <option value="data">mais recentes</option>
      <option value="antigos">mais antigos</option>
      <option value="engajamento">maior engajamento</option>
      <option value="alcance">maior alcance</option>
    </select></div>
  <p class="contador" id="contador"></p>
</div>

<div class="lista" id="lista"></div>
<button class="mais" id="mais" hidden>Mostrar mais</button>

<footer>
  <p>Extraído da Graph API da Meta em <b>01/09/2026</b>. Curtidas e comentários vêm da
  API; alcance, visualizações, salvamentos e novos seguidores vêm dos exports do
  Business Suite, que só cobrem parte do período, por isso nem todo post traz esses números.</p>
  <p>Post que saiu no Instagram e no Facebook aparece aqui uma vez só, com os dois links.
  Para regerar depois de uma extração nova: <code>python3 consolidar_posts.py</code>,
  <code>python3 enriquecer_metricas.py</code> e <code>python3 gerar_documento.py</code>.
  Detalhes em <code>README_posts_conteudo.md</code>.</p>
</footer>

</div>

<script>
const POSTS = /*POSTS*/;
const ASSUNTOS = /*ASSUNTOS*/;
const CIDADES = /*CIDADES*/;
const ANOS = /*ANOS*/;
const LOTE = 40;

const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
POSTS.forEach(p => { p._b = semAcento(p.l); });

const el = (id) => document.getElementById(id);
const q = el("q"), lista = el("lista"), contador = el("contador"), btnMais = el("mais"), btnLimpar = el("limpar");
let visiveis = LOTE, filtrados = [];

// atalhos
function montaChips(alvo, itens) {
  const trilha = el(alvo);
  itens.forEach(([termo, n]) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = termo + " <b>" + n + "</b>";
    b.onclick = () => { q.value = (q.value.trim().toLowerCase() === termo.toLowerCase()) ? "" : termo; aplica(); };
    trilha.appendChild(b);
  });
}
montaChips("chips-assunto", ASSUNTOS);
montaChips("chips-cidade", CIDADES);
ANOS.forEach(a => { const o = document.createElement("option"); o.value = o.textContent = a; el("f-ano").appendChild(o); });

const fmt = (v) => v == null ? "" : v.toLocaleString("pt-BR");
const dataBR = (d) => { const [a, m, x] = d.split("-"); return x + "/" + m + "/" + a; };

function selo(p) {
  const t = p.t === "REELS" ? ["reels", "Reels"] : p.t === "FEED" ? ["feed", "Feed"] : ["post", "Facebook"];
  let html = '<span class="selo ' + t[0] + '">' + t[1] + "</span>";
  if (p.r.includes("+")) html += '<span class="selo ambas">nas duas</span>';
  return html;
}

function destaca(texto, termo) {
  if (!termo) return escapa(texto);
  const alvo = semAcento(termo), base = semAcento(texto);
  let saida = "", i = 0, j;
  while ((j = base.indexOf(alvo, i)) !== -1) {
    saida += escapa(texto.slice(i, j)) + "<mark>" + escapa(texto.slice(j, j + alvo.length)) + "</mark>";
    i = j + alvo.length;
  }
  return saida + escapa(texto.slice(i));
}
const escapa = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function metricas(p) {
  const linhas = [];
  if (p.en != null) linhas.push(['<div class="metrica destaque"><span>engajamento</span><b>' + fmt(p.en) + "</b></div>"]);
  if (p.cu != null) linhas.push(['<div class="metrica"><span>curtidas</span><b>' + fmt(p.cu) + "</b></div>"]);
  if (p.co != null) linhas.push(['<div class="metrica"><span>comentários</span><b>' + fmt(p.co) + "</b></div>"]);
  if (p.al) linhas.push(['<div class="metrica"><span>alcance</span><b>' + fmt(p.al) + "</b></div>"]);
  if (p.vi) linhas.push(['<div class="metrica"><span>views</span><b>' + fmt(p.vi) + "</b></div>"]);
  if (p.sa) linhas.push(['<div class="metrica"><span>salvou</span><b>' + fmt(p.sa) + "</b></div>"]);
  // a ausência de alcance é a regra em boa parte do período e está explicada no
  // rodapé; repetir a nota em toda ficha só polui a lista
  let html = '<div class="metricas">' + linhas.join("") + "</div>";
  if (p.en == null) html += '<p class="sem-dado">só no Facebook, sem curtidas pela API</p>';
  return html;
}

function ficha(p, termo) {
  const longa = p.l.length > 420;
  const d = document.createElement("article");
  d.className = "ficha";
  d.innerHTML =
    '<div class="lado"><div class="data">' + dataBR(p.d) + "</div>" +
    '<div class="selos">' + selo(p) + "</div>" + metricas(p) + "</div>" +
    '<div class="corpo"><p class="legenda' + (longa && !termo ? " dobra" : "") + '">' +
    (p.l.trim() ? destaca(p.l, termo) : "<em>post sem legenda</em>") + "</p>" +
    '<div class="acoes">' +
    (longa && !termo ? '<button class="acao" data-abrir>Ler tudo</button>' : "") +
    '<a class="acao principal" href="' + p.u + '" target="_blank" rel="noopener">Abrir post</a>' +
    (p.uf ? '<a class="acao" href="' + p.uf + '" target="_blank" rel="noopener">no Facebook</a>' : "") +
    '<button class="acao" data-copiar="' + p.u + '">Copiar link</button>' +
    "</div></div>";

  const abrir = d.querySelector("[data-abrir]");
  if (abrir) abrir.onclick = () => { d.querySelector(".legenda").classList.remove("dobra"); abrir.remove(); };
  d.querySelector("[data-copiar]").onclick = (e) => {
    navigator.clipboard.writeText(e.target.dataset.copiar).then(() => {
      const antes = e.target.textContent;
      e.target.textContent = "Copiado";
      setTimeout(() => { e.target.textContent = antes; }, 1400);
    });
  };
  return d;
}

function aplica() {
  const termo = q.value.trim();
  const alvo = semAcento(termo);
  const ano = el("f-ano").value, rede = el("f-rede").value, tipo = el("f-tipo").value, ordem = el("f-ordem").value;

  filtrados = POSTS.filter(p => {
    if (alvo && !p._b.includes(alvo)) return false;
    if (ano && p.d.slice(0, 4) !== ano) return false;
    if (rede === "ambas" && !p.r.includes("+")) return false;
    if (rede && rede !== "ambas" && !p.r.includes(rede)) return false;
    if (tipo && p.t !== tipo) return false;
    return true;
  });

  const chave = {engajamento: "en", alcance: "al"}[ordem];
  if (chave) filtrados.sort((a, b) => (b[chave] || 0) - (a[chave] || 0));
  else filtrados.sort((a, b) => ordem === "antigos" ? a.d.localeCompare(b.d) : b.d.localeCompare(a.d));

  visiveis = LOTE;
  btnLimpar.hidden = !termo;
  document.querySelectorAll(".chip").forEach(c => {
    const nome = c.textContent.replace(/\s*\d+\s*$/, "").trim();
    c.setAttribute("aria-pressed", String(semAcento(nome) === alvo && alvo !== ""));
  });
  desenha();
}

function desenha() {
  lista.innerHTML = "";
  const termo = q.value.trim();
  if (!filtrados.length) {
    lista.innerHTML = '<p class="vazio">Nenhum post com esse termo.<br>Tente uma palavra mais curta, ou o nome do município.</p>';
    contador.innerHTML = "";
    btnMais.hidden = true;
    return;
  }
  const frag = document.createDocumentFragment();
  filtrados.slice(0, visiveis).forEach(p => frag.appendChild(ficha(p, termo)));
  lista.appendChild(frag);
  const n = filtrados.length;
  contador.innerHTML = "<b>" + n + "</b> " + (n === 1 ? "post" : "posts") +
    (n > visiveis ? " · mostrando " + visiveis : "");
  btnMais.hidden = n <= visiveis;
}

q.addEventListener("input", aplica);
btnLimpar.onclick = () => { q.value = ""; q.focus(); aplica(); };
["f-ano", "f-rede", "f-tipo", "f-ordem"].forEach(id => el(id).addEventListener("change", aplica));
btnMais.onclick = () => { visiveis += LOTE; desenha(); btnMais.scrollIntoView({block: "center"}); };
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== q) { e.preventDefault(); q.focus(); }
});
aplica();
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
