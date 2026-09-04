#!/usr/bin/env python3
"""Gera os vetores monocromáticos da identidade e o tile da textura de fundo.

Divisão de trabalho, e a razão dela:

  símbolo colorido  → raster, derivado do PNG original (ver gerar-assets.sh).
      O símbolo é uma ilustração 3D: uma fita que curva, com o avesso verde
      aparecendo sob o arco e degradê de malha nas duas faces. Nem o pdftocairo
      nem um redesenho à mão preservam isso — o primeiro embute 64 KB de imagem,
      o segundo vira um chevron reto que não se parece com a peça.

  símbolo mono      → vetor, traçado do contorno real (tracar_silhueta.py).
      Para favicon, ícone inline, bullet e marca d'água a silhueta basta, e aí
      vetor é o formato certo: escala e herda cor.

  textura de fundo  → vetor mono em currentColor.
      Aparece em opacidade 0,06; a silhueta é indistinguível do original ali, e
      um tile de 1 KB substitui um PNG de 11.701 px.

Geometria do grid, medida em TEXTURA SETAS FUNDO.png: passo horizontal de 3,08x
a largura da seta, vertical de 3,21x a altura, linhas alternadas deslocadas meio
passo nos dois eixos.
"""
from pathlib import Path

from tracar_silhueta import gerar as tracar

RAIZ = Path(__file__).resolve().parent.parent
DIST = RAIZ / "dist"

EPSILON = 1.2          # tolerância do Douglas-Peucker; 1,2 mantém o ápice abaulado
LARGURA = 1308.0


def svg_mono(d: str, w: float, h: float, cor: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}"'
        f' role="img" aria-label="Símbolo Pepê Collaço">'
        f'<path d="{d}" fill="{cor}"/></svg>\n'
    )


def svg_textura(d: str, w: float, h: float) -> str:
    """Tile branco, para ser usado como mask-image e não como background-image.

    Um SVG carregado por url() renderiza num contexto isolado: currentColor ali
    não enxerga a cor da página e cai para preto, o que sobre o fundo azul dá
    uma textura invisível. Com o tile branco e mask-image, quem define a cor é o
    background-color do elemento — e a mesma textura serve fundo claro e escuro.
    """
    seta_w = 100.0
    seta_h = seta_w * h / w
    passo_x = seta_w * 3.08
    passo_y = seta_h * 3.21 * 2      # duas linhas por tile
    escala = seta_w / w
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {passo_x:.0f} {passo_y:.0f}"'
        f' width="{passo_x:.0f}" height="{passo_y:.0f}">'
        f'<defs><path id="pp-seta" d="{d}"/></defs>'
        f'<g fill="#FFFFFF">'
        f'<use href="#pp-seta" transform="scale({escala:.5f})"/>'
        f'<use href="#pp-seta" transform="translate({passo_x / 2:.1f} {passo_y / 2:.1f})'
        f' scale({escala:.5f})"/>'
        f"</g></svg>\n"
    )


if __name__ == "__main__":
    d, w, h = tracar(alvo_largura=LARGURA, epsilon=EPSILON)
    (DIST / "simbolo").mkdir(parents=True, exist_ok=True)
    (DIST / "textura").mkdir(parents=True, exist_ok=True)

    saidas = {
        DIST / "simbolo/seta-branca.svg": svg_mono(d, w, h, "#FFFFFF"),
        DIST / "simbolo/seta-tinta.svg": svg_mono(d, w, h, "#061A3A"),
        DIST / "simbolo/seta-amarela.svg": svg_mono(d, w, h, "#FFC400"),
        DIST / "simbolo/seta-atual.svg": svg_mono(d, w, h, "currentColor"),
        DIST / "textura/setas-tile.svg": svg_textura(d, w, h),
    }
    for caminho, conteudo in saidas.items():
        caminho.write_text(conteudo, encoding="utf-8")
        print(f"  {caminho.relative_to(RAIZ)}  {len(conteudo)} bytes")

    obsoleto = DIST / "simbolo/_silhueta.txt"
    if obsoleto.exists():
        obsoleto.unlink()
