#!/usr/bin/env python3
"""
enriquecer_metricas.py — preenche alcance, visualizações, salvamentos,
compartilhamentos e novos seguidores no CSV consolidado, usando os exports
de conteúdo do Meta Business Suite.

A Graph API só entrega esses números com a permissão `instagram_manage_insights`,
que o app PEPE não tem aprovada. O export manual do Business Suite entrega, e
casa certinho pela "Identificação do post" (é o mesmo id da API).

    cd REDES && python3 enriquecer_metricas.py

Entra:  metricas_export/*.csv  (um ou vários exports, podem se sobrepor)
        posts_conteudo_3anos_unico.csv
Sai:    posts_conteudo_3anos_unico.csv  (reescrito, colunas preenchidas)

Como gerar os exports: Meta Business Suite → Insights → Conteúdo → escolher o
período → Exportar dados → CSV. O Business Suite limita a janela por export,
então vêm vários arquivos; jogue todos na pasta metricas_export/.
"""

import csv
import glob
from pathlib import Path

AQUI = Path(__file__).parent
CONSOLIDADO = AQUI / "posts_conteudo_3anos_unico.csv"
EXPORTS = AQUI / "metricas_export"

# coluna do nosso CSV  ←  coluna do export do Business Suite
DE_PARA = {
    "visualizacoes": "Visualizações",
    "alcance": "Alcance",
    "salvamentos": "Salvamentos",
    "compartilhamentos": "Compartilhamentos",
    "novos_seguidores": "Seguimentos",
    "curtidas": "Curtidas",
    "comentarios": "Comentários",
}
CONTA = "pepecollaco"


def limpa(v):
    v = (v or "").strip().replace(".", "").replace(",", "")
    return v if v.isdigit() else ""


def ler_exports():
    """id do post → métricas. Arquivo mais recente vence em caso de repetição."""
    metricas = {}
    arquivos = sorted(glob.glob(str(EXPORTS / "*.csv")))
    if not arquivos:
        print(f"! nenhum export em {EXPORTS}/ — nada a fazer")
        return metricas, arquivos

    for caminho in arquivos:
        with open(caminho, encoding="utf-8-sig") as f:
            linhas = list(csv.DictReader(f))
        usadas = 0
        for r in linhas:
            # o export traz posts de outras contas (marcações, colaborações)
            if (r.get("Nome de usuário da conta") or "").strip() != CONTA:
                continue
            pid = (r.get("Identificação do post") or "").strip()
            if not pid:
                continue
            metricas[pid] = {nosso: limpa(r.get(deles)) for nosso, deles in DE_PARA.items()}
            usadas += 1
        print(f"  {Path(caminho).name}: {usadas} posts do @{CONTA} (de {len(linhas)} linhas)")
    return metricas, arquivos


def main():
    print(f"Lendo exports de {EXPORTS}/")
    metricas, arquivos = ler_exports()
    if not arquivos:
        return

    with CONSOLIDADO.open(encoding="utf-8-sig") as f:
        leitor = csv.DictReader(f)
        colunas = leitor.fieldnames
        linhas = list(leitor)

    casados = 0
    for r in linhas:
        m = metricas.get(r["id_instagram"])
        if not m:
            continue
        casados += 1
        for col, valor in m.items():
            # não apaga o que a API já trouxe
            if valor:
                r[col] = valor
        r["engajamento"] = str(int(r["curtidas"] or 0) + int(r["comentarios"] or 0))

    with CONSOLIDADO.open("w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=colunas)
        w.writeheader()
        w.writerows(linhas)

    com_alcance = sum(1 for r in linhas if r["alcance"])
    ig = sum(1 for r in linhas if r["id_instagram"])
    print(f"\n✔ {casados} posts enriquecidos")
    print(f"  com alcance/visualizações: {com_alcance} de {ig} posts do Instagram")
    faltam = [r for r in linhas if r["id_instagram"] and not r["alcance"]]
    if faltam:
        datas = sorted(r["data"] for r in faltam)
        print(f"  faltam métricas de {len(faltam)} posts ({datas[0]} → {datas[-1]})")
        print("  → exporte esse período no Business Suite e rode de novo")


if __name__ == "__main__":
    main()
