# -*- coding: utf-8 -*-
"""Grupo C — Principais obras, Fórmula de pavimentação, Estratégia (formato simples)."""
from _roteiro_base import (new_doc, titulo, secao, bloco, texto, linha,
                           legenda, aviso, salvar)


# ════════════════════════════════════════════════════════════════
# 11 — PRINCIPAIS OBRAS (vários roteiros curtos num doc)
# ════════════════════════════════════════════════════════════════
def r11():
    doc = new_doc()
    titulo(doc, "As grandes obras",
           "Roteiros curtos (30–45s cada) pras maiores entregas do mandato • cada bloco vira um Reel")

    # 11.1 Ginásio Sangão
    secao(doc, "Obra 1 — Ginásio de Esportes • Sangão (R$ 5,9 mi • PRONTO)")
    bloco(doc,
          "Drone se aproximando do ginásio. Estrutura imponente.",
          "Sangão é cidade pequena. E acaba de ganhar o maior ginásio da sua história.")
    bloco(doc,
          "Interior: quadra, arquibancada, criançada jogando.",
          "Esporte, evento, formatura, show. Um espaço pra cidade inteira viver junto.")
    bloco(doc,
          "Comunidade reunida, atletas. Pepê no local.",
          "É a maior obra individual do nosso mandato. E não é maquete, não: tá PRONTA, aqui, pra vocês.")
    bloco(doc,
          "Plano aberto do ginásio cheio. Logo.",
          "Cidade pequena também merece estrutura grande.")
    legenda(doc,
            "SANGÃO GANHOU O MAIOR GINÁSIO DA SUA HISTÓRIA 🏟️ Quase R$ 6 MILHÕES — a maior obra individual do "
            "nosso mandato, e tá PRONTA! Esporte, evento, formatura, show: espaço pra cidade inteira viver "
            "junto. Cidade pequena também merece estrutura grande. 💪",
            "#Sangão #Esporte #AMUREL #PepêCollaço")
    linha(doc)

    # 11.2 Creche Joelma de Bona
    secao(doc, "Obra 2 — Creche Joelma de Bona • Paulo Lopes (R$ 2,3 mi • PRONTO)")
    bloco(doc,
          "Fachada da creche. Crianças entrando de mãos dadas com as mães.",
          "Tem creche que é só prédio. E tem creche que tem nome, tem história, tem cara.")
    bloco(doc,
          "Salas, brinquedos, crianças. Mãe deixando o filho e indo trabalhar.",
          "Cada vaga aqui é uma mãe que trabalha tranquila e uma criança bem cuidada.")
    bloco(doc,
          "Crianças brincando. Pepê visitando.",
          "Primeira infância é onde tudo começa. Investir aqui é investir no futuro da cidade.")
    bloco(doc,
          "Plano da criançada. Logo.",
          "As crianças de Paulo Lopes agora têm um lugar digno pra começar.")
    legenda(doc,
            "UMA CRECHE QUE TEM NOME, HISTÓRIA E CARA 💛 R$ 2,3 MILHÕES na Creche Joelma de Bona, em Paulo Lopes "
            "— e tá PRONTA! Cada vaga aqui é uma mãe que trabalha tranquila e uma criança bem cuidada. Primeira "
            "infância é onde tudo começa.",
            "#PauloLopes #Educação #PrimeiraInfância #PepêCollaço")
    linha(doc)

    # 11.3 Gravatal Várzea das Canoas
    secao(doc, "Obra 3 — Estrada Várzea das Canoas • Gravatal (R$ 2,5 mi • AGUARDANDO PORTARIA)")
    bloco(doc,
          "Estrada de chão da Várzea das Canoas, poeira/lama. Drone.",
          "Quem mora no interior de Gravatal conhece bem essa estrada. E sabe o que ela vira na chuva.")
    bloco(doc,
          "Animação de asfalto cobrindo o trecho. Produtor rural escoando a produção.",
          "Dois milhões e meio pra pavimentar esse trecho. É escoamento da produção, é turismo, é segurança.")
    bloco(doc,
          "Pepê falando, estrada atrás.",
          "Tá aguardando a portaria pra sair do papel. E eu vou acompanhar até a máquina chegar.")
    bloco(doc,
          "Render do asfalto pronto. Logo.",
          "Interior também é prioridade.")
    linha(doc)

    # 11.4 Orleans
    secao(doc, "Obra 4 — Rua Ver. Elias Bussolo • Orleans (R$ 2,3 mi • PAGO)")
    bloco(doc,
          "A rua antes, sem asfalto. Moradores.",
          "No Bairro Samuel Sandrini, em Orleans, essa rua esperou tempo demais.")
    bloco(doc,
          "Asfalto sendo aplicado / rua pronta. Moradores caminhando.",
          "Dois milhões e trezentos mil. Asfalto novo na Rua Vereador Elias Bussolo. E já tá PAGO.")
    bloco(doc,
          "Moradores satisfeitos; Pepê na rua.",
          "Prometido e entregue, sem enrolação. É assim que a gente trabalha.")
    bloco(doc,
          "Plano da rua asfaltada. Logo.",
          "Orleans no mapa das prioridades.")
    legenda(doc,
            "PROMETIDO E ENTREGUE EM ORLEANS ✅ R$ 2,3 MILHÕES de asfalto novo na Rua Vereador Elias Bussolo, "
            "Bairro Samuel Sandrini — e já tá PAGO. A rua que esperou tempo demais virou realidade. Sem "
            "enrolação: é assim que a gente trabalha. 🚧",
            "#Orleans #AMREC #Pavimentação #Entregue #PepêCollaço")
    aviso(doc, [
        "Confirmar status de cada obra antes de postar (PRONTO/PAGO/AGUARDANDO PORTARIA).",
        "Obra 'aguardando portaria': linguagem de projeto, não de entrega.",
        "Captar 'antes e depois' real sempre que der.",
        "Publicar os blocos espaçados, não todos no mesmo dia.",
    ])
    salvar(doc, "11_PRINCIPAIS_OBRAS.docx")


