#!/usr/bin/env bash
# Gera o cartão de compartilhamento 1200x630 (og:image).
#
# Sem ele, todo link do site colado no WhatsApp — o canal principal da campanha
# — aparece sem imagem. Renderiza em Chrome headless porque o cartão usa a
# Acumin e o mesmo degradê do site; compor em ImageMagick daria um resultado
# parecido, mas não idêntico ao que o eleitor vê na página.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$RAIZ/dist"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

CHROME="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
[ -x "$CHROME" ] || { echo "  Chrome não encontrado em $CHROME" >&2; exit 1; }

cat > "$TMP/og.html" <<HTML
<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="$DIST/css/tipografia.css">
<link rel="stylesheet" href="$DIST/css/tokens.css">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden;
         font-family: var(--fonte); background: var(--grad-fundo);
         position: relative; display: flex; align-items: center; }
  .textura { position: absolute; inset: 0; background-color: #fff;
    -webkit-mask-image: url("$DIST/textura/setas-tile.svg");
    -webkit-mask-size: 308px 491px; opacity: .07; }
  /* O véu fecha em 62%, antes de onde o retrato começa. Quando ele ia até a
     borda direita, a rampa passava por cima da camisa e o retrato saía
     acinzentado — foi a reclamação que motivou o padrão de 2026-09-10. */
  .veu { position: absolute; inset: 0;
    background: linear-gradient(100deg, rgba(6,26,58,.92) 0%, rgba(6,26,58,.80) 34%,
      rgba(6,26,58,.22) 52%, rgba(6,26,58,0) 62%); }
  .conteudo { position: relative; z-index: 3; padding: 0 60px; width: 640px; }
  .conteudo img { width: 420px; display: block; }
  .frase { margin-top: 24px; font-size: 32px; font-weight: 700;
    text-transform: uppercase; line-height: 1.12; color: #fff; letter-spacing: -.01em; }
  .frase em { font-style: normal; color: var(--cor-acento); }
  /* Busto, não corpo inteiro: o cartão aparece com uns 300px de largura na
     lista de conversas do WhatsApp, e de corpo inteiro o rosto vira um ponto.

     Geometria do padrão (ver "Retrato nas OG" no CLAUDE.md da identidade):
     altura 690, direita 26, base -84. A margem da direita é positiva de
     propósito: o ponto mais largo do recorte é a linha dos cotovelos, e
     qualquer sangria pela direita corta o braço cruzado. Quem sangra é a
     base, que fecha logo abaixo das mãos. */
  .retrato { position: absolute; right: 26px; bottom: -84px; height: 690px; z-index: 2; }
  .retrato img { height: 100%; width: auto;
    filter: drop-shadow(0 22px 55px rgba(0,0,0,.55)); }
</style>
<div class="textura"></div>
<div class="veu"></div>
<div class="retrato"><img src="$DIST/foto/pepe-busto-1400.webp" alt=""></div>
<div class="conteudo">
  <img src="$DIST/marca/vote-11223-escuro-960.webp" alt="">
  <p class="frase">Quem faz,<br><em>representa!</em></p>
</div>
HTML

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --virtual-time-budget=6000 --window-size=1200,630 \
  --screenshot="$TMP/og.png" "file://$TMP/og.html" 2>/dev/null

[ -f "$TMP/og.png" ] || { echo "  Chrome não produziu a captura" >&2; exit 1; }

# JPEG: o cartão não tem transparência e o Facebook/WhatsApp reamostram de
# qualquer jeito — 75 KB contra 500 KB do PNG, sem diferença visível.
magick "$TMP/og.png" -strip -quality 88 -sampling-factor 4:2:0 "$DIST/og-11223.jpg"

printf "  og-11223.jpg                 %s KB (%s)\n" \
  "$(( $(stat -f%z "$DIST/og-11223.jpg") / 1024 ))" \
  "$(magick identify -format '%wx%h' "$DIST/og-11223.jpg")"
