#!/usr/bin/env bash
# Gera todos os derivados web da identidade a partir dos originais em "_ARTE /".
#
# Os originais (PNG de 8000 px, .ai, .psd) nunca entram em repositório: são
# grandes demais e não é deles que o navegador precisa. Este script é a ponte.
# Rodar de novo é idempotente — sempre reconstrói dist/ do zero.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTE="${ARTE_SRC:-/Users/luisgustavodebiasi/TRABALHOS/Projetos Externo/PEPE/_ARTE }"
DIST="$RAIZ/dist"

[ -d "$ARTE" ] || { echo "erro: não achei a arte em '$ARTE'" >&2; exit 1; }
command -v magick >/dev/null || { echo "erro: ImageMagick (magick) não instalado" >&2; exit 1; }

# A agência marcou uma foto como proibida no próprio nome do arquivo. Se ela
# aparecer em qualquer origem daqui, é erro de quem editou o script, não do dia.
guard_foto_proibida () {
  case "$1" in
    *"NÃO USAR"*|*"NAO USAR"*)
      echo "erro: '$1' está marcado como proibido pela agência" >&2; exit 1 ;;
  esac
}

mkdir -p "$DIST"/{marca,simbolo,textura,foto,fundo,fontes,css}

# ── Lockups da marca ────────────────────────────────────────────────────────
# -trim recorta a moldura transparente (os originais têm ~40% de folga em volta)
# e +repage descarta o offset, senão ele reaparece no arquivo final.
marca () {                       # $1 = arquivo de origem   $2 = nome de saída
  local origem="$ARTE/$1" nome="$2"
  guard_foto_proibida "$1"
  [ -f "$origem" ] || { echo "  aviso: '$1' não existe, pulando"; return; }

  local base="$DIST/marca/$nome"
  magick "$origem" -trim +repage -filter Lanczos -resize 1600x \
    -strip -define png:compression-level=9 "${base}-1600.png"

  for w in 480 960; do
    magick "${base}-1600.png" -filter Lanczos -resize ${w}x -strip \
      -define png:compression-level=9 "${base}-${w}.png"
  done
  for w in 480 960 1600; do
    magick "${base}-${w}.png" -quality 88 -define webp:method=6 \
      -define webp:alpha-quality=100 "${base}-${w}.webp"
  done

  printf "  %-28s %s  (%s KB webp @960)\n" "$nome" \
    "$(magick identify -format '%wx%h' "${base}-1600.png")" \
    "$(( $(stat -f%z "${base}-960.webp") / 1024 ))"
}

echo "Marcas…"
marca "Pepe_MarcaVote_ComNumero_FundoClaro_v00.png"          "vote-11223-claro"
marca "Pepe_MarcaVote_ComNumero_FundoEscuro_v00.png"         "vote-11223-escuro"
marca "Pepe_MarcaPRioritariaComNumero_FundoClaro_v00.png"    "collaco-11223-claro"
marca "Pepe_MarcaPRioritariaComNumero_FundoEscuro_v00.png"   "collaco-11223-escuro"
marca "Pepe_MarcaVote_FundoEscuro_v00.png"                   "reduzida-escuro"
marca "QUEM FAZ REPRESENTA.png"                              "federacao-uniao-progressista"
# A mesma assinatura na versão colorida, sem a linha da federação. A original
# veio da agência achatada em RGB, com o xadrez de transparência gravado no
# arquivo; o PNG aqui já é a versão com alfa restaurado e a mistura com o
# branco desfeita, senão as letras saem com franja clara sobre o azul.
marca "QUEM FAZ REPRESENTA COLORIDO.png"                     "quem-faz-colorido"

# ── Símbolo colorido ────────────────────────────────────────────────────────
# Raster porque o símbolo é uma ilustração 3D com degradê de malha; as versões
# vetoriais monocromáticas saem de gerar-vetores.py.
echo "Símbolo…"
magick "$ARTE/Pepe_Simbolo_SetaAmarela_v00.png" -trim +repage -filter Lanczos \
  -resize 512x -strip -define png:compression-level=9 "$DIST/simbolo/seta-512.png"
for w in 128 256; do
  magick "$DIST/simbolo/seta-512.png" -filter Lanczos -resize ${w}x -strip \
    -define png:compression-level=9 "$DIST/simbolo/seta-${w}.png"
done
for w in 128 256 512; do
  magick "$DIST/simbolo/seta-${w}.png" -quality 92 -define webp:method=6 \
    -define webp:alpha-quality=100 "$DIST/simbolo/seta-${w}.webp"