# ════════════════════════════════════════════════════════════════
# 12 — FÓRMULA DE PAVIMENTAÇÃO POR MUNICÍPIO
# ════════════════════════════════════════════════════════════════
def r12():
    doc = new_doc()
    titulo(doc, "A fórmula do asfalto",
           "Modelo replicável • Rua que sofria + Emenda + Pavimentação = Resultado • 40–55s")
    texto(doc, "É só trocar a rua, o valor e a cidade. A conta sempre fecha igual: mostra o problema, mostra o "
               "recurso, mostra a obra, mostra o resultado. (O post 'AQUI NÃO PARA e o ASFALTO CHEGOU' passou de "
               "50 mil visualizações — esse formato funciona.)", italic=True)

    secao(doc, "Estrutura-padrão")
    bloco(doc,
          "A [RUA] antes: poeira na seca, lama na chuva. Morador reclamando (B-roll).",
          "Essa é a Rua [NOME], no Bairro [BAIRRO]. Na seca, poeira. Na chuva, lama. Anos esperando.")
    bloco(doc,
          "Selo/animação do valor da emenda surgindo. Documento.",
          "Aí entrou a emenda: [VALOR] garantido pra essa rua. Recurso no lugar certo.")
    bloco(doc,
          "Máquina pavimentando, asfalto quente, equipe trabalhando. Som de obra.",
          "E a obra saiu do papel. Máquina na rua, asfalto chegando — o cheirinho que o bairro esperava.")
    bloco(doc,
          "Rua pronta, asfaltada, limpa. Moradores caminhando, criança de bicicleta.",
          "Resultado: rua nova, sem poeira, sem lama. Dignidade pra quem mora aqui.")
    bloco(doc,
          "Pepê na rua pronta com os moradores. Logo.",
          "Não foi sorte, foi trabalho. E tem muito mais asfalto vindo por aí.")

    secao(doc, "Aplicações prontas (trocar os campos)")
    for t in [
        "CAPIVARI DE BAIXO — Rua Antonia de Bittencourt Barcelos, Bairro Industrial — R$ 523.537",
        "CAPIVARI DE BAIXO — Rua Maria de Fátima da Costa, Bairro Santa Lúcia — R$ 300.000",
        "ORLEANS — Rua Vereador Elias Bussolo, Bairro Samuel Sandrini — R$ 2.316.000 (PAGO)",
        "PESCARIA BRAVA — Av. Eliete de Souza, Sertão de Cima Siqueiro — R$ 2.000.000 (PAGO)",
        "GRAVATAL — Estrada Municipal Várzea das Canoas — R$ 2.518.000 (bancada)",
        "TUBARÃO — Pavimentação de vias (vereadores) — R$ 1.500.000",
        "IÇARA — Pavimentação Bairro Vila Nova — R$ 1.500.000",
        "GAROPABA — Pavimentação de vias municipais — R$ 1.000.000",
        "PAULO LOPES — Pavimentação de diversas vias — R$ 1.000.000",
        "SANGÃO — Pavimentação com lajotas em diversas vias — R$ 850.000",
    ]:
        texto(doc, "• " + t, after=2)

    aviso(doc, [
        "Gravar SEMPRE o 'antes' antes da obra começar (senão perde o comparativo).",
        "Confirmar valor e grafia oficial da rua/bairro de cada aplicação.",
        "Conferir status (PAGO / em obra) — não dizer 'entregue' o que está em execução.",
    ])
    salvar(doc, "12_FORMULA_Pavimentacao_por_Municipio.docx")


