#!/usr/bin/env python3
from __future__ import annotations

import argparse
import ast
import json
import re
import sys
import unicodedata
from collections import OrderedDict
from pathlib import Path
from typing import Any

try:
    import pandas as pd
    from bs4 import BeautifulSoup, NavigableString, Tag
except ModuleNotFoundError as exc:
    missing = exc.name
    print(
        f"Dependencia ausente: {missing}. Instale com:\n"
        "python3 -m pip install beautifulsoup4 pandas openpyxl lxml html5lib",
        file=sys.stderr,
    )
    raise SystemExit(1)


DEFAULT_COLUMNS = [
    "ID",
    "Coordenacao",
    "Associacao",
    "Municipio",
    "Interessado",
    "Valor",
    "Objeto",
    "Modalidade",
    "Status",
    "Numero Emenda",
    "SGPE",
    "Data da publicacao",
    "Data do PGTO/Troca",
    "Observacoes da publicacao",
    "Forma de transferencia",
    "Observacoes",
]

UI_DATA_ATTRS = {
    "data-bs-target",
    "data-target",
    "data-bs-toggle",
    "data-toggle",
    "data-bs-dismiss",
    "data-dismiss",
    "data-backdrop",
    "data-keyboard",
}

FIELD_ALIASES = {
    "id": "ID",
    "coord": "Coordenacao",
    "coordenacao": "Coordenacao",
    "associacao": "Associacao",
    "associacao coordenacao": "Associacao / Coordenacao",
    "municipio": "Municipio",
    "interessado": "Interessado",
    "valor": "Valor",
    "valor r": "Valor",
    "valor rs": "Valor",
    "objeto": "Objeto",
    "modalidade": "Modalidade",
    "status": "Status",
    "acoes": "Acoes",
    "acao": "Acoes",
    "detalhes": "Acoes",
    "n emenda": "Numero Emenda",
    "no emenda": "Numero Emenda",
    "numero emenda": "Numero Emenda",
    "numero da emenda": "Numero Emenda",
    "emenda": "Numero Emenda",
    "sgpe": "SGPE",
    "data da publicacao": "Data da publicacao",
    "data publicacao": "Data da publicacao",
    "data do pgto troca": "Data do PGTO/Troca",
    "data pgto troca": "Data do PGTO/Troca",
    "pgto troca": "Data do PGTO/Troca",
    "observacoes da publicacao": "Observacoes da publicacao",
    "observacao da publicacao": "Observacoes da publicacao",
    "obs da publicacao": "Observacoes da publicacao",
    "obs data da publicacao": "Observacoes da publicacao",
    "forma de transferencia": "Forma de transferencia",
    "forma transferencia": "Forma de transferencia",
    "observacoes": "Observacoes",
    "observacao": "Observacoes",
    "obs": "Observacoes",
}


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value)
    text = text.replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text, flags=re.MULTILINE).strip()
    return text


def normalize_key(value: Any) -> str:
    text = clean_text(value)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = text.replace("º", "o").replace("°", "o").replace("ª", "a")
    text = re.sub(r"[^0-9a-zA-Z]+", " ", text).strip().lower()
    return text


def canonical_key(value: Any) -> str:
    cleaned = clean_text(value).strip(":")
    normalized = normalize_key(cleaned)
    if normalized.startswith("data do pgto"):
        return "Data do PGTO/Troca"
    return FIELD_ALIASES.get(normalized, cleaned)


def normalize_money(value: str) -> str:
    text = clean_text(value)
    if not text:
        return ""

    match = re.search(r"(?:R\$\s*)?[-+]?\d[\d.\s]*,\d{2}", text)
    if not match:
        return text

    amount = re.sub(r"\s+", "", match.group(0))
    if not amount.startswith("R$"):
        amount = f"R$ {amount}"
    else:
        amount = re.sub(r"^R\$\s*", "R$ ", amount)
    return text[: match.start()] + amount + text[match.end() :]


