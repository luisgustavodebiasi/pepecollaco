#!/usr/bin/env python3
"""Prova WCAG dos pares de cor DESTE app.

O _IDENTIDADE/bin/contraste.py valida os pares canônicos da identidade contra
a lista fixa dele. Os pares que só existem aqui, o bege da urna e o vermelho
escurecido da mensagem de erro, ficariam sem prova nenhuma. Esta é a lista
deles, no mesmo formato.

    python3 ferramentas/contraste.py

Sai com código 1 se algum par declarado como corpo de texto ficar abaixo
de 4,5:1.
"""
import sys

#   4.5 = corpo de texto        3.0 = texto grande (>=24px, ou >=18,7px negrito)
PARES = [
    # (frente, fundo, uso, mínimo)
    ("#FFFFFF", "#2A2A2A", "número na tecla", 4.5),
    ("#061A3A", "#FFC400", "dígito aceito, na cor da campanha", 4.5),
    ("#FFFFFF", "#E5484D", "dígito errado (24px, peso 900)", 3.0),
    ("#101010", "#22B14C", "CONFIRMA, sempre verde", 4.5),
    ("#101010", "#E8541F", "CORRIGE", 4.5),
    ("#101010", "#F2F2F2", "BRANCO", 4.5),
    ("#141414", "#FFFFFF", "texto na tela do aparelho", 4.5),
    ("#5B5B5B", "#FFFFFF", "rótulo fraco na tela", 4.5),
    ("#B52024", "#FFFFFF", "mensagem de erro na tela", 4.5),
    ("#14663C", "#FFFFFF", "mensagem de acerto na tela", 4.5),
    ("#061A3A", "#FFFFFF", "o número na tela FIM", 4.5),
    ("#061A3A", "#FFC400", "botão TREINAR DE NOVO", 4.5),
    ("#3A3A3A", "#DCDCDC", "rodapé sobre a página", 4.5),
    ("#5B5B5B", "#DCDCDC", "contagem regressiva", 4.5),
    ("#5B5B5B", "#E4E4E4", "sequência e nota de reserva", 4.5),
    ("#8A5A00", "#E4E4E4", "mensagem de conquista", 4.5),
    ("#1C1C1C", "#EDEDED", "botões de compartilhar", 4.5),
]

# --erro-texto é escrito à mão em base.css, e não por color-mix: com a tela
# branca a mistura que dava contraste na versão azul reprovava aqui.
MISTURAS: list[tuple[str, str, float, str, str]] = [
]


def canal(v):
    v = v / 255
    return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4


def luz(hexa):
    h = hexa.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)


def razao(frente, fundo):
    a, b = luz(frente), luz(fundo)
    claro, escuro = max(a, b), min(a, b)
    return (claro + 0.05) / (escuro + 0.05)


def misturar(a, peso, b):
    ha, hb = a.lstrip("#"), b.lstrip("#")
    saida = []
    for i in (0, 2, 4):
        ca, cb = int(ha[i : i + 2], 16), int(hb[i : i + 2], 16)
        saida.append(round(ca * peso + cb * (1 - peso)))
    return "#" + "".join(f"{c:02X}" for c in saida)


def main():
    falhou = False

    if MISTURAS:
        print("Misturas declaradas em base.css")
    for nome, cor, peso, base, esperado in MISTURAS:
        calculado = misturar(cor, peso, base)
        igual = calculado.upper() == esperado.upper()
        print(f"  {nome:14s} {calculado}  reserva {esperado}  {'ok' if igual else 'DIVERGE'}")
        if not igual:
            falhou = True

    print("Pares de contraste")
    for frente, fundo, uso, minimo in PARES:
        r = razao(frente, fundo)
        passa = r >= minimo
        marca = "ok " if passa else "REPROVA"
        print(f"  {marca} {r:5.2f}  (min {minimo})  {frente} sobre {fundo}  {uso}")
        if not passa:
            falhou = True

    if falhou:
        print("\nHá pares reprovados. Corrija antes de publicar.")
        return 1
    print("\nTudo dentro da WCAG 2.1.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