# ════════════════════════════════════════════════════════════════
# 13 — ESTRATÉGIA / ANÁLISE DO QUE JÁ FOI POSTADO
# ════════════════════════════════════════════════════════════════
def r13():
    doc = new_doc()
    titulo(doc, "O que já funciona",
           "Análise dos posts que mais bombaram (@pepecollaco, dez/25 a jun/26) + banco de ganchos e prioridades")

    secao(doc, "Top posts — o que bombou")
    for v, t in [
        ("171 mil views", "“O pau que rola nas redes…” — posicionamento direto/provocativo. Polêmica controlada = alcance (usar com parcimônia)."),
        ("72 mil views", "Esporte — R$ 500 mil gramado sintético (Caravaggio FC). 'Investir no esporte é investir no futuro.'"),
        ("51 mil views", "“AQUI NÃO PARA e o ASFALTO CHEGOU” — pavimentação com 'cheirinho de asfalto novo'. Antes/depois."),
        ("50 mil views", "Ituporanga — “INVESTIMENTO QUE TRANSFORMA”. Obra que muda a cara da cidade. Muito compartilhamento."),
        ("49 mil views", "“NÃO FOI SORTE. FOI TRABALHO” — mérito x discurso de 'SC ganhou tudo'. Identidade catarinense."),
        ("45 mil views", "Morro da Fumaça — rua coberta avançando. 'O que hoje é projeto, amanhã será realidade.'"),
        ("44 mil views", "“TRADIÇÃO QUE SEGUE VIVA” — galpão/cultura. 'Não é só um galpão. É história.'"),
        ("35 mil views", "Abril Azul — autismo/inclusão. Causa permanente, apelo emocional forte."),
    ]:
        texto(doc, f"▸ {v} — {t}", after=4)

    secao(doc, "Padrões que se repetem no que dá certo")
    for t in [
        "Gancho forte em caixa alta nos 3 primeiros segundos.",
        "Asfalto e obra com narrativa sensorial ('o cheirinho de asfalto novo').",
        "Esporte como investimento no futuro (clube, ginásio, campo).",
        "Orgulho regional / identidade catarinense / gaúcha / sul.",
        "Autismo (Abril Azul) com apelo emocional e enquadramento de causa permanente.",
        "'Investimento que transforma' + render de obra futura (expectativa + compartilhamento).",
        "Posicionamento direto e provocativo (maior pico de alcance) — usar com cuidado.",
    ]:
        texto(doc, "• " + t, after=2)

    secao(doc, "Banco de ganchos (abertura de vídeo)")
    for g in [
        "“Não foi sorte. Foi trabalho.”",
        "“Aqui não para — e o asfalto chegou.”",
        "“Investimento que transforma.”",
        "“O que hoje é projeto, amanhã será realidade.”",
        "“Cidade pequena não é cidade esquecida.”",
        "“Não é só um [X]. É história. É identidade.”",
        "“Quem é daqui sabe que não foi de graça.”",
        "“Acabou a resenha, a bola já rolou.”",
        "“Quem não é contado, não é cuidado.” (TEA)",
        "“Não foi uma obra. Foi a cidade inteira atendida.”",
        "“Se a baleia é franca, a gente também tem que ser.”",
    ]:
        texto(doc, "• " + g, after=2)

    secao(doc, "Ordem sugerida de produção")
    for t in [
        "1º — Manifesto/Jornada (02) e Abertura/Convocação (01): âncoras do evento 17/04.",
        "2º — Principais Obras (11): Ginásio Sangão e Creche Paulo Lopes já PRONTOS = entrega imediata.",
        "3º — Fórmula de Pavimentação (12): série replicável, formato que mais engaja.",
        "4º — Autismo (07): causa central, altíssimo apelo emocional e orgânico.",
        "5º — Porto de Laguna (03) e Rua Coberta Ituporanga (09): narrativa regional.",
        "6º — Capivari (06) e Pescaria Brava (08): pacotes de cidade, ótimo engajamento local.",
        "7º — Energia Solar (10) e APA Baleia Franca (04): autoria/posicionamento.",
    ]:
        texto(doc, "• " + t, after=2)

    secao(doc, "Cadência recomendada")
    for t in [
        "3 a 4 vídeos por semana, alternando: 1 obra entregue + 1 causa (TEA/saúde) + 1 cidade/pacote + 1 posicionamento.",
        "Sempre abrir com gancho em caixa alta nos 3 primeiros segundos.",
        "Fechar com assinatura fixa (#TIMEPEPÊ) e um CTA leve ('cola com a gente').",
        "Reaproveitar formatos campeões: 'antes e depois' de asfalto e render de obra futura.",
    ]:
        texto(doc, "• " + t, after=2)

    salvar(doc, "13_ESTRATEGIA_Conteudo_Analise_Redes.docx")


if __name__ == "__main__":
    r11(); r12(); r13()
    print("Grupo C concluído.")
