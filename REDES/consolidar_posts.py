#!/usr/bin/env python3
"""
consolidar_posts.py — junta o CSV bruto (Instagram + Facebook) numa lista com
UMA LINHA POR CONTEÚDO, para consulta do site.

Muito post é crosspost: sai igual no Instagram e no Facebook. Aqui os dois
viram uma linha só, com o link do Instagram como principal (é onde temos
curtidas e comentários) e o do Facebook numa coluna à parte.

    cd REDES && python3 consolidar_posts.py

Entra:  posts_conteudo_3anos.csv
Sai:    posts_conteudo_3anos_unico.csv
"""

import csv
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

AQUI = Path(__file__).parent
ENTRADA = AQUI / "posts_conteudo_3anos.csv"
SAIDA = AQUI / "posts_conteudo_3anos_unico.csv"

COLUNAS = [
    "data", "hora", "redes", "tipo", "link", "link_facebook",
    "curtidas", "comentarios", "engajamento", "compartilhamentos",
    "salvamentos", "alcance", "visualizacoes", "novos_seguidores",
    "id_instagram", "id_facebook", "legenda",
]

# preenchidas depois por enriquecer_metricas.py, com os exports do Business Suite
VAZIAS = ["salvamentos", "alcance", "visualizacoes", "novos_seguidores"]


def assinatura(row):
    """Chave de conteúdo: legenda normalizada + data. Sem legenda, não agrupa."""
    txt = unicodedata.normalize("NFKD", row["legenda"])
    txt = "".join(c for c in txt if not unicodedata.combining(c))
    txt = re.sub(r"[^\w ]", "", txt.lower())
    txt = re.sub(r"\s+", " ", txt).strip()
    if len(txt) < 25:
        return None
    return (row["data"], txt[:150])


def num(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return 0


def main():
    linhas = list(csv.DictReader(ENTRADA.open(encoding="utf-8-sig")))

    grupos, soltos = defaultdict(list), []
    for r in linhas:
        chave = assinatura(r)
        (soltos if chave is None else grupos[chave]).append(r)

    saida = []
    for bloco in list(grupos.values()) + [[r] for r in soltos]:
        ig = next((r for r in bloco if r["fonte"] == "instagram"), None)
        fb = next((r for r in bloco if r["fonte"] == "facebook"), None)
        base = ig or fb
        redes = "+".join(sorted({r["fonte"] for r in bloco}))
        # a legenda mais longa do grupo é a menos truncada
        legenda = max((r["legenda"] for r in bloco), key=len)
        saida.append({
            "data": base["data"],
            "hora": base["hora"],
            "redes": redes,
            "tipo": (ig or base)["tipo"],
            "link": base["permalink"],
            "link_facebook": fb["permalink"] if fb and ig else "",
            "curtidas": ig["curtidas"] if ig else "",
            "comentarios": ig["comentarios"] if ig else "",
            "engajamento": ig["engajamento"] if ig else "",
            "compartilhamentos": fb["compartilhamentos"] if fb else "",
            **{c: "" for c in VAZIAS},
            "id_instagram": ig["id"] if ig else "",
            "id_facebook": fb["id"] if fb else "",
            "legenda": legenda,
        })

    saida.sort(key=lambda r: (r["data"], r["hora"]), reverse=True)

    with SAIDA.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLUNAS)
        w.writeheader()
        w.writerows(saida)

    so_ig = sum(1 for r in saida if r["redes"] == "instagram")
    so_fb = sum(1 for r in saida if r["redes"] == "facebook")
    ambos = sum(1 for r in saida if "+" in r["redes"])
    print(f"{len(linhas)} linhas → {len(saida)} conteúdos")
    print(f"  nas duas redes: {ambos} | só Instagram: {so_ig} | só Facebook: {so_fb}")
    print(f"  período: {saida[-1]['data']} → {saida[0]['data']}")
    print(f"✔ {SAIDA}")


if __name__ == "__main__":
    main()
