#!/usr/bin/env python3
import json, csv, os, re
from collections import defaultdict

TR = "/Users/luisgustavodebiasi/.claude/projects/-Users-luisgustavodebiasi-TRABALHOS-Projetos-Externo-PEPE/2a96e419-9516-4eb9-bfe7-b7081b1fe0cb/tool-results/"
ADS_FILE  = TR + "mcp-claude_ai_meta_mcp-ads_get_ad_entities-1784232869084.txt"
SETS_FILE = TR + "mcp-claude_ai_meta_mcp-ads_get_ad_entities-1784232875497.txt"

BASE = "/Users/luisgustavodebiasi/TRABALHOS/Projetos Externo/PEPE/IMPULSIONAMENTOS"
os.makedirs(BASE + "/dados", exist_ok=True)
os.makedirs(BASE + "/publicos", exist_ok=True)
os.makedirs(BASE + "/relatorios", exist_ok=True)

def money(s):
    if not s or s == "Not available": return 0.0
    s = s.replace("R$", "").replace("BRL", "").replace(" ", "").replace(" ", "").strip()
    s = s.replace(".", "").replace(",", ".")
    try: return round(float(s), 2)
    except: return 0.0

def intnum(s):
    if s is None or s == "Not available": return 0
    s = str(s).replace(".", "").replace(" ", "").replace(" ", "").strip()
    try: return int(s)
    except:
        try: return int(float(s))
        except: return 0

def pct(s):
    if not s or s == "Not available": return 0.0
    s = s.replace("%", "").replace(" ", "").replace(" ", "").replace(",", ".").strip()
    try: return round(float(s), 2)
    except: return 0.0

def load(f):
    with open(f) as fh: d = json.load(fh)
    return json.loads(d["ad_entities"])

ads = load(ADS_FILE)
sets = load(SETS_FILE)

# ---------- CAMPANHAS (embutido) ----------
campaigns = [
 ("120216242475770716","LAP-[Engajamento][view TUBARÃO][Aumento de Visualização]","OUTCOME_ENGAGEMENT","PAUSED","2025-02-11",3374.92,889513,328205,10182,3.79,1.14),
 ("120214284225260716","LAP-[Engajamento][View Brasil][Aumentar Visualização de video][08/12/24]","OUTCOME_ENGAGEMENT","PAUSED","2024-12-18",2411.88,554689,408636,2324,4.35,0.42),
 ("120213903594780716","JFJ - [Engajamento][Video View][Aumentar Visualização de video][02/12/24]","OUTCOME_ENGAGEMENT","EXCLUÍDA",None,2076.01,493790,173570,1591,4.20,0.32),
 ("120240075562730716","LAP- 2026 [ENGAJAMENTO SANTA CATARINA][INSTA][R$70,00]","OUTCOME_ENGAGEMENT","PAUSED","2026-03-26",838.91,237454,153740,2633,3.53,1.11),
 ("120239970345540716","LAP- 2026 [ENGAJAMENTO AMUREL][INSTA][R$70,00]","OUTCOME_ENGAGEMENT","PAUSED","2026-02-03",789.69,201153,116706,2989,3.93,1.49),
 ("120216047481540716","LAP-[FEED PEPE COLLAÇO][feed View][Visualização de Feed][08/02/25][INST R$30,00]","OUTCOME_ENGAGEMENT","PAUSED","2025-02-08",703.92,108528,71412,2737,6.49,2.52),
 ("120242272123350716","AUTISMO - [Santa Catarina]","OUTCOME_ENGAGEMENT","PAUSED","2026-04-02",381.40,72352,39667,973,5.27,1.34),
 ("120239032107950716","PEPE [2026][Visualização][Reels]","LINK_CLICKS","EXCLUÍDA",None,99.94,16135,14588,545,6.19,3.38),
 ("120246784137180716","CAMP-01_CONJ-01","OUTCOME_AWARENESS","ACTIVE","2026-06-29",78.57,16103,12642,296,4.88,1.84),
]
cmap = {c[0]: c[1] for c in campaigns}

