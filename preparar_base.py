#!/usr/bin/env python3
"""
Script de preparação da base de contatos para importação no Supabase.

Gera:
  contatos_supabase.csv  — prontos para importar
  contatos_revisao.csv   — com problemas (ausente, DDD, inválido, duplicado)
"""

import csv
import re
from collections import defaultdict

INPUT_FILE = "contatos_final.csv"
OUTPUT_SUPABASE = "contatos_supabase.csv"
OUTPUT_REVISAO = "contatos_revisao.csv"

COLUNAS_SUPABASE = [
    "telefone_normalizado",
    "telefone_original",
    "nome_original",
    "nome",
    "cargo",
    "confianca_cargo",
    "cidade",
    "partido",
    "observacoes",
    "origem",
    "confirmado_evento",
    "boas_vindas_enviada",
    "agradecimento_enviado",
]

COLUNAS_REVISAO = COLUNAS_SUPABASE + ["motivo_revisao"]

# DDDs brasileiros válidos
DDDS_VALIDOS = {
    "11","12","13","14","15","16","17","18","19",
    "21","22","24","27","28",
    "31","32","33","34","35","37","38",
    "41","42","43","44","45","46","47","48","49",
    "51","53","54","55",
    "61","62","63","64","65","66","67","68","69",
    "71","73","74","75","77","79",
    "81","82","83","84","85","86","87","88","89",
    "91","92","93","94","95","96","97","98","99",
}


def strip_apenas_digitos(texto: str) -> str:
    return re.sub(r"\D", "", texto or "")


def normalizar_telefone(raw: str) -> tuple[str, list[str]]:
    """
    Retorna (telefone_normalizado, lista_de_problemas).
    telefone_normalizado estará vazio se houver problema fatal.
    """
    problemas = []

    digits = strip_apenas_digitos(raw)

    if not digits:
        return "", ["telefone ausente"]

    # Remove código de país duplicado (5555…)
    if digits.startswith("555") and len(digits) > 13:
        digits = "55" + digits[3:]

    # Já começa com 55 → verifica tamanho
    if digits.startswith("55"):
        numero_sem_pais = digits[2:]
        if len(numero_sem_pais) < 10:
            problemas.append("número muito curto após código de país")
            return "", problemas
        if len(numero_sem_pais) > 11:
            problemas.append("número muito longo")
            return "", problemas
        ddd = numero_sem_pais[:2]
        if ddd not in DDDS_VALIDOS:
            problemas.append(f"DDD inválido ({ddd})")
            return "", problemas
        return digits, problemas

    # Não começa com 55 → tenta adicionar 55
    if len(digits) >= 10:
        ddd = digits[:2]
        if ddd in DDDS_VALIDOS:
            return "55" + digits, problemas
        problemas.append(f"DDD inválido ou ausente ({ddd})")
        return "", problemas

    if len(digits) < 8:
        problemas.append("número muito curto")
        return "", problemas

    # 8 ou 9 dígitos sem DDD
    problemas.append("DDD ausente")
    return "", problemas


def extrair_cidade_de_observacoes(obs: str) -> str:
    """Extrai município identificado da coluna de observações, se houver."""
    match = re.search(r"Município identificado:\s*([^;]+)", obs or "")
    return match.group(1).strip() if match else ""


def limpar_observacoes(obs: str) -> str:
    """Remove metadados internos de processamento, mantém informações úteis."""
    if not obs:
        return ""
    # Remove marcadores de controle do pipeline anterior
    partes = [p.strip() for p in obs.split(";")]
    marcadores = {
        "Cargo não identificado",
        "Campo vazio",
        "DDD ausente",
        "Número duplicado",
        "Não é número",
        "Tamanho incomum",
        "Nome duplicado removido",
        "Cargo antes do nome",
    }
    # Mantém partes que não sejam só marcadores e não sejam "Município identificado" (vai para cidade)
    uteis = [
        p for p in partes
        if p
        and p not in marcadores
        and not p.startswith("Município identificado:")
        and not re.match(r"^Confiança\s+", p)
    ]
    return "; ".join(uteis)


def processar():
    with open(INPUT_FILE, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f, delimiter=";")
        linhas = list(reader)

    print(f"Total de registros lidos: {len(linhas)}")

    # Primeira passagem: normalizar e mapear
    registros = []
    for linha in linhas:
        # Usa "Telefone Padronizado Principal" como fonte preferencial
        fonte_tel = linha.get("Telefone Padronizado Principal", "").strip()
        if not fonte_tel:
            fonte_tel = linha.get("Telefone Original", "").strip()

        tel_norm, problemas = normalizar_telefone(fonte_tel)

        obs_original = linha.get("Observações", "").strip()
        cidade = extrair_cidade_de_observacoes(obs_original)
        obs_limpa = limpar_observacoes(obs_original)

        registro = {
            "telefone_normalizado": tel_norm,
            "telefone_original": linha.get("Telefone Original", "").strip(),
            "nome_original": linha.get("Nome Original", "").strip(),
            "nome": linha.get("Nome Limpo", "").strip(),
            "cargo": linha.get("Cargo / Informação Extraída", "").strip(),
            "confianca_cargo": linha.get("Confiança Cargo", "").strip(),
            "cidade": cidade,
            "partido": "",
            "observacoes": obs_limpa,
            "origem": "importacao_csv",
            "confirmado_evento": "false",
            "boas_vindas_enviada": "false",
            "agradecimento_enviado": "false",
            "_problemas": problemas,
        }
        registros.append(registro)

    # Segunda passagem: detectar duplicados por telefone_normalizado
    contagem_tel = defaultdict(list)
    for i, reg in enumerate(registros):
        if reg["telefone_normalizado"]:
            contagem_tel[reg["telefone_normalizado"]].append(i)

    duplicados = set()
    for tel, indices in contagem_tel.items():
        if len(indices) > 1:
            # Marca todos os duplicados exceto o primeiro
            for idx in indices[1:]:
                duplicados.add(idx)

    # Separar válidos e problemáticos
    validos = []
    revisao = []

    for i, reg in enumerate(registros):
        motivos = list(reg["_problemas"])

        if i in duplicados:
            motivos.append("telefone duplicado (mantido o primeiro)")

        linha_saida = {k: v for k, v in reg.items() if k != "_problemas"}

        if motivos or not reg["telefone_normalizado"]:
            linha_saida["motivo_revisao"] = "; ".join(motivos) if motivos else "telefone vazio"
            revisao.append(linha_saida)
        else:
            validos.append(linha_saida)

    # Escrever contatos_supabase.csv
    with open(OUTPUT_SUPABASE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS_SUPABASE)
        writer.writeheader()
        writer.writerows(validos)

    # Escrever contatos_revisao.csv
    with open(OUTPUT_REVISAO, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS_REVISAO)
        writer.writeheader()
        writer.writerows(revisao)

    # Relatório
    print(f"\n{'='*50}")
    print(f"Prontos para Supabase : {len(validos):>6}")
    print(f"Para revisão          : {len(revisao):>6}")
    print(f"  Duplicados          : {len(duplicados):>6}")

    motivos_count = defaultdict(int)
    for reg in revisao:
        for m in reg["motivo_revisao"].split("; "):
            motivos_count[m.strip()] += 1
    print("\nMotivos de revisão:")
    for motivo, cnt in sorted(motivos_count.items(), key=lambda x: -x[1]):
        print(f"  {cnt:>5}  {motivo}")

    print(f"\nArquivos gerados:")
    print(f"  {OUTPUT_SUPABASE}")
    print(f"  {OUTPUT_REVISAO}")


if __name__ == "__main__":
    processar()
