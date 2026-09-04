#!/usr/bin/env python3
"""Prepara o retrato recortado: limpa a franja do recorte e gera as variantes.

O PNG que veio da agência tem ~13 mil pixels de borda semi-transparente ainda
contaminados pelo fundo branco do estúdio. Sobre o azul da identidade isso vira
uma franja clara em volta do cabelo e dos ombros — o "branco vazado". Encolher
o alpha em 2px corta a franja sem comer o cabelo; 3px já começa a roer o
contorno, 1px não resolve por completo.

Duas variantes saem daqui:
  corpo  — do topo à cintura, para o cartão de compartilhamento e a gráfica
  busto  — 10% a menos no topo e cortado em 84% da altura, para o hero do site,
           onde o retrato precisa preencher a coluna sem espaço morto em volta
           da cabeça
"""
import sys
from pathlib import Path

from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
DIST = RAIZ / "dist" / "foto"

EROSAO_PX = 2          # franja do recorte
# Nada é cortado do topo. O vazio acima da cabeça mede 7px numa imagem de 2400
# — 0,3%, e o próprio getbbox já o descarta. Cortar "10% da margem superior"
# comia 232px de cabelo, porque a margem vazia nunca teve 10%.
CORTE_TOPO = 0.0
CORTE_BASE = 0.84      # onde a cintura fecha, medido por varredura de alpha


def limpar_franja(im: Image.Image, px: int = EROSAO_PX) -> Image.Image:
    """Encolhe o alpha para descartar os pixels de borda contaminados."""
    alpha = im.getchannel("A")
    alpha = alpha.filter(ImageFilter.MinFilter(2 * px + 1))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    saida = im.copy()
    saida.putalpha(alpha)
    return saida


def salvar_webp(im: Image.Image, destino: Path, altura: int, q: int = 84) -> None:
    larg = round(im.width * altura / im.height)
    im.resize((larg, altura), Image.LANCZOS).save(
        destino, "WEBP", quality=q, method=6, alpha_quality=100
    )


def main(origem: Path) -> None:
    im = Image.open(origem).convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if bbox:
        im = im.crop(bbox)
    im = limpar_franja(im)

    DIST.mkdir(parents=True, exist_ok=True)
    w, h = im.size

    # corpo: como veio, só sem a franja
    for altura in (900, 1400, 2000):
        salvar_webp(im, DIST / f"pepe-{altura}.webp", altura)
    im.save(DIST / "pepe-2400.png")

    # busto: sem o vazio do topo e fechando na cintura
    topo = round(h * CORTE_TOPO)
    base = round(h * CORTE_BASE)
    busto = im.crop((0, topo, w, base))
    bbox_b = busto.getchannel("A").getbbox()
    if bbox_b:
        busto = busto.crop(bbox_b)
    for altura in (900, 1400):
        salvar_webp(busto, DIST / f"pepe-busto-{altura}.webp", altura)

    # PNG do busto para o Satori, que gera as open-graph do sistema e não
    # decodifica WebP. 900px basta: a peça final tem 630px de altura.
    larg = round(busto.width * 900 / busto.height)
    busto.resize((larg, 900), Image.LANCZOS).save(DIST / "pepe-busto-900.png")

    print(f"  corpo  {w}x{h}       -> pepe-{{900,1400,2000}}.webp + pepe-2400.png")
    print(f"  busto  {busto.width}x{busto.height}  -> pepe-busto-{{900,1400}}.webp"
          f"  (topo -{CORTE_TOPO:.0%}, base {CORTE_BASE:.0%})")
    print(f"  franja do recorte removida: alpha erodido {EROSAO_PX}px")


if __name__ == "__main__":
    origem = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    if not origem or not origem.exists():
        raise SystemExit("uso: preparar_foto.py <caminho do PNG recortado>")
    main(origem)
