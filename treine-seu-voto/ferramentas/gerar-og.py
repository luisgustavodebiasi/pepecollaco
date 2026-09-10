#!/usr/bin/env python3
"""Desenha o cartão de compartilhamento, 1200x630.

O cartão é a peça que mais gente vê: num grupo de WhatsApp, a prévia do link
aparece para todo mundo e só uma parte clica. Então ele tem de fazer sozinho o
trabalho da página: mostrar o aparelho, mostrar o número, e convidar.

Regras da identidade que mandam aqui (ver `_IDENTIDADE/CLAUDE.md`):

  - O fundo é o `fundo-og-1200.jpg`, que já traz o degradê e a textura de setas
    no formato exato. Toda peça de compartilhamento leva a textura, sem exceção:
    um retângulo azul liso poderia ser de qualquer campanha.
  - Texto sobre o degradê pede véu. O amarelo sobre o claro do degradê dá 2,66 e
    reprova; com o véu de 0,72 sobre a metade esquerda ele sobe para 7,7.
  - A marca é sempre imagem, e aqui é a REDUZIDA, sem o número, porque o 11223
    já está grande na tela do aparelho e repetir seria ruído.

    python3 ferramentas/gerar-og.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
IDENT = RAIZ.parent / "_IDENTIDADE" / "dist"
SAIDA = RAIZ / "public" / "img" / "og-treino.jpg"

L, A = 1200, 630
ESCALA = 2  # desenha no dobro e reduz: bordas e cantos saem sem serrilha

TINTA = (6, 26, 58)
AMARELO = (255, 196, 0)
AZUL_CLARO = (139, 193, 220)
BRANCO = (255, 255, 255)
CORPO = (228, 228, 228)
CORPO_BORDA = (189, 189, 189)
MOLDURA = (18, 18, 18)
TELA = (255, 255, 255)
CINZA_TELA = (91, 91, 91)
TECLA = (42, 42, 42)
VERDE = (34, 177, 76)
LARANJA = (232, 84, 31)


def fonte(nome, tamanho):
    return ImageFont.truetype(str(IDENT / "fontes" / nome), tamanho * ESCALA)


def px(v):
    return v * ESCALA


def caixa(d, x0, y0, x1, y1, raio, cor, borda=None, largura=1):
    d.rounded_rectangle(
        [px(x0), px(y0), px(x1), px(y1)],
        radius=px(raio),
        fill=cor,
        outline=borda,
        width=px(largura) if borda else 0,
    )


def escrever(d, x, y, texto, f, cor, tracking=0):
    """Pillow não tem entrelinha de caractere; para tracking desenha letra a letra."""
    if tracking == 0:
        d.text((px(x), px(y)), texto, font=f, fill=cor)
        return
    cx = px(x)
    for c in texto:
        d.text((cx, px(y)), c, font=f, fill=cor)
        cx += d.textlength(c, font=f) + px(tracking)


def main():
    fundo = Image.open(IDENT / "fundo" / "fundo-og-1200.jpg").convert("RGB")
    fundo = fundo.resize((px(L), px(A)), Image.LANCZOS)
    tela = fundo.convert("RGBA")

    # ── véu na metade esquerda, para o texto ter contraste sem apagar a textura
    veu = Image.new("RGBA", tela.size, (0, 0, 0, 0))
    dv = ImageDraw.Draw(veu)
    for i in range(px(L)):
        t = i / px(L)
        # forte até 45% da largura, some até 78%
        a = 0.74 if t < 0.45 else max(0.0, 0.74 * (1 - (t - 0.45) / 0.33))
        dv.line([(i, 0), (i, px(A))], fill=(6, 26, 58, int(a * 255)))
    tela = Image.alpha_composite(tela, veu)

    d = ImageDraw.Draw(tela)

    # ── coluna da esquerda ────────────────────────────────────────────────
    f_sobrancelha = fonte("acumin-700.otf", 20)
    f_titulo = fonte("acumin-wide-900.otf", 82)
    f_texto = fonte("acumin-400.otf", 29)
    f_cta = fonte("acumin-700.otf", 27)
    f_nota = fonte("acumin-400.otf", 15)

    escrever(d, 76, 92, "URNA DE TREINO", f_sobrancelha, AMARELO, tracking=4)
    d.text((px(76), px(130)), "TREINE", font=f_titulo, fill=BRANCO)
    d.text((px(76), px(213)), "SEU VOTO", font=f_titulo, fill=BRANCO)

    d.text((px(76), px(320)), "Digite 11223 numa urna de mentira", font=f_texto, fill=AZUL_CLARO)
    d.text((px(76), px(357)), "até decorar. Leva trinta segundos.", font=f_texto, fill=AZUL_CLARO)

    # chamada, no par de botão canônico da identidade: amarelo com texto tinta
    largura_cta = d.textlength("vote.pepecollaco.com", font=f_cta) / ESCALA
    caixa(d, 76, 415, 76 + largura_cta + 44, 469, 27, AMARELO)
    d.text((px(98), px(428)), "vote.pepecollaco.com", font=f_cta, fill=TINTA)

    marca = Image.open(IDENT / "marca" / "reduzida-escuro-1600.png").convert("RGBA")
    alt = px(58)
    marca = marca.resize((round(alt * marca.width / marca.height), alt), Image.LANCZOS)
    tela.alpha_composite(marca, (px(76), px(508)))

    escrever(d, 76, 588, "Simulação não oficial · peça de campanha", f_nota, (255, 255, 255, 130))

    # ── o aparelho, à direita ─────────────────────────────────────────────
    ux0, uy0, ux1, uy1 = 648, 74, 1136, 566

    sombra = Image.new("RGBA", tela.size, (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rounded_rectangle(
        [px(ux0 + 6), px(uy0 + 16), px(ux1 + 6), px(uy1 + 18)],
        radius=px(22), fill=(2, 10, 28, 150),
    )
    tela = Image.alpha_composite(tela, sombra.filter(ImageFilter.GaussianBlur(px(14))))
    d = ImageDraw.Draw(tela)

    caixa(d, ux0, uy0, ux1, uy1, 22, CORPO, CORPO_BORDA, 1)

    # moldura preta e tela branca
    mx0, my0, mx1, my1 = ux0 + 20, uy0 + 20, ux1 - 20, uy0 + 322
    caixa(d, mx0, my0, mx1, my1, 9, MOLDURA)
    tx0, ty0, tx1, ty1 = mx0 + 11, my0 + 11, mx1 - 11, my1 - 11
    caixa(d, tx0, ty0, tx1, ty1, 2, TELA)

    f_cargo = fonte("acumin-700.otf", 20)
    f_rot = fonte("acumin-400.otf", 15)
    f_nome = fonte("acumin-700.otf", 19)
    f_urna = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", px(44))

    d.text((px(tx0 + 18), px(ty0 + 16)), "DEPUTADO ESTADUAL", font=f_cargo, fill=(20, 20, 20))
    escrever(d, tx1 - 74, ty0 + 19, "TREINO", fonte("acumin-700.otf", 12), CINZA_TELA, tracking=1.6)

    # as caixas do número, com o 11223 aceso na cor da campanha
    cx, cy, cw, ch, vao = tx0 + 18, ty0 + 62, 54, 68, 8
    for i, dig in enumerate("11223"):
        x = cx + i * (cw + vao)
        caixa(d, x, cy, x + cw, cy + ch, 2, AMARELO, TINTA, 2)
        w = d.textlength(dig, font=f_urna)
        d.text((px(x + cw / 2) - w / 2, px(cy + 12)), dig, font=f_urna, fill=TINTA)

    d.text((px(cx), px(cy + ch + 22)), "Nome de urna:", font=f_rot, fill=CINZA_TELA)
    d.text((px(cx), px(cy + ch + 42)), "PEPÊ COLLAÇO", font=f_nome, fill=(20, 20, 20))
    d.text((px(cx + 176), px(cy + ch + 22)), "Partido:", font=f_rot, fill=CINZA_TELA)
    d.text((px(cx + 176), px(cy + ch + 42)), "PP", font=f_nome, fill=(20, 20, 20))

    # régua e bloco de instrução, presos no pé da tela: é o que dá à tela a
    # silhueta do aparelho de verdade em vez de um bloco de texto no topo
    f_inst = fonte("acumin-400.otf", 15)
    f_inst_forte = fonte("acumin-700.otf", 15)
    ry = ty1 - 74
    d.line([px(tx0 + 18), px(ry), px(tx1 - 18), px(ry)], fill=(201, 201, 201), width=px(1))
    d.text((px(tx0 + 18), px(ry + 10)), "Aperte a tecla:", font=f_inst, fill=CINZA_TELA)
    d.text((px(tx0 + 18), px(ry + 31)), "CONFIRMA", font=f_inst_forte, fill=(20, 20, 20))
    lc = d.textlength("CONFIRMA ", font=f_inst_forte) / ESCALA
    d.text((px(tx0 + 18 + lc), px(ry + 31)), "para confirmar este voto", font=f_inst, fill=CINZA_TELA)
    d.text((px(tx0 + 18), px(ry + 51)), "CORRIGE", font=f_inst_forte, fill=(20, 20, 20))
    lr = d.textlength("CORRIGE ", font=f_inst_forte) / ESCALA
    d.text((px(tx0 + 18 + lr), px(ry + 51)), "para reiniciar este voto", font=f_inst, fill=CINZA_TELA)

    # a fotografia, no campo claro da tela
    fx0, fy0 = tx1 - 104, ty0 + 62
    caixa(d, fx0, fy0, fx0 + 86, fy0 + 115, 2, (238, 243, 248), (201, 201, 201), 1)
    foto = Image.open(IDENT / "foto" / "pepe-busto-1400.webp").convert("RGBA")
    alt_f = px(112)
    foto = foto.resize((round(alt_f * foto.width / foto.height), alt_f), Image.LANCZOS)
    tela.alpha_composite(foto, (px(fx0 + 43) - foto.width // 2, px(fy0 + 3)))
    d = ImageDraw.Draw(tela)

    # ── teclado ────────────────────────────────────────────────────────────
    kx0, ky0, kx1 = ux0 + 20, my1 + 16, ux1 - 20
    vaok = 8
    unidade = ((kx1 - kx0) - 3 * vaok) / 4.55
    largura_num = unidade
    largura_acao = unidade * 1.55
    altura_k = 38

    f_num = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", px(38))
    f_rotk = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", px(17))

    for linha in range(3):
        for col in range(3):
            n = str(linha * 3 + col + 1)
            x = kx0 + col * (largura_num + vaok)
            y = ky0 + linha * (altura_k + vaok)
            caixa(d, x, y, x + largura_num, y + altura_k, 5, TECLA)
            d.text((px(x + 9), px(y + 1)), n, font=f_num, fill=BRANCO)

    xa = kx0 + 3 * (largura_num + vaok)
    for i, (rot, cor, cort) in enumerate(
        [("BRANCO", (242, 242, 242), (16, 16, 16)), ("CORRIGE", LARANJA, (16, 16, 16))]
    ):
        y = ky0 + i * (altura_k + vaok)
        caixa(d, xa, y, xa + largura_acao, y + altura_k, 5, cor)
        d.text((px(xa + 8), px(y + 8)), rot, font=f_rotk, fill=cort)

    y = ky0 + 2 * (altura_k + vaok)
    caixa(d, xa, y, xa + largura_acao, y + altura_k, 5, VERDE)
    d.text((px(xa + 8), px(y + 8)), "CONFIRMA", font=f_rotk, fill=(16, 16, 16))

    # o zero, na primeira coluna da quarta linha
    y = ky0 + 3 * (altura_k + vaok)
    caixa(d, kx0, y, kx0 + largura_num, y + altura_k, 5, TECLA)
    d.text((px(kx0 + 9), px(y + 1)), "0", font=f_num, fill=BRANCO)

    saida = tela.convert("RGB").resize((L, A), Image.LANCZOS)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    saida.save(SAIDA, "JPEG", quality=92, optimize=True, progressive=True)
    print(f"{SAIDA}  {SAIDA.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