with open(BASE + "/dados/campanhas.csv","w",newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["campaign_id","nome","objetivo","status","inicio","gasto_brl","impressoes","alcance","cliques","cpm_brl","ctr_pct"])
    for c in campaigns: w.writerow(c)

# ---------- ANÚNCIOS ----------
ad_rows = []
for a in ads:
    ad_rows.append({
        "id": a.get("id"),
        "nome": a.get("name",""),
        "campaign_id": a.get("campaign_id",""),
        "campanha": cmap.get(str(a.get("campaign_id","")), ""),
        "adset_id": a.get("adset_id",""),
        "objetivo": a.get("objective",""),
        "status": a.get("effective_status",""),
        "gasto_brl": money(a.get("amount_spent")),
        "impressoes": intnum(a.get("impressions")),
        "alcance": intnum(a.get("reach")),
        "cliques": intnum(a.get("clicks")),
        "cpm_brl": money(a.get("cpm")),
        "ctr_pct": pct(a.get("ctr")),
        "engajamento": intnum(a.get("post_engagement")),
        "video_plays": intnum(a.get("video_play_actions")),
    })
ad_rows.sort(key=lambda r: r["gasto_brl"], reverse=True)
with open(BASE + "/dados/anuncios.csv","w",newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(ad_rows[0].keys()))
    w.writeheader(); w.writerows(ad_rows)

# ---------- CONJUNTOS ----------
set_rows = []
for s in sets:
    set_rows.append({
        "id": s.get("id"),
        "nome": s.get("name",""),
        "campaign_id": s.get("campaign_id",""),
        "campanha": cmap.get(str(s.get("campaign_id","")), ""),
        "otimizacao": s.get("optimization_goal",""),
        "status": s.get("effective_status",""),
        "gasto_brl": money(s.get("amount_spent")),
        "impressoes": intnum(s.get("impressions")),
        "alcance": intnum(s.get("reach")),
        "cliques": intnum(s.get("clicks")),
        "cpm_brl": money(s.get("cpm")),
        "ctr_pct": pct(s.get("ctr")),
        "orcamento_diario_brl": money(s.get("daily_budget")),
        "orcamento_total_brl": money(s.get("lifetime_budget")),
    })
set_rows.sort(key=lambda r: r["gasto_brl"], reverse=True)
with open(BASE + "/dados/conjuntos.csv","w",newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(set_rows[0].keys()))
    w.writeheader(); w.writerows(set_rows)

# ---------- PÚBLICOS ----------
audiences = [
 ("120246609105170716","Semelhante (3% to 6%) - autismo","LOOKALIKE","ACTIVE","2026-06-11","~1.000"),
 ("120246609101900716","Semelhante (3%) - autismo","LOOKALIKE","ACTIVE","2026-06-11","~1.000"),
 ("120242526060940716","cadastro ok fone.csv","CUSTOM (lista)","ACTIVE","2026-04-08","1.100–1.300"),
 ("120214284492970716","autismo","PLATFORM (salvo)","ACTIVE","2024-12-18","42.200–49.700"),
]
with open(BASE + "/dados/publicos.csv","w",newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["audience_id","nome","tipo","status","criado_em","tamanho_estimado"])
    for a in audiences: w.writerow(a)

# ---------- CONTAS ----------
accounts = [
 ("1700449990528437","CA - PEPE COLLAÇO - OFICIAL","Pepê Collaço","ACTIVE","SIM","SIM","PRINCIPAL do mandato"),
 ("943250046537320","LIBRAS.SE AD","Libras.se ADM","ACTIVE","SIM","SIM","Outro projeto"),
 ("483724714338806","CA01","Bm - 4794","ACTIVE","SIM","SIM","Genérica / reserva"),
 ("418322638313693","(sem nome)","(sem business)","ACTIVE","SIM","SIM","Sem nome"),
 ("1449554698720212","Libras-se","Luis Gustavo Debiasi","UNSETTLED","SIM","NÃO","Pendência de pagamento"),
 ("245426087522660","MOVIMENTO SOU BEM","SOU BEM","UNSETTLED","SIM","NÃO","Pendência de pagamento"),
 ("1283592963985064","Expedito Michels - Pré","Expeditooficial","ACTIVE","NÃO","SIM","MCP não liberado (rollout)"),
 ("301936120","(sem nome)","(sem business)","CLOSED","SIM","NÃO","Conta fechada"),
]
with open(BASE + "/dados/contas_meta_ads.csv","w",newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["ad_account_id","nome","business","status","mcp_habilitado","consultavel","observacao"])
    for a in accounts: w.writerow(a)

