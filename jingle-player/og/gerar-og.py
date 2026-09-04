#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Monta o cartão de compartilhamento (open graph, 1200x630) do player de jingles.

Mesma receita das capas do Spotify: HTML com os assets embutidos em base64, o
Chrome headless rasteriza e o magick converte para JPEG. Base64 porque o Chrome
headless com file:// não carrega sub-recursos de forma confiável.

    python3 og/gerar-og.py        # escreve img/og.jpg

ATENÇÃO ao trocar o cartão depois de divulgado: o WhatsApp e o Facebook guardam
a prévia POR URL, por semanas, e não relêem o arquivo só porque ele mudou. Para
um cartão novo aparecer de fato, **mude o nome do arquivo** (og-2.jpg) e atualize
as meta tags `og:image`, `og:image:secure_url` e `twitter:image` no index.html.
Sobrescrever img/og.jpg deixa a prévia velha rodando nos grupos.
"""
import base64, pathlib, subprocess, sys

AQUI = pathlib.Path(__file__).resolve().parent
APP  = AQUI.parent
ID   = APP.parent / "_IDENTIDADE" / "dist"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def b64(caminho, mime):
    dados = pathlib.Path(caminho).read_bytes()
    return f"data:{mime};base64," + base64.b64encode(dados).decode()

def fonte(nome, arquivo, peso):
    return (f"@font-face{{font-family:'{nome}';src:url({b64(ID/'fontes'/arquivo,'font/woff2')}) "
            f"format('woff2');font-weight:{peso};font-style:normal}}")

FUNDO   = b64(ID / "fundo" / "fundo-og-1200.jpg", "image/jpeg")
SETA    = b64(ID / "simbolo" / "seta-256.png", "image/png")
CAPA_1  = b64(APP / "img" / "capa-03.webp", "image/webp")   # funk, faixa 1
CAPA_2  = b64(APP / "img" / "capa-01.webp", "image/webp")   # sertanejo
CAPA_3  = b64(APP / "img" / "capa-02.webp", "image/webp")   # pagode

FONTES = "".join([
    fonte("Acumin Pro",      "acumin-400.woff2",      400),
    fonte("Acumin Pro",      "acumin-700.woff2",      700),
    fonte("Acumin Pro Wide", "acumin-wide-275.woff2", 275),
    fonte("Acumin Pro Wide", "acumin-wide-900.woff2", 900),
    fonte("Granesta",        "granesta-ptbr.woff2",   400),
])

HTML = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
{FONTES}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1200px;height:630px;overflow:hidden}}
.cartao{{position:relative;width:1200px;height:630px;
  background:url({FUNDO}) center/cover no-repeat;font-family:'Acumin Pro',sans-serif}}

/* Véu. A regra de contraste nº 5 da identidade: sem ele o amarelo sobre o claro
   do degradê (#0082BF) dá 2,66 e reprova. Em 0,78 sobe para 5,84 e a textura de
   setas continua visível, que é o limite que o guia manda respeitar. */
.veu{{position:absolute;inset:0;
  background:linear-gradient(96deg,rgba(6,26,58,.80) 0%,rgba(6,26,58,.78) 42%,
                                   rgba(6,26,58,.34) 68%,rgba(6,26,58,0) 88%)}}

.conteudo{{position:absolute;inset:0;display:flex;align-items:center;padding:0 64px}}

.esquerda{{width:615px;position:relative;z-index:2}}
.sobrancelha{{display:flex;align-items:center;gap:11px;margin-bottom:26px}}
.sobrancelha img{{width:30px;height:30px;object-fit:contain}}
.sobrancelha span{{font:700 19px/1 'Acumin Pro';letter-spacing:.17em;color:#8BC1DC;text-transform:uppercase}}

/* O lockup da assinatura tem três degraus e ordem fixa: QUEM na Extra Light
   apagada, FAZ na Black dominante, REPRESENTA no pincel amarelo. */
.quem{{font:275 46px/1 'Acumin Pro Wide';letter-spacing:.03em;color:rgba(255,255,255,.62)}}
.faz{{font:900 108px/.86 'Acumin Pro Wide';letter-spacing:-.012em;color:#fff;margin:2px 0 4px}}
.representa{{font:400 84px/.9 'Granesta';color:#FFC400;text-transform:uppercase}}

.detalhe{{margin-top:30px;font:400 22px/1.45 'Acumin Pro';color:#8BC1DC}}
.detalhe b{{color:#fff;font-weight:700}}
.pilula{{display:inline-block;margin-top:22px;padding:15px 30px;border-radius:999px;
  background:#FFC400;color:#061A3A;font:700 24px/1 'Acumin Pro';letter-spacing:.01em}}

/* Capas em cascata, todas de pé: a seta da marca dentro delas não pode girar. */
.direita{{position:absolute;right:52px;top:0;bottom:0;width:470px;z-index:1}}
.capa{{position:absolute;border-radius:20px;overflow:hidden;
  box-shadow:0 26px 60px rgba(3,12,30,.62), 0 0 0 1px rgba(255,255,255,.11) inset}}
.capa img{{width:100%;height:100%;object-fit:cover;display:block}}
.c3{{width:250px;height:250px;right:214px;top:112px;opacity:.42;filter:saturate(.85)}}
.c2{{width:288px;height:288px;right:130px;top:150px;opacity:.72}}
.c1{{width:340px;height:340px;right:14px;top:196px}}

/* Encostado na quina inferior esquerda da capa da frente: ali não cobre o
   título da faixa nem o 11223 do lockup, que são o que precisa ficar legível. */
.play{{position:absolute;right:384px;top:468px;width:104px;height:104px;border-radius:50%;
  background:#FFC400;box-shadow:0 14px 38px rgba(255,196,0,.42);
  display:flex;align-items:center;justify-content:center;z-index:3}}
.play svg{{width:42px;height:42px;fill:#061A3A;margin-left:7px}}

.aviso{{position:absolute;left:64px;bottom:34px;z-index:2;
  font:700 13px/1 'Acumin Pro';letter-spacing:.10em;color:rgba(255,255,255,.80)}}
</style></head><body>
<div class="cartao">
  <div class="veu"></div>

  <div class="direita">
    <div class="capa c3"><img src="{CAPA_3}"></div>
    <div class="capa c2"><img src="{CAPA_2}"></div>
    <div class="capa c1"><img src="{CAPA_1}"></div>
  </div>
  <div class="play"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></div>

  <div class="conteudo">
    <div class="esquerda">
      <div class="sobrancelha"><img src="{SETA}"><span>Os jingles da campanha</span></div>
      <div class="quem">QUEM</div>
      <div class="faz">FAZ</div>
      <div class="representa">Representa</div>
      <p class="detalhe"><b>3 faixas para tocar na rua.</b><br>Funciona sem internet, na carreata inteira.</p>
      <div class="pilula">jingle.pepecollaco.com</div>
    </div>
  </div>

  <div class="aviso">CONTEÚDO PRODUZIDO COM USO DE INTELIGÊNCIA ARTIFICIAL</div>
</div>
</body></html>"""

def main():
    html = AQUI / "og.html"
    png  = AQUI / "og.png"
    jpg  = APP / "img" / "og.jpg"
    html.write_text(HTML, encoding="utf-8")
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--hide-scrollbars",
                    "--force-device-scale-factor=1", "--window-size=1200,630",
                    f"--screenshot={png}", f"file://{html}"], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(["magick", str(png), "-quality", "88", "-strip", str(jpg)], check=True)
    png.unlink(); html.unlink()
    print(f"✓ {jpg.relative_to(APP)}  ({jpg.stat().st_size/1024:.0f} KB)")

if __name__ == "__main__":
    sys.exit(main())
