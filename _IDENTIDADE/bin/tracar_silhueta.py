#!/usr/bin/env python3
"""Traça a silhueta real do símbolo a partir do canal alpha do PNG original.

O símbolo é uma ilustração 3D: uma fita que curva, com o avesso visível sob o
arco. Um chevron geométrico não reproduz isso — as bordas têm curvatura e o
ápice é abaulado. Então em vez de aproximar a forma, seguimos o contorno de
verdade e o simplificamos com Douglas-Peucker.

O resultado serve os usos monocromáticos (favicon, ícone inline, textura, marca
d'água). Para o símbolo colorido, use o raster derivado do original: o degradê
de malha e o sombreamento não sobrevivem a uma vetorização honesta.
"""
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ARTE = Path("/Users/luisgustavodebiasi/TRABALHOS/Projetos Externo/PEPE/_ARTE ")
ORIGEM = ARTE / "Pepe_Simbolo_SetaAmarela_v00.png"


def contorno(mascara: np.ndarray) -> list[tuple[int, int]]:
    """Segue a borda da região opaca (Moore neighborhood, sentido horário)."""
    h, w = mascara.shape
    inicio = None
    for y in range(h):
        xs = np.nonzero(mascara[y])[0]
        if len(xs):
            inicio = (int(xs[0]), y)
            break
    if inicio is None:
        return []

    vizinhos = [(-1, 0), (-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1)]
    dentro = lambda x, y: 0 <= x < w and 0 <= y < h and mascara[y, x]

    pontos = [inicio]
    atual, anterior = inicio, (inicio[0] - 1, inicio[1])
    for _ in range(4 * (w + h) * 4):
        dx, dy = anterior[0] - atual[0], anterior[1] - atual[1]
        i = vizinhos.index((dx, dy)) if (dx, dy) in vizinhos else 0
        achou = False
        for k in range(1, 9):
            vx, vy = vizinhos[(i + k) % 8]
            cand = (atual[0] + vx, atual[1] + vy)
            if dentro(*cand):
                anterior, atual, achou = atual, cand, True
                break
        if not achou:
            break
        if atual == inicio:
            break
        pontos.append(atual)
    return pontos


def douglas_peucker(pts: list[tuple[float, float]], eps: float) -> list[tuple[float, float]]:
    if len(pts) < 3:
        return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float)
    ab = b - a
    norma = np.hypot(*ab)
    if norma == 0:
        dists = [np.hypot(*(np.array(p, float) - a)) for p in pts[1:-1]]
    else:
        def area2(p):
            ap = np.array(p, float) - a
            return abs(ab[0] * ap[1] - ab[1] * ap[0])
        dists = [area2(p) / norma for p in pts[1:-1]]
    if not dists:
        return [pts[0], pts[-1]]
    i = int(np.argmax(dists))
    if dists[i] > eps:
        esq = douglas_peucker(pts[: i + 2], eps)
        dir_ = douglas_peucker(pts[i + 1 :], eps)
        return esq[:-1] + dir_
    return [pts[0], pts[-1]]


def suavizar(pts: list[tuple[float, float]], tensao: float = 0.34) -> str:
    """Converte a polilinha em path com curvas cúbicas (Catmull-Rom → Bézier)."""
    n = len(pts)
    p = [np.array(q, float) for q in pts]
    d = [f"M{p[0][0]:.1f} {p[0][1]:.1f}"]
    for i in range(n):
        p0, p1 = p[(i - 1) % n], p[i]
        p2, p3 = p[(i + 1) % n], p[(i + 2) % n]
        c1 = p1 + (p2 - p0) * tensao / 2
        c2 = p2 - (p3 - p1) * tensao / 2
        d.append(f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}")
    return "".join(d) + "Z"


def gerar(alvo_largura: float = 1308.0, epsilon: float = 3.0) -> tuple[str, float, float]:
    im = Image.open(ORIGEM).convert("RGBA")
    escala = 900 / im.width
    im = im.resize((900, round(im.height * escala)), Image.LANCZOS)
    alpha = np.array(im.getchannel("A"))
    mascara = alpha > 90

    pts = contorno(mascara)
    if not pts:
        raise SystemExit("não achei contorno — confira o alpha do PNG")

    simples = douglas_peucker([(float(x), float(y)) for x, y in pts], epsilon)
    if simples[0] == simples[-1]:
        simples = simples[:-1]

    k = alvo_largura / im.width
    altura = im.height * k
    escalados = [(x * k, y * k) for x, y in simples]
    return suavizar(escalados), alvo_largura, altura


if __name__ == "__main__":
    d, w, h = gerar()
    print(f"path com {d.count('C')} curvas, {len(d)} bytes")
    print(f"viewBox 0 0 {w:.0f} {h:.0f}  ratio {w / h:.4f}")
    (RAIZ / "dist/simbolo/_silhueta.txt").write_text(
        f"{w:.0f} {h:.0f}\n{d}\n", encoding="utf-8"
    )
