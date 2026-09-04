# -*- coding: utf-8 -*-
"""
Granesta não tem nenhuma letra acentuada: escreve QUEM FAZ REPRESENTA, mas não
escreve Tubarão, Collaço nem educação. Os sinais soltos (til, cedilha, agudo,
circunflexo, grave, trema) estão lá como glifos independentes.

Este script compõe as letras que faltam: desenha a base, desenha o sinal por
cima (ou por baixo, no caso da cedilha) e grava o resultado como glifo novo.

O sinal é centrado sobre a FAIXA DE CIMA da letra, não sobre a caixa inteira.
A Granesta é muito inclinada: centrar pela caixa toda joga o til para trás do
pico da letra.
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.boundsPen import BoundsPen

ENTRADA = sys.argv[1] if len(sys.argv) > 1 else '/Users/luisgustavodebiasi/Downloads/Granesta.otf'
SAIDA   = sys.argv[2] if len(sys.argv) > 2 else 'Granesta-PTBR.otf'

# base, sinal, nome do glifo novo, caractere
ACENTOS = [
    ('A','acute','Aacute','Á'), ('A','grave','Agrave','À'), ('A','circumflex','Acircumflex','Â'),
    ('A','tilde','Atilde','Ã'), ('A','dieresis','Adieresis','Ä'),
    ('E','acute','Eacute','É'), ('E','grave','Egrave','È'), ('E','circumflex','Ecircumflex','Ê'),
    ('E','dieresis','Edieresis','Ë'),
    ('I','acute','Iacute','Í'), ('I','grave','Igrave','Ì'), ('I','circumflex','Icircumflex','Î'),
    ('I','dieresis','Idieresis','Ï'),
    ('O','acute','Oacute','Ó'), ('O','grave','Ograve','Ò'), ('O','circumflex','Ocircumflex','Ô'),
    ('O','tilde','Otilde','Õ'), ('O','dieresis','Odieresis','Ö'),
    ('U','acute','Uacute','Ú'), ('U','grave','Ugrave','Ù'), ('U','circumflex','Ucircumflex','Û'),
    ('U','dieresis','Udieresis','Ü'),
    ('N','tilde','Ntilde','Ñ'),
    ('C','cedilla','Ccedilla','Ç'),
]
# a Granesta é unicase: a "minúscula" é um desenho alternativo da maiúscula,
# na mesma altura. Então cada acentuada precisa das duas versões.
MINUSCULAS = [(b.lower(), s, n.lower() if n != 'Ccedilla' else 'ccedilla', c.lower())
              for (b, s, n, c) in ACENTOS]

FOLGA_CIMA = 35   # respiro entre o pico da letra e o sinal


def faixa(glifos, nome, fracao=0.62, topo=True):
    """x médio da faixa alta (ou baixa) da letra: é ali que o sinal encaixa.

    Centrar pela caixa inteira não serve numa fonte tão inclinada: o pico da
    letra fica bem à direita do centro geométrico, e o til sairia atrasado."""
    rec = RecordingPen()
    glifos[nome].draw(rec)
    pontos = [p for _, args in rec.value for p in args if isinstance(p, tuple)]
    if not pontos:
        return None, None, None
    ymax = max(y for _, y in pontos)
    ymin = min(y for _, y in pontos)
    if topo:
        corte = ymin + (ymax - ymin) * fracao
        faixa_x = [x for x, y in pontos if y >= corte]
    else:
        corte = ymin + (ymax - ymin) * (1 - fracao)
        faixa_x = [x for x, y in pontos if y <= corte]
    faixa_x = faixa_x or [x for x, _ in pontos]
    return (min(faixa_x) + max(faixa_x)) / 2, ymax, ymin


def limites(glifos, nome):
    bp = BoundsPen(glifos)
    glifos[nome].draw(bp)
    return bp.bounds


def arrumar_metricas(fonte, glifos):
    """A Granesta original já vinha com a altura de linha zerada (hhea.ascent e
    hhea.descent = 0) e com a caixa de recorte declarada em 759, enquanto os
    sinais soltos dela já subiam a 1059. Ou seja: o topo dos acentos era
    cortado antes mesmo de eu mexer. Com as letras compostas o estouro fica
    maior ainda, então aqui a fonte passa a declarar a altura que ela tem de
    verdade.

    As métricas tipográficas (sTypo*) ficam como estavam e o bit USE_TYPO
    segue desligado, então quem renderiza usa hhea/win e nada é cortado."""
    from fontTools.pens.boundsPen import BoundsPen
    topo, base = None, None
    for nome in fonte.getGlyphOrder():
        bp = BoundsPen(glifos)
        try:
            glifos[nome].draw(bp)
        except Exception:
            continue
        if not bp.bounds:
            continue
        topo = bp.bounds[3] if topo is None else max(topo, bp.bounds[3])
        base = bp.bounds[1] if base is None else min(base, bp.bounds[1])

    import math
    topo, base = int(math.ceil(topo)), int(math.floor(base))
    fonte['head'].yMax, fonte['head'].yMin = topo, base
    fonte['hhea'].ascent, fonte['hhea'].descent, fonte['hhea'].lineGap = topo, base, 0
    fonte['OS/2'].usWinAscent, fonte['OS/2'].usWinDescent = topo, abs(base)
    print('  métricas verticais: %d / %d (antes 759 / -259)' % (topo, base))


def principal():
    fonte = TTFont(ENTRADA)
    glifos = fonte.getGlyphSet()
    cff = fonte['CFF '].cff
    topo = cff[cff.fontNames[0]]
    charstrings = topo.CharStrings
    hmtx = fonte['hmtx']
    ordem = fonte.getGlyphOrder()
    existentes = set(ordem)

    novos = []
    for base, sinal, nome, letra in ACENTOS + MINUSCULAS:
        if base not in existentes or sinal not in existentes:
            print('  pulei %s (falta %s ou %s)' % (nome, base, sinal)); continue
        if nome in existentes:
            print('  pulei %s (já existe)' % nome); continue

        pe = (sinal == 'cedilla')
        cx_base, ytopo, _ = faixa(glifos, base, topo=not pe)
        ls = limites(glifos, sinal)
        if cx_base is None or ls is None:
            print('  pulei %s (glifo vazio)' % nome); continue

        dx = cx_base - (ls[0] + ls[2]) / 2
        # A cedilha já nasce desenhada abaixo da linha de base, do jeito que o
        # desenhista pensou: ali ela só precisa achar o x certo. Os sinais de
        # cima nascem na altura de caixa alta e colidiriam com o pico da letra,
        # então sobem até o topo dela mais um respiro.
        dy = 0 if pe else ytopo + FOLGA_CIMA - ls[1]

        largura = hmtx[base][0]
        caneta = T2CharStringPen(largura, glifos)
        glifos[base].draw(caneta)
        glifos[sinal].draw(TransformPen(caneta, (1, 0, 0, 1, dx, dy)))

        # CharStrings.__setitem__ só troca glifo existente; para acrescentar é
        # preciso empurrar no índice e registrar o nome no charset à mão.
        cs = caneta.getCharString(private=topo.Private, globalSubrs=charstrings.globalSubrs)
        charstrings.charStrings[nome] = len(charstrings.charStringsIndex)
        charstrings.charStringsIndex.append(cs)
        topo.charset.append(nome)
        hmtx[nome] = (largura, hmtx[base][1])
        novos.append((nome, letra))

    # Em fonte CFF a glyphOrder É a lista charset, o mesmo objeto. Somar
    # "ordem + novos" contava cada acentuada duas vezes, porque o append no
    # charset já tinha crescido a ordem. A verdade é o charset.
    nova_ordem = list(topo.charset)
    fonte.setGlyphOrder(nova_ordem)
    if hasattr(fonte, '_reverseGlyphOrderDict'):
        del fonte._reverseGlyphOrderDict
    # sem isto o hmtx sai com mais entradas do que a fonte declara ter glifos,
    # e o arquivo salvo não abre
    fonte['maxp'].numGlyphs = len(nova_ordem)

    for tabela in fonte['cmap'].tables:
        if tabela.isUnicode():
            for nome, letra in novos:
                tabela.cmap[ord(letra)] = nome

    arrumar_metricas(fonte, glifos)

    nome_novo = 'Granesta PT-BR'
    for registro in fonte['name'].names:
        if registro.nameID in (1, 3, 4, 6, 16):
            texto = registro.toUnicode().replace('Granesta', nome_novo if registro.nameID != 6 else 'Granesta-PTBR')
            registro.string = texto
    fonte['name'].setName(
        'Granesta de Ahmad Ramzi Fahruddin, com as letras acentuadas do '
        'português compostas a partir dos sinais da própria fonte. '
        'Uso interno da campanha.', 10, 3, 1, 0x409)

    fonte.save(SAIDA)
    print('\n%d letras acentuadas criadas → %s' % (len(novos), SAIDA))


principal()
