#!/usr/bin/env bash
# Gera as webfonts Acumin subsetadas a partir dos OTF originais.
#
# Duas famílias, com papéis diferentes:
#
#   Acumin Pro       largura normal, pesos 400 e 700 com itálicos. É o texto:
#                    parágrafo, rótulo, botão, tudo que se lê em corpo pequeno.
#
#   Acumin Pro Wide  largura expandida, pesos 275, 400 e 900. É o display: a
#                    manchete e a palavra grande. É a largura que a agência usou
#                    no lockup, então título em Wide Black é a peça encostando na
#                    marca impressa, não uma imitação em negrito sintético.
#
#   Granesta        pincel, um peso só. É a letra do "REPRESENTA" da assinatura
#                   QUEM FAZ REPRESENTA. Papel de acento: UMA palavra por peça,
#                   grande, nunca texto. Vem de granesta/, dentro do próprio
#                   _IDENTIDADE, já com as acentuadas compostas (a original não
#                   escreve Tubarão nem Collaço).
#
# Duas saídas por peso, de propósito:
#   .woff2 → navegador (16 KB por peso)
#   .otf   → Satori, que renderiza as open-graph images do app de credenciamento
#            e NÃO lê woff2. Sem este arquivo as OG saem com fonte de fallback.
set -euo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${ACUMIN_SRC:-/Users/luisgustavodebiasi/Downloads/acumin-pro}"
OUT="$RAIZ/dist/fontes"

if [ ! -d "$SRC" ]; then
  echo "erro: fontes Acumin não encontradas em $SRC" >&2
  echo "      defina ACUMIN_SRC=/caminho/para/acumin-pro" >&2
  exit 1
fi

mkdir -p "$OUT"

LATIN="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,\
U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,\
U+2212,U+2215,U+FEFF,U+FFFD"
FEAT="kern,liga,clig,calt,frac,numr,dnom,onum,tnum,lnum,pnum,ordn,sups"

subset () {  # $1 = arquivo de origem   $2 = nome de saída
  local src="$SRC/$1" nome="$2"
  [ -f "$src" ] || { echo "  aviso: $1 não existe, pulando"; return; }

  python3 -m fontTools.subset "$src" \
    --unicodes="$LATIN" --layout-features="$FEAT" \
    --desubroutinize --drop-tables+=DSIG \
    --flavor=woff2 --output-file="$OUT/$nome.woff2"

  python3 -m fontTools.subset "$src" \
    --unicodes="$LATIN" --layout-features="$FEAT" \
    --drop-tables+=DSIG \
    --output-file="$OUT/$nome.otf"

  printf "  %-16s %5s KB (woff2)  %5s KB (otf)\n" "$nome" \
    "$(( $(stat -f%z "$OUT/$nome.woff2") / 1024 ))" \
    "$(( $(stat -f%z "$OUT/$nome.otf") / 1024 ))"
}

echo "Gerando webfonts Acumin Pro (texto)…"
subset Acumin-RPro.otf    acumin-400
subset Acumin-ItPro.otf   acumin-400i
subset Acumin-BdPro.otf   acumin-700
subset Acumin-BdItPro.otf acumin-700i

# O número no nome é o usWeightClass real do arquivo, não um arredondamento:
# a Extra Light é 275 mesmo. Declarar 200 no @font-face funcionaria (o navegador
# aproxima), mas mentir sobre o peso confunde quem for abrir o CSS depois.
echo "Gerando webfonts Acumin Pro Wide (display)…"
subset acumin-pro-wide-extralight.otf acumin-wide-275
subset acumin-pro-wide.otf            acumin-wide-400
subset acumin-pro-wide-black.otf      acumin-wide-900

# ── Granesta (pincel) ───────────────────────────────────────────────────────
# Recorte só de caixa alta, e de propósito: a Granesta é unicase, o papel dela
# é palavra grande, e o CSS do papel de pincel força text-transform: uppercase.
# Levar a caixa baixa junto custaria 80 KB por nada. O .otf, que ninguém baixa,
# vai inteiro, para quem abrir a fonte no Illustrator ter os alternativos.
GRANESTA="$RAIZ/granesta/Granesta-PTBR.otf"
CAIXA_ALTA="U+0020-0060,U+007B-007E,U+00A0,U+00B7,U+00C0-00DD,\
U+2013-2014,U+2018-201D,U+20AC,U+2122"

