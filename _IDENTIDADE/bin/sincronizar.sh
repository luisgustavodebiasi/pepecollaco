#!/usr/bin/env bash
# Copia os derivados de dist/ para os três apps e grava um manifesto de hashes.
#
# Os apps são repositórios git independentes — não há monorepo e não dá para
# importar entre eles. Então a identidade é vendorizada: cada app recebe uma
# cópia, e o manifesto permite que verificar.sh acuse divergência depois.
#
#   ./sincronizar.sh site | credenciamento | gerador | all
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="$(cd "$RAIZ/.." && pwd)"
DIST="$RAIZ/dist"
VERSAO="$(cat "$RAIZ/VERSAO")"

SITE="$BASE/pepecollaco-site"
CRED="$BASE/PEPECOPY/credenciamento-next"
GER="$BASE/gerador-materiais"

[ -d "$DIST/marca" ] || { echo "erro: dist/ vazio — rode ./bin/gerar-assets.sh antes" >&2; exit 1; }

manifesto () {                   # $1 = raiz do app   $2 = subpasta de marca
  VERSAO="$VERSAO" python3 - "$1/$2" <<'PY'
import hashlib, json, os, sys
from pathlib import Path

pasta = Path(sys.argv[1])
arquivos = {}
for f in sorted(pasta.rglob("*")):
    if not f.is_file() or f.name == "MANIFESTO.json":
        continue
    h = hashlib.sha256(f.read_bytes()).hexdigest()
    arquivos[str(f.relative_to(pasta))] = h

destino = pasta / "MANIFESTO.json"
destino.write_text(
    json.dumps(
        {"versao": os.environ["VERSAO"], "origem": "_IDENTIDADE/dist", "arquivos": arquivos},
        indent=2, ensure_ascii=False,
    ) + "\n",
    encoding="utf-8",
)
print(f"  manifesto: {len(arquivos)} arquivos")
PY
}

cabecalho_css () {               # injeta aviso de arquivo gerado
  local arq="$1"
  local tmp; tmp="$(mktemp)"
  {
    echo "/* GERADO por _IDENTIDADE v$VERSAO — não edite aqui."
    echo "   Edite _IDENTIDADE/src/ e rode ./bin/sincronizar.sh */"
    cat "$arq"
  } > "$tmp"
  mv "$tmp" "$arq"
}

# Nos apps Next o CSS é emitido em .next/static/css/, então caminho relativo
# não resolve — e pior: o Turbopack tenta resolver o url() como módulo em
# tempo de build e falha. Reescreve para o caminho servido do public/.
absolutiza_urls () {
  local arq="$1"
  perl -pi -e 's{url\("\.\./([^"]+)"\)}{url("/brand/$1")}g' "$arq"
}