# ================= AGREGADOS p/ relatório =================
def s(rows, k): return sum(r[k] for r in rows)
tot_spend = s(ad_rows,"gasto_brl"); tot_imp = s(ad_rows,"impressoes")
tot_reach = s(ad_rows,"alcance"); tot_clk = s(ad_rows,"cliques")

print("=== TOTAIS (soma anúncios) ===")
print(f"anuncios={len(ad_rows)} gasto={tot_spend:.2f} imp={tot_imp} clk={tot_clk}")

# status
st = defaultdict(lambda: [0,0.0])
for r in ad_rows:
    st[r["status"]][0]+=1; st[r["status"]][1]+=r["gasto_brl"]
print("\n=== STATUS DOS ANÚNCIOS ===")
for k,v in sorted(st.items(), key=lambda x:-x[1][1]): print(f"{k}: {v[0]} anúncios, R${v[1]:.2f}")

# objetivo
ob = defaultdict(lambda: [0,0.0])
for r in ad_rows:
    ob[r["objetivo"]][0]+=1; ob[r["objetivo"]][1]+=r["gasto_brl"]
print("\n=== OBJETIVO ===")
for k,v in sorted(ob.items(), key=lambda x:-x[1][1]): print(f"{k}: {v[0]} anúncios, R${v[1]:.2f}")

# temas por keyword
themes = [
 ("Autismo/TEA", r"autis|tea|equoter|sensorial"),
 ("Tubarão", r"tubar"),
 ("AMUREL", r"amurel"),
 ("Santa Catarina", r"santa catarina|\bsc\b|\bcatarin"),
 ("Brasil", r"brasil"),
 ("Laguna", r"laguna"),
 ("Saúde", r"saude|saúde|hospital|exame"),
 ("Infra/Obras", r"pavimenta|obra|rodovia|sc-370|br-101|ponte|dragagem"),
]
th = defaultdict(lambda: [0,0.0]); outros=[0,0.0]
for r in ad_rows:
    nm = r["nome"].lower(); hit=False
    for name,pat in themes:
        if re.search(pat, nm): th[name][0]+=1; th[name][1]+=r["gasto_brl"]; hit=True
    if not hit: outros[0]+=1; outros[1]+=r["gasto_brl"]
print("\n=== TEMAS (por palavra-chave no nome, pode sobrepor) ===")
for name,_ in themes:
    if th[name][0]: print(f"{name}: {th[name][0]} anúncios, R${th[name][1]:.2f}")
print(f"Sem tema mapeado: {outros[0]} anúncios, R${outros[1]:.2f}")

print("\n=== TOP 12 ANÚNCIOS POR GASTO ===")
for r in ad_rows[:12]:
    print(f"R${r['gasto_brl']:.2f} | reach {r['alcance']} | CTR {r['ctr_pct']}% | {r['nome'][:70]}")

print("\n=== TOP 8 ANÚNCIOS POR ALCANCE ===")
for r in sorted(ad_rows, key=lambda x:-x['alcance'])[:8]:
    print(f"reach {r['alcance']} | R${r['gasto_brl']:.2f} | CTR {r['ctr_pct']}% | {r['nome'][:70]}")

print("\n=== TOP 8 ANÚNCIOS POR CTR (gasto>=R$20) ===")
for r in sorted([x for x in ad_rows if x['gasto_brl']>=20], key=lambda x:-x['ctr_pct'])[:8]:
    print(f"CTR {r['ctr_pct']}% | R${r['gasto_brl']:.2f} | reach {r['alcance']} | {r['nome'][:60]}")

print("\nArquivos gerados em:", BASE)