echo "Gerando webfont Granesta (pincel)…"
if [ -f "$GRANESTA" ]; then
  python3 -m fontTools.subset "$GRANESTA" \
    --unicodes="$CAIXA_ALTA" --layout-features="kern" \
    --desubroutinize --drop-tables+=DSIG \
    --flavor=woff2 --output-file="$OUT/granesta-ptbr.woff2"
  python3 -m fontTools.subset "$GRANESTA" \
    --unicodes="$LATIN" --layout-features="kern,salt" \
    --drop-tables+=DSIG \
    --output-file="$OUT/granesta-ptbr.otf"
  printf "  %-16s %5s KB (woff2)  %5s KB (otf)\n" "granesta-ptbr" \
    "$(( $(stat -f%z "$OUT/granesta-ptbr.woff2") / 1024 ))" \
    "$(( $(stat -f%z "$OUT/granesta-ptbr.otf") / 1024 ))"
else
  echo "  aviso: $GRANESTA não existe, pulando o pincel"
fi

# tipografia.css acompanha as fontes: quem copiar dist/fontes copia isto junto.
cat > "$RAIZ/dist/css/tipografia.css" <<'CSS'
/* Acumin — gerado por _IDENTIDADE/bin/gerar-fontes.sh, não edite à mão.
   Ver a seção Tipografia de _IDENTIDADE/CLAUDE.md. */

/* ── Acumin Pro · texto ──────────────────────────────────────────
   Largura normal, 400 e 700 com itálicos. Tudo que se lê em corpo
   pequeno: parágrafo, rótulo, botão, campo de formulário. */
@font-face {
  font-family: "Acumin Pro";
  src: url("../fontes/acumin-400.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Acumin Pro";
  src: url("../fontes/acumin-400i.woff2") format("woff2");
  font-weight: 400; font-style: italic; font-display: swap;
}
@font-face {
  font-family: "Acumin Pro";
  src: url("../fontes/acumin-700.woff2") format("woff2");
  font-weight: 700; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Acumin Pro";
  src: url("../fontes/acumin-700i.woff2") format("woff2");
  font-weight: 700; font-style: italic; font-display: swap;
}

/* ── Acumin Pro Wide · display ───────────────────────────────────
   Largura expandida, é a largura do lockup da agência. Só para
   manchete e palavra grande: em corpo pequeno a expandida cansa.

   Os pesos são 275, 400 e 900, e não existe nada entre 400 e 900.
   Pedir 600 ou 700 devolve a Black, porque é o vizinho mais próximo
   acima. Não é bug: é para não haver negrito sintético em lugar
   nenhum. Escreva 400 ou 900 e você sabe o que vai receber. */
@font-face {
  font-family: "Acumin Pro Wide";
  src: url("../fontes/acumin-wide-275.woff2") format("woff2");
  font-weight: 275; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Acumin Pro Wide";
  src: url("../fontes/acumin-wide-400.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Acumin Pro Wide";
  src: url("../fontes/acumin-wide-900.woff2") format("woff2");
  font-weight: 900; font-style: normal; font-display: swap;
}

/* ── Granesta · pincel ───────────────────────────────────────────
   A letra do "REPRESENTA" da assinatura QUEM FAZ REPRESENTA. Um
   peso só, unicase, e o recorte publicado é só de caixa alta.

   Papel de acento, não de texto: UMA palavra por peça, grande, do
   lado do Acumin. Em corpo pequeno ela não se lê, e em frase
   inteira vira ruído. Quem usa --fonte-brush usa também
   text-transform: uppercase, senão pede glifo que não veio. */
@font-face {
  font-family: "Granesta";
  src: url("../fontes/granesta-ptbr.woff2") format("woff2");
  font-weight: 400; font-style: normal; font-display: swap;
}
CSS

echo "ok — $OUT"