def set_value(row: OrderedDict[str, str], key: Any, value: Any) -> None:
    column = canonical_key(key)
    if not column:
        return
    text = clean_text(value)
    if not text:
        row.setdefault(column, "")
        return
    if normalize_key(column) in {"valor", "valor r", "valor rs"}:
        text = normalize_money(text)

    previous = row.get(column, "")
    if not previous or len(text) > len(previous):
        row[column] = text


def merge_rows(*parts: dict[str, Any]) -> OrderedDict[str, str]:
    row: OrderedDict[str, str] = OrderedDict()
    for part in parts:
        for key, value in part.items():
            set_value(row, key, value)
    return row


def element_text(element: Any) -> str:
    return clean_text(element.get_text(" ", strip=True)) if element else ""


def parse_attrs(element: Any) -> dict[str, str]:
    data: dict[str, str] = {}
    if not element:
        return data
    for attr, value in element.attrs.items():
        if attr in UI_DATA_ATTRS:
            continue
        if attr.startswith("data-"):
            key = attr[5:].replace("-", " ")
            if isinstance(value, list):
                value = " ".join(value)
            set_value(data, key, value)
    return data


def find_modal_target(element: Any) -> str:
    if not element:
        return ""
    candidates = [
        element.get("data-bs-target"),
        element.get("data-target"),
        element.get("href"),
        element.get("aria-controls"),
    ]
    onclick = element.get("onclick") or ""
    match = re.search(r"#([A-Za-z][\w:.-]*)", onclick)
    if match:
        candidates.append("#" + match.group(1))
    match = re.search(r"(?:open|show|detalhes|modal)[A-Za-z_]*\(['\"]([^'\"]+)['\"]", onclick, re.I)
    if match:
        candidates.append(match.group(1))

    for candidate in candidates:
        target = clean_text(candidate)
        if target and target not in {"#", "javascript:void(0)"}:
            return target[1:] if target.startswith("#") else target
    return ""


def extract_label_value_blocks(container: Any) -> OrderedDict[str, str]:
    data: OrderedDict[str, str] = OrderedDict()

    for row in container.select("tr"):
        cells = row.find_all(["th", "td"], recursive=False)
        if len(cells) >= 2:
            key = element_text(cells[0])
            value = " ".join(element_text(cell) for cell in cells[1:])
            set_value(data, key, value)

    for dt in container.find_all("dt"):
        dd = dt.find_next_sibling("dd")
        if dd:
            set_value(data, element_text(dt), element_text(dd))

    label_selectors = ["label", ".label", ".form-label", ".fw-bold", "strong", "b"]
    for label in container.select(",".join(label_selectors)):
        key = element_text(label)
        if not key or len(key) > 80:
            continue

        value = ""
        sibling_parts = []
        for sibling in label.next_siblings:
            if isinstance(sibling, NavigableString):
                sibling_parts.append(clean_text(sibling))
                continue
            if isinstance(sibling, Tag):
                if sibling.select_one(",".join(label_selectors)) or sibling.name in {
                    "p",
                    "div",
                    "dl",
                    "table",
                    "tr",
                    "hr",
                }:
                    break
                sibling_parts.append(element_text(sibling))
        value = clean_text(" ".join(part for part in sibling_parts if part).lstrip(":- "))

        parent = label.parent
        if not value and parent:
            clone_text = element_text(parent)
            if clone_text.startswith(key):
                value = clean_text(clone_text[len(key) :].lstrip(":- "))
        if not value:
            sibling = label.find_next_sibling()
            value = element_text(sibling)
        set_value(data, key, value)

    for field in container.select("input, textarea, select"):
        name = field.get("name") or field.get("id") or field.get("aria-label") or field.get("placeholder")
        if not name:
            continue
        if field.name == "select":
            selected = field.find("option", selected=True)
            value = element_text(selected) if selected else field.get("value", "")
        else:
            value = field.get("value", "") if field.name == "input" else element_text(field)
        set_value(data, name, value)

    return data


