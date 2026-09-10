#!/usr/bin/env python3
"""Empacota backdrop.html num arquivo único, com fonte e imagem em base64.

O arquivo de trabalho é o backdrop.html, que lê assets/ da pasta ao lado.
Esse aqui gera a cópia que anda sozinha — a que vai por WhatsApp, e-mail ou
para o computador da gráfica, onde a pasta assets/ não existe.

    cd "BACKDROP POR ELAS" && python3 bin/empacotar.py
"""

import base64
import mimetypes
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "backdrop.html"
DESTINO = RAIZ / "Backdrop Pepe por Elas 300x225cm (autossuficiente).html"

TIPOS = {
    ".woff2": "font/woff2",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
}


def embutir(caminho: str) -> str:
    arquivo = RAIZ / caminho
    if not arquivo.exists():
        sys.exit(f"não achei {arquivo}")
    tipo = TIPOS.get(arquivo.suffix) or mimetypes.guess_type(arquivo.name)[0]
    dados = base64.b64encode(arquivo.read_bytes()).decode("ascii")
    return f"data:{tipo};base64,{dados}"


def main() -> None:
    html = ORIGEM.read_text(encoding="utf-8")

    # url(assets/...) no CSS
    html = re.sub(
        r"url\((assets/[^)\"']+)\)",
        lambda m: f"url({embutir(m.group(1))})",
        html,
    )
    # src="assets/..." no HTML
    html = re.sub(
        r'src="(assets/[^"]+)"',
        lambda m: f'src="{embutir(m.group(1))}"',
        html,
    )

    if "assets/" in html:
        sobrou = sorted(set(re.findall(r"assets/[^\"')]+", html)))
        sys.exit(f"ficou referência solta: {sobrou}")

    DESTINO.write_text(html, encoding="utf-8")
    print(f"{DESTINO.name} — {DESTINO.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
