#!/usr/bin/env python3
"""Sugere onde começar a tocar cada música.

O Luis deu os quatro pontos do JINGLE PEPE de ouvido, que é o jeito certo. Para
o pagode e o sertanejo não havia número, e chutar 0:40 é pior do que medir: o
trecho tem de cair no refrão, senão a pessoa ouve um final de estrofe sem graça
bem na hora em que a peça deveria empolgar.

A heurística é simples e boa o bastante: quebra a faixa em janelas de 1 s,
calcula a energia (RMS) de cada uma, e procura a janela de 12 s com maior
energia média. Refrão é onde entram todos os instrumentos e a voz dobrada, e
isso aparece como energia. Descarta os últimos 25 s para sobrar música depois
do ponto de entrada.

    python3 ferramentas/achar-refrao.py public/musica/pagode.mp3
"""
import subprocess
import sys

import numpy as np

TAXA = 22050
JANELA_S = 12
SOBRA_S = 25


def ler(caminho):
    bruto = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", caminho, "-f", "s16le", "-ac", "1",
         "-ar", str(TAXA), "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(bruto, dtype="<i2").astype(np.float32) / 32768.0


def main(caminhos):
    for caminho in caminhos:
        x = ler(caminho)
        dur = len(x) / TAXA
        seg = TAXA
        n = len(x) // seg
        rms = np.array([np.sqrt(np.mean(x[i * seg : (i + 1) * seg] ** 2)) for i in range(n)])

        limite = int(dur - SOBRA_S)
        melhor, pico = 0, -1.0
        for i in range(0, max(1, min(limite, n - JANELA_S))):
            media = rms[i : i + JANELA_S].mean()
            if media > pico:
                pico, melhor = media, i

        print(f"{caminho}")
        print(f"  duração {dur:6.2f}s   entrada sugerida {melhor:3d}s   energia {pico:.4f}")


if __name__ == "__main__":
    main(sys.argv[1:] or ["public/musica/pagode.mp3", "public/musica/sertanejo.mp3",
                          "public/musica/jingle-pepe.mp3"])