def extract_modals(soup: BeautifulSoup) -> dict[str, OrderedDict[str, str]]:
    modals: dict[str, OrderedDict[str, str]] = {}
    selectors = [
        ".modal",
        "[role='dialog']",
        "[id*='modal' i]",
        "[id*='detalhe' i]",
    ]
    for modal in soup.select(",".join(selectors)):
        modal_id = modal.get("id")
        if not modal_id:
            continue
        data = extract_label_value_blocks(modal)
        data.update(parse_attrs(modal))
        if data:
            modals[modal_id] = data
    return modals


def extract_tables(soup: BeautifulSoup, modals: dict[str, OrderedDict[str, str]]) -> list[OrderedDict[str, str]]:
    rows: list[OrderedDict[str, str]] = []
    for table in soup.find_all("table"):
        header_cells = table.select("thead th")
        if not header_cells:
            first_row = table.find("tr")
            header_cells = first_row.find_all(["th", "td"], recursive=False) if first_row else []
        headers = [element_text(cell) or f"Coluna {index + 1}" for index, cell in enumerate(header_cells)]

        body_rows = table.select("tbody tr") or table.find_all("tr")
        for tr in body_rows:
            if tr.find("th") and tr == table.find("tr"):
                continue
            cells = tr.find_all(["td", "th"], recursive=False)
            if not cells:
                continue

            visible: OrderedDict[str, str] = OrderedDict()
            for index, cell in enumerate(cells):
                header = headers[index] if index < len(headers) else f"Coluna {index + 1}"
                text = element_text(cell)
                if normalize_key(header) in {"acoes", "acao", "detalhes"}:
                    continue
                set_value(visible, header, text)
                for key, value in parse_attrs(cell).items():
                    set_value(visible, key, value)

            attrs = parse_attrs(tr)
            for button in tr.select("button, a, [data-bs-target], [data-target], [onclick]"):
                attrs.update(parse_attrs(button))
                target = find_modal_target(button)
                if target and target in modals:
                    rows.append(merge_rows(visible, attrs, modals[target]))
                    break
            else:
                rows.append(merge_rows(visible, attrs))

    return rows


def extract_emenda_id(element: Any) -> str:
    if not element:
        return ""
    texts: list[str] = []
    for node in [element, *element.select("[onclick]")]:
        onclick = node.get("onclick") or ""
        if onclick:
            texts.append(onclick)
    joined = " ".join(texts)
    match = re.search(r"(?:editarEmenda|onRClick|abrirArquivosEmenda|excluirEmenda)\((\d+)\)", joined)
    return match.group(1) if match else ""


def extract_report_table(soup: BeautifulSoup) -> list[OrderedDict[str, str]]:
    tbody = soup.select_one("#tabelaRel")
    if not tbody:
        return []

    table = tbody.find_parent("table")
    headers = []
    if table:
        headers = [element_text(th) for th in table.select("thead th")]
    if not headers:
        headers = [
            "Coord.",
            "Associação",
            "Município",
            "Interessado",
            "Valor",
            "Objeto",
            "Modalidade",
            "Status",
            "Ações",
        ]

    rows: list[OrderedDict[str, str]] = []
    for tr in tbody.find_all("tr", recursive=False):
        cells = tr.find_all(["td", "th"], recursive=False)
        if not cells:
            continue
        row: OrderedDict[str, str] = OrderedDict()
        emenda_id = extract_emenda_id(tr)
        if emenda_id:
            set_value(row, "ID", emenda_id)

        for index, cell in enumerate(cells):
            header = headers[index] if index < len(headers) else f"Coluna {index + 1}"
            if normalize_key(header) in {"acoes", "acao", "detalhes"}:
                continue
            text = cell.get("title") if normalize_key(header) == "objeto" and cell.get("title") else element_text(cell)
            set_value(row, header, text)
            for key, value in parse_attrs(cell).items():
                set_value(row, key, value)
        rows.append(row)
    return rows


