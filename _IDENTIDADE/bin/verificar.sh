#!/usr/bin/env bash
# Confere se os assets vendorizados nos apps ainda batem com o manifesto.
#
# Serve de alarme para o caso mais provável de desvio: alguém edita um token ou
# troca um logo direto dentro de um app, e a identidade passa a divergir entre
# site, sistema e material impresso sem ninguém perceber. Rode antes de publicar.
set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE="$(cd "$RAIZ/.." && pwd)"

alvos=(
  "$BASE/pepecollaco-site|assets/brand"
  "$BASE/PEPECOPY/credenciamento-next|public/brand"
  "$BASE/gerador-materiais|public/brand"
)

falhas=0
for alvo in "${alvos[@]}"; do
  app="${alvo%%|*}"; sub="${alvo##*|}"
  nome="$(basename "$app")"
  if [ ! -f "$app/$sub/MANIFESTO.json" ]; then
    echo "  $nome: sem manifesto — rode ./bin/sincronizar.sh"
    falhas=$((falhas + 1))
    continue
  fi
  python3 - "$app/$sub" "$nome" <<'PY' || falhas=$((falhas + 1))
import hashlib, json, sys
from pathlib import Path

pasta, nome = Path(sys.argv[1]), sys.argv[2]
manifesto = json.loads((pasta / "MANIFESTO.json").read_text(encoding="utf-8"))
esperado = manifesto["arquivos"]

divergentes, faltando = [], []
for rel, h in esperado.items():
    f = pasta / rel
    if not f.exists():
        faltando.append(rel)
    elif hashlib.sha256(f.read_bytes()).hexdigest() != h:
        divergentes.append(rel)

extras = [
    str(f.relative_to(pasta))
    for f in pasta.rglob("*")
    if f.is_file() and f.name != "MANIFESTO.json" and str(f.relative_to(pasta)) not in esperado
]

if divergentes or faltando or extras:
    print(f"  {nome}: v{manifesto['versao']} — DIVERGENTE")
    for r in divergentes[:5]: print(f"      editado no app: {r}")
    for r in faltando[:5]:    print(f"      faltando:       {r}")
    for r in extras[:5]:      print(f"      fora do pacote: {r}")
    print("      corrija em _IDENTIDADE/ e rode ./bin/sincronizar.sh")
    sys.exit(1)

print(f"  {nome}: v{manifesto['versao']} — {len(esperado)} arquivos conferem")
PY
done

echo
# Todo url() de CSS precisa ter arquivo servido do outro lado. O build não pega
# isto: um @font-face apontando para um caminho inexistente compila sem reclamar
# e só aparece em produção, com o app inteiro caindo no fallback do sistema.
python3 - "$BASE" <<'PY' || falhas=$((falhas + 1))
import re, sys
from pathlib import Path

base = Path(sys.argv[1])
# (css a inspecionar, raiz a partir da qual o caminho absoluto é servido)
alvos = [
    (base / "PEPECOPY/credenciamento-next/app/globals.css",     base / "PEPECOPY/credenciamento-next/public"),
    (base / "PEPECOPY/credenciamento-next/app/brand/tokens.css", base / "PEPECOPY/credenciamento-next/public"),
    (base / "gerador-materiais/app/brand/tokens.css",            base / "gerador-materiais/public"),
    (base / "pepecollaco-site/assets/brand/css/tokens.css",      base / "pepecollaco-site/assets/brand/css"),
    (base / "pepecollaco-site/assets/brand/css/tipografia.css",  base / "pepecollaco-site/assets/brand/css"),
]

faltando = []
checados = 0
for css, raiz in alvos:
    if not css.exists():
        continue
    texto = css.read_text(encoding="utf-8")
    for url in sorted(set(re.findall(r'url\("([^"]+)"\)', texto))):
        if url.startswith(("data:", "http")):
            continue
        alvo = (raiz / url.lstrip("/")) if url.startswith("/") else (css.parent / url)
        checados += 1
        if not alvo.resolve().exists():
            faltando.append(f"{css.relative_to(base)} -> {url}")

if faltando:
    print(f"  assets de CSS: {len(faltando)} referência(s) QUEBRADA(S)")
    for f in faltando:
        print(f"      {f}")
    sys.exit(1)
print(f"  assets de CSS: {checados} referências resolvem")
PY

python3 "$RAIZ/bin/contraste.py" > /dev/null 2>&1 \
  && echo "  contraste: conforme" \
  || { echo "  contraste: FALHOU — rode python3 bin/contraste.py"; falhas=$((falhas + 1)); }

echo
if [ "$falhas" -gt 0 ]; then
  echo "$falhas verificação(ões) falharam."
  exit 1
fi
echo "Identidade íntegra nos três apps."
