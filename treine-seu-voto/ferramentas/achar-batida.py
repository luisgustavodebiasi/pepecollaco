#!/usr/bin/env python3
"""Estima o andamento (BPM) de cada faixa.

O banner pulsa e o confete dispara na batida. Para isso o app precisa do BPM,
e o BPM vai fixo em `src/config/musica.ts`: a animação é dirigida pelo RELÓGIO
da faixa, e não por análise de áudio ao vivo. Isso é decisão de projeto herdada
do player de jingles, e o motivo é o mesmo: pendurar o <audio> num AudioContext
para analisar espectro arrisca a reprodução parar com a tela bloqueada, e o som
é mais importante que a animação.

Método: envelope de novidade espectral (fluxo positivo entre quadros), depois
autocorrelação do envelope na faixa de 70 a 170 BPM.

    python3 ferramentas/achar-batida.py public/musica/*.mp3
"""
import subprocess
import sys

import numpy as np

TAXA = 22050
SALTO = 512
JANELA = 1024


def ler(caminho):
    bruto = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", caminho, "-f", "s16le", "-ac", "1",
         "-ar", str(TAXA), "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(bruto, dtype="<i2").astype(np.float32) / 32768.0


def envelope(x):
    janelas = 1 + (len(x) - JANELA) // SALTO
    jan = np.hanning(JANELA)
    espectros = np.abs(
        np.fft.rfft(np.lib.stride_tricks.as_strided(
            x, (janelas, JANELA), (x.strides[0] * SALTO, x.strides[0])) * jan, axis=1)
    )
    fluxo = np.diff(espectros, axis=0)
    fluxo[fluxo < 0] = 0
    env = fluxo.sum(axis=1)
    return env - env.mean()


def bpm(caminho):
    env = envelope(ler(caminho))
    taxa_env = TAXA / SALTO
    auto = np.correlate(env, env, mode="full")[len(env) - 1:]
    melhor, pico = 0.0, -1e18
    for candidato in np.arange(70, 170.5, 0.25):
        atraso = taxa_env * 60.0 / candidato
        # Soma as três primeiras repetições do período: batida de verdade se
        # repete, e isso separa o pulso de um pico solto qualquer.
        valor = sum(
            auto[int(round(atraso * k))]
            for k in (1, 2, 3)
            if int(round(atraso * k)) < len(auto)
        )
        if valor > pico:
            pico, melhor = valor, candidato
    return melhor


if __name__ == "__main__":
    caminhos = sys.argv[1:] or [
        "public/musica/jingle-pepe.mp3",
        "public/musica/pagode.mp3",
        "public/musica/sertanejo.mp3",
    ]
    for c in caminhos:
        print(f"{c:34s} {bpm(c):6.2f} BPM")