def extract_current_emenda_modal(soup: BeautifulSoup) -> OrderedDict[str, str]:
    modal = soup.select_one("#modalEmenda")
    if not modal:
        return OrderedDict()

    data: OrderedDict[str, str] = OrderedDict()
    title = element_text(modal.select_one("#modalEmendaTitle"))
    match = re.search(r"#\s*(\d+)", title)
    if match:
        set_value(data, "ID", match.group(1))

    hidden_id = modal.select_one("#emendaId")
    if hidden_id and hidden_id.get("value"):
        set_value(data, "ID", hidden_id.get("value"))

    field_map = {
        "fMun": "Municipio",
        "fInteressado": "Interessado",
        "fMod": "Modalidade",
        "fStatus": "Status",
        "fValor": "Valor",
        "fNumEmenda": "Numero Emenda",
        "fObjeto": "Objeto",
        "fSgpe": "SGPE",
        "fDataPub": "Data da publicacao",
        "fDataPgto": "Data do PGTO/Troca",
        "fObsDataPub": "Observacoes da publicacao",
        "fFormaTransf": "Forma de transferencia",
    }
    for field_id, column in field_map.items():
        field = modal.select_one(f"#{field_id}")
        if not field:
            continue
        if field.name == "select":
            selected = field.find("option", selected=True)
            value = element_text(selected) if selected else ""
        elif field.name == "textarea":
            value = element_text(field)
        else:
            value = field.get("value", "")
        set_value(data, column, value)

    assoc_coord = modal.select_one("#fAssocCoordDisplay")
    if assoc_coord:
        parts = [element_text(span) for span in assoc_coord.select("span.font-semibold")]
        if len(parts) >= 1:
            set_value(data, "Associacao", parts[0])
        if len(parts) >= 2:
            set_value(data, "Coordenacao", parts[1])

    obs = modal.select_one("#fObs")
    if obs:
        set_value(data, "Observacoes", element_text(obs))

    return data


def merge_modal_by_id(rows: list[OrderedDict[str, str]], modal_data: OrderedDict[str, str]) -> list[OrderedDict[str, str]]:
    modal_id = modal_data.get("ID", "")
    if not rows or not modal_id:
        return rows
    merged_rows: list[OrderedDict[str, str]] = []
    for row in rows:
        if row.get("ID") == modal_id:
            merged_rows.append(merge_rows(row, modal_data))
        else:
            merged_rows.append(row)
    return merged_rows


