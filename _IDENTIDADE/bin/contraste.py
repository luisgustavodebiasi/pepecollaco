#!/usr/bin/env python3
"""Valida os pares de cor da identidade contra os mínimos da WCAG 2.1.

Roda sobre o tokens.css de verdade, então se alguém mexer numa cor o teste
acusa antes de a peça ir para a rua. Sai com código 1 se algum par declarado
como corpo de texto ficar abaixo de 4,5:1.

    python3 bin/contraste.py
"""
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TOKENS = RAIZ / "src/tokens.css"

# (frente, fundo, uso, mínimo exigido)
#   4.5 = corpo de texto        3.0 = texto grande (>=24px, ou >=18,7px negrito)
PARES = [
    ("#FFFFFF", "--pp-tinta",        "texto branco sobre a tinta",          4.5),
    ("#FFFFFF", "--pp-abismo",       "texto branco sobre o fundo",          4.5),
    ("#FFFFFF", "--pp-navy",         "texto branco sobre o navy",           4.5),
    ("#FFFFFF", "--pp-azul-profundo","texto branco sobre o azul profundo",  4.5),
    ("#FFFFFF", "--pp-azul-medio",   "texto branco sobre o azul médio",     4.5),
    ("#FFFFFF", "--pp-azul-foco",    "texto branco sobre o foco do degradê", 3.0),
    ("--pp-tinta", "--pp-amarelo",   "botão primário (tinta sobre amarelo)", 4.5),
    ("--pp-amarelo", "--pp-tinta",   "acento sobre a tinta",                4.5),
    ("--pp-amarelo", "--pp-abismo",  "acento sobre o fundo",                4.5),
    ("--pp-azul-claro", "--pp-tinta","texto secundário sobre a tinta",      4.5),
    ("--pp-azul-claro", "--pp-abismo","texto secundário sobre o fundo",     4.5),
    ("--pp-verde-claro", "--pp-tinta","verde claro sobre a tinta",          4.5),
    ("--pp-laranja", "--pp-tinta",   "laranja sobre a tinta",               4.5),
    ("--pp-verde", "--pp-abismo",    "verde sobre o fundo",                 4.5),
]

# Pares que a identidade proíbe. O teste falha se algum deles PASSAR de 4,5 —
# sinal de que a paleta mudou e a regra do guia precisa ser revista.
PROIBIDOS = [
    ("--pp-verde", "#FFFFFF", "verde como texto sobre branco"),
    ("--pp-amarelo", "--pp-azul-foco", "amarelo sobre o claro do degradê"),
]


def ler_tokens() -> dict[str, str]:
    texto = TOKENS.read_text(encoding="utf-8")
    return {f"--{n}": v for n, v in re.findall(r"--([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;", texto)}


def resolver(valor: str, tokens: dict[str, str]) -> str:
    if valor.startswith("#"):
        return valor
    if valor in tokens:
        return tokens[valor]
    raise SystemExit(f"token não encontrado em tokens.css: {valor}")


def luminancia(hexa: str) -> float:
    r, g, b = (int(hexa[i : i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def razao(a: str, b: str) -> float:
    la, lb = luminancia(a), luminancia(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def main() -> int:
    tokens = ler_tokens()
    falhas = 0

    print("Pares que a identidade usa\n")
    for frente, fundo, uso, minimo in PARES:
        v = razao(resolver(frente, tokens), resolver(fundo, tokens))
        ok = v >= minimo
        falhas += not ok
        print(f"  {'ok  ' if ok else 'FALHA'} {v:6.2f}  (mín {minimo})  {uso}")

    print("\nPares que a identidade proíbe (devem continuar reprovando)\n")
    for frente, fundo, uso in PROIBIDOS:
        v = razao(resolver(frente, tokens), resolver(fundo, tokens))
        ok = v < 4.5
        falhas += not ok
        print(f"  {'ok  ' if ok else 'FALHA'} {v:6.2f}  {uso}")

    print()
    if falhas:
        print(f"{falhas} problema(s) de contraste. Ver as regras em CLAUDE.md.")
        return 1
    print("Contraste conforme o guia.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