done
printf "  seta colorida                %s KB (webp @256)\n" \
  "$(( $(stat -f%z "$DIST/simbolo/seta-256.webp") / 1024 ))"

# Favicon: fundo tinta com a seta amarela, quadrado, com respiro nas laterais.
magick -size 512x512 "xc:#061A3A" \
  \( "$DIST/simbolo/seta-512.png" -resize 340x \) -gravity center -composite \
  -strip "$DIST/simbolo/favicon-512.png"
magick "$DIST/simbolo/favicon-512.png" -resize 180x180 "$DIST/simbolo/apple-touch-icon.png"
magick "$DIST/simbolo/favicon-512.png" -resize 32x32 "$DIST/simbolo/favicon-32.png"
magick "$DIST/simbolo/favicon-32.png" \
  \( -clone 0 -resize 16x16 \) -delete 0 "$DIST/simbolo/favicon.ico" 2>/dev/null || true

# ── Retrato ─────────────────────────────────────────────────────────────────
# Em Python, não no magick: o recorte precisa de erosão de alpha para tirar a
# franja de fundo branco que sobrou nas bordas, e isso pede controle de kernel.
echo "Retrato…"
FOTO="FOTO PEPE.png"
guard_foto_proibida "$FOTO"
magick "$ARTE/$FOTO" -trim +repage -filter Lanczos -resize x2400 -strip \
  -define png:compression-level=9 "$DIST/foto/_tmp.png"
python3 "$RAIZ/bin/preparar_foto.py" "$DIST/foto/_tmp.png"
rm -f "$DIST/foto/_tmp.png"

# ── Fundo ───────────────────────────────────────────────────────────────────
# O fundo do site é CSS (ver --grad-fundo em tokens.css). Este arquivo existe só
# como imagem de compartilhamento e fallback de e-mail, onde gradiente não vale.
echo "Fundo…"
magick "$ARTE/FUNDO HORIZONTAL.png" -filter Lanczos -resize 1920x -strip \
  -quality 82 -define webp:method=6 "$DIST/fundo/fundo-1920.webp"
printf "  fundo fallback               %s KB\n" \
  "$(( $(stat -f%z "$DIST/fundo/fundo-1920.webp") / 1024 ))"

# O mesmo fundo em JPEG, já no formato exato do cartão de compartilhamento.
# Existe porque o Satori (open-graph do credenciamento) decodifica JPEG e PNG,
# nunca WebP: sem este arquivo a peça cai num degradê aproximado em código, que
# não tem a textura de setas nem o foco de luz do original da agência.
# O corte é `^` com gravidade central: o fundo é 2,33:1 e o cartão 1,90:1, então
# sobra largura, e sobrar largura é o lado certo de sobrar num fundo cuja luz
# nasce à esquerda.
magick "$ARTE/FUNDO HORIZONTAL.png" -filter Lanczos -resize 1200x630^ \
  -gravity center -extent 1200x630 -strip -quality 88 -sampling-factor 4:2:0 \
  "$DIST/fundo/fundo-og-1200.jpg"
printf "  fundo do cartão              %s KB (%s)\n" \
  "$(( $(stat -f%z "$DIST/fundo/fundo-og-1200.jpg") / 1024 ))" \
  "$(magick identify -format '%wx%h' "$DIST/fundo/fundo-og-1200.jpg")"

# ── Vetores, fontes e CSS ───────────────────────────────────────────────────
echo "Vetores…"
python3 "$RAIZ/bin/gerar-vetores.py"

echo "Fontes…"
"$RAIZ/bin/gerar-fontes.sh"

# ── Cartão de compartilhamento ──────────────────────────────────────────────
# Precisa nascer aqui, e não à mão: sincronizar.sh limpa a pasta de destino
# antes de copiar, então qualquer arquivo criado fora do pipeline desaparece
# na sincronização seguinte — e o link volta a ser compartilhado sem imagem.
echo "Cartão de compartilhamento…"
"$RAIZ/bin/gerar-og.sh" || echo "  aviso: OG não gerado (Chrome ausente?), o existente foi mantido"

cp "$RAIZ/src/tokens.css" "$DIST/css/tokens.css"
mkdir -p "$DIST/css/compat"
if compgen -G "$RAIZ/src/compat/*.css" > /dev/null; then
  cp "$RAIZ/src"/compat/*.css "$DIST/css/compat/"
fi

echo
echo "Total em dist/: $(du -sh "$DIST" | cut -f1)"