sync_site () {
  echo "→ site (pepecollaco-site)"
  [ -d "$SITE" ] || { echo "  aviso: $SITE não existe, pulando"; return; }
  local destino="$SITE/assets/brand"
  rm -rf "$destino"
  mkdir -p "$destino"/{marca,simbolo,textura,foto,fontes,css}

  # Navegador só precisa de WebP. Os PNG equivalentes ficam de fora: são 6x mais
  # pesados e o site é servido pelo GitHub Pages, onde cada MB é banda de eleitor.
  cp "$DIST"/marca/*.webp                    "$destino/marca/"
  cp "$DIST"/simbolo/*.svg                   "$destino/simbolo/"
  cp "$DIST"/simbolo/seta-{128,256}.webp     "$destino/simbolo/"
  cp "$DIST"/simbolo/favicon-32.png "$DIST"/simbolo/favicon-512.png \
     "$DIST"/simbolo/apple-touch-icon.png    "$destino/simbolo/"
  cp "$DIST"/textura/*.svg                   "$destino/textura/"
  cp "$DIST"/foto/*.webp                     "$destino/foto/"
  cp "$DIST"/fontes/*.woff2                  "$destino/fontes/"
  cp "$DIST"/css/*.css                       "$destino/css/"
  # cartão de compartilhamento: é o que o WhatsApp mostra ao colar o link
  [ -f "$DIST/og-11223.jpg" ] && cp "$DIST/og-11223.jpg" "$destino/"
  if compgen -G "$DIST/css/compat/*.css" > /dev/null; then
    mkdir -p "$destino/css/compat" && cp "$DIST"/css/compat/*.css "$destino/css/compat/"
  fi

  cabecalho_css "$destino/css/tokens.css"
  cp "$RAIZ/CLAUDE.md" "$SITE/IDENTIDADE.md"
  manifesto "$SITE" "assets/brand"
}

sync_credenciamento () {
  echo "→ credenciamento (time.pepecollaco.com)"
  [ -d "$CRED" ] || { echo "  aviso: $CRED não existe, pulando"; return; }
  local destino="$CRED/public/brand"
  rm -rf "$destino"
  mkdir -p "$destino"/{marca,simbolo,textura,foto,fontes,fundo}

  # WebP para o navegador; PNG só nos tamanhos que o Satori consome ao gerar as
  # open-graph images, porque ele decodifica PNG e JPEG, mas não WebP.
  cp "$DIST"/marca/*.webp        "$destino/marca/"
  cp "$DIST"/marca/*-960.png     "$destino/marca/"
  cp "$DIST"/simbolo/*.svg "$DIST"/simbolo/*.webp "$DIST"/simbolo/*.png "$destino/simbolo/"
  cp "$DIST"/textura/*.svg       "$destino/textura/"
  cp "$DIST"/foto/*.webp         "$destino/foto/"
  # o busto em PNG é o que o Satori consegue compor nas open-graph
  cp "$DIST"/foto/pepe-busto-900.png "$destino/foto/"
  # o fundo da agência em JPEG, pelo mesmo motivo: o Satori não lê WebP, e sem
  # este arquivo o cartão de compartilhamento cai num degradê aproximado em
  # código, sem a textura de setas nem o foco de luz do original
  cp "$DIST"/fundo/fundo-og-1200.jpg "$destino/fundo/"
  # As webfonts precisam ser SERVIDAS: o @font-face de globals.css aponta para
  # /brand/fontes/*.woff2. Sem isto o navegador leva 404 e cai no fallback do
  # sistema — o app fica com a cara errada sem nenhum erro de build.
  cp "$DIST"/fontes/*.woff2      "$destino/fontes/"

  # tokens vão para app/brand/ porque são importados pelo globals.css, não servidos
  mkdir -p "$CRED/app/brand"
  cp "$DIST/css/tokens.css" "$DIST/css/tipografia.css" "$CRED/app/brand/"
  cabecalho_css "$CRED/app/brand/tokens.css"
  absolutiza_urls "$CRED/app/brand/tokens.css"
  absolutiza_urls "$CRED/app/brand/tipografia.css"

  # Satori (open-graph images) não lê woff2; precisa dos .otf fora do public/
  mkdir -p "$CRED/assets"
  cp "$DIST"/fontes/*.otf "$CRED/assets/"

  cp "$RAIZ/CLAUDE.md" "$CRED/IDENTIDADE.md"
  manifesto "$CRED" "public/brand"
}

sync_gerador () {
  echo "→ gerador de materiais"
  [ -d "$GER" ] || { echo "  aviso: $GER não existe, pulando"; return; }
  # Único que recebe os PNG em resolução cheia: as peças vão para gráfica, e ali
  # 1600 px e o retrato de 2400 px são o mínimo para não pixelar em grande formato.
  local destino="$GER/public/brand"
  rm -rf "$destino"
  mkdir -p "$destino"
  cp -R "$DIST"/{marca,simbolo,textura,foto,fundo} "$destino/"
  # servidas em /brand/fontes, que é o caminho que o @font-face pede
  mkdir -p "$destino/fontes"
  cp "$DIST"/fontes/*.woff2 "$destino/fontes/"

  # o worker renderiza em Chromium headless e já resolvia as suas fontes de
  # public/fonts (Anton, Barlow); as Acumin ficam ao lado para não quebrar
  # nenhum template que use esse caminho
  mkdir -p "$GER/public/fonts"
  cp "$DIST"/fontes/*.woff2 "$GER/public/fonts/"

  mkdir -p "$GER/app/brand"
  cp "$DIST/css/tokens.css" "$DIST/css/tipografia.css" "$GER/app/brand/"
  cabecalho_css "$GER/app/brand/tokens.css"
  absolutiza_urls "$GER/app/brand/tokens.css"
  absolutiza_urls "$GER/app/brand/tipografia.css"

  cp "$RAIZ/CLAUDE.md" "$GER/IDENTIDADE.md"
  manifesto "$GER" "public/brand"
}

case "${1:-all}" in
  site)            sync_site ;;
  credenciamento)  sync_credenciamento ;;
  gerador)         sync_gerador ;;
  all)             sync_site; sync_credenciamento; sync_gerador ;;
  *) echo "uso: $0 [site|credenciamento|gerador|all]" >&2; exit 1 ;;
esac

echo
echo "identidade v$VERSAO sincronizada"