def js_literal_to_python(raw: str) -> Any:
    text = raw.strip().rstrip(";")
    text = re.sub(r"//.*?$|/\*.*?\*/", "", text, flags=re.S | re.M)
    text = re.sub(r"([{,]\s*)([A-Za-z_$][\w$-]*)\s*:", r'\1"\2":', text)
    text = text.replace("undefined", "null")
    text = re.sub(r"\btrue\b", "true", text, flags=re.I)
    text = re.sub(r"\bfalse\b", "false", text, flags=re.I)
    text = re.sub(r"\bnull\b", "null", text, flags=re.I)
    text = re.sub(r",\s*([}\]])", r"\1", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            return ast.literal_eval(text)
        except (ValueError, SyntaxError):
            return None


def balanced_literals(script: str) -> list[str]:
    literals: list[str] = []
    for start, opening, closing in [(m.start(), "[", "]") for m in re.finditer(r"\[", script)] + [
        (m.start(), "{", "}") for m in re.finditer(r"\{", script)
    ]:
        depth = 0
        quote = ""
        escape = False
        for index in range(start, len(script)):
            char = script[index]
            if quote:
                if escape:
                    escape = False
                elif char == "\\":
                    escape = True
                elif char == quote:
                    quote = ""
                continue
            if char in {"'", '"'}:
                quote = char
            elif char == opening:
                depth += 1
            elif char == closing:
                depth -= 1
                if depth == 0:
                    literal = script[start : index + 1]
                    if ":" in literal or opening == "[":
                        literals.append(literal)
                    break
    return literals


def flatten_records(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, dict):
        if value and all(not isinstance(v, (dict, list)) for v in value.values()):
            return [value]
        records: list[dict[str, Any]] = []
        for nested in value.values():
            records.extend(flatten_records(nested))
        return records
    if isinstance(value, list):
        records = []
        for item in value:
            records.extend(flatten_records(item))
        return records
    return []


def extract_js_records(soup: BeautifulSoup) -> list[OrderedDict[str, str]]:
    rows: list[OrderedDict[str, str]] = []
    seen: set[tuple[tuple[str, str], ...]] = set()
    for script_tag in soup.find_all("script"):
        script = script_tag.string or script_tag.get_text("\n")
        for literal in balanced_literals(script):
            value = js_literal_to_python(literal)
            for record in flatten_records(value):
                normalized = merge_rows(record)
                if not normalized:
                    continue
                signature = tuple(sorted(normalized.items()))
                if signature not in seen:
                    seen.add(signature)
                    rows.append(normalized)
    return rows


def deduplicate(rows: list[OrderedDict[str, str]]) -> list[OrderedDict[str, str]]:
    result: list[OrderedDict[str, str]] = []
    seen: set[tuple[tuple[str, str], ...]] = set()
    for row in rows:
        compact = OrderedDict((key, clean_text(value)) for key, value in row.items() if clean_text(value))
        signature = tuple(sorted(compact.items()))
        if compact and signature not in seen:
            seen.add(signature)
            result.append(compact)
    return result


def order_columns(rows: list[OrderedDict[str, str]]) -> list[str]:
    columns: list[str] = []
    for column in DEFAULT_COLUMNS:
        if any(row.get(column, "") for row in rows):
            columns.append(column)
    for row in rows:
        for column in row:
            if column not in columns:
                columns.append(column)
    return columns


def read_html(path: Path) -> str:
    for encoding in ("utf-8", "utf-8-sig", "latin-1", "cp1252"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return path.read_text(errors="replace")


def parse_html(html: str) -> BeautifulSoup:
    for parser in ("lxml", "html5lib", "html.parser"):
        try:
            return BeautifulSoup(html, parser)
        except Exception:
            continue
    return BeautifulSoup(html, "html.parser")


def find_default_html(base_dir: Path) -> Path:
    candidates = [
        base_dir / "base.html",
        base_dir / "BASE.HTML",
        base_dir / "Base.html",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    html_files = sorted(base_dir.glob("*.html")) + sorted(base_dir.glob("*.HTML"))
    if html_files:
        return html_files[0]
    raise FileNotFoundError("Nenhum arquivo HTML encontrado.")


def export_rows(rows: list[OrderedDict[str, str]], output_dir: Path) -> tuple[Path, Path]:
    columns = order_columns(rows) or DEFAULT_COLUMNS
    df = pd.DataFrame(rows, columns=columns).fillna("")
    csv_path = output_dir / "emendas_extraidas.csv"
    xlsx_path = output_dir / "emendas_extraidas.xlsx"
    df.to_csv(csv_path, index=False, encoding="utf-8-sig", sep=";")
    df.to_excel(xlsx_path, index=False)
    return csv_path, xlsx_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Extrai emendas de base.html para CSV e XLSX.")
    parser.add_argument("html", nargs="?", help="Caminho do HTML. Padrao: base.html/BASE.HTML na pasta do script.")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    html_path = Path(args.html).expanduser().resolve() if args.html else find_default_html(script_dir)
    if not html_path.exists():
        print(f"Arquivo nao encontrado: {html_path}", file=sys.stderr)
        return 1

    html = read_html(html_path)
    if not clean_text(html):
        print(f"HTML vazio: {html_path}", file=sys.stderr)
        csv_path, xlsx_path = export_rows([], html_path.parent)
        print(f"Arquivos vazios gerados: {csv_path} e {xlsx_path}")
        return 0

    soup = parse_html(html)
    report_rows = extract_report_table(soup)
    if report_rows:
        all_rows = merge_modal_by_id(report_rows, extract_current_emenda_modal(soup))
    else:
        modals = extract_modals(soup)
        table_rows = extract_tables(soup, modals)
        js_rows = extract_js_records(soup)
        all_rows = deduplicate(table_rows + js_rows)

    csv_path, xlsx_path = export_rows(all_rows, html_path.parent)
    print(f"Emendas extraidas: {len(all_rows)}")
    print(f"CSV: {csv_path}")
    print(f"XLSX: {xlsx_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
