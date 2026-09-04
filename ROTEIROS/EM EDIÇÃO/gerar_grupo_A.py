# -*- coding: utf-8 -*-
"""Grupo A — Vídeos do Evento 17/04 + parte dos vídeos de redes (formato simples)."""
from _roteiro_base import (new_doc, titulo, secao, bloco, texto, linha,
                           legenda, aviso, salvar)


# ════════════════════════════════════════════════════════════════
# 01 — ABERTURA DO EVENTO (CONVOCAÇÃO / FUTEBOL)
# ════════════════════════════════════════════════════════════════
def r01():
    doc = new_doc()
    titulo(doc, "A Convocação",
           "Abertura do evento 17/04 • horizontal 16:9 • 60–75s • estilo escalação de futebol (vibe Ancelotti convocando)")
    bloco(doc,
          "Tela preta. Som de estádio, torcida ao fundo, apito. Acende um holofote. Fumaça de vestiário.",
          "Toda virada de jogo começa do mesmo jeito: com uma convocação.")
    bloco(doc,
          "Pepê de costas, andando pelo túnel do vestiário em direção à luz, tipo técnico entrando em campo. Câmera baixa, slow motion.",
          "O Sul Catarinense cansou de assistir da arquibancada. Agora a gente entra em campo.")
    bloco(doc,
          "Prancheta tática / escalação animada surgindo na tela, igual transmissão de jogo. Nomes e cidades aparecem como jogadores posicionados.",
          "Prefeito, vereador, liderança. Cada cidade um jogador, cada um na sua posição. Tá montada a escalação.")
    bloco(doc,
          "Chamada rápida: cidades/lideranças entrando uma a uma com carimbo de CONVOCADO, no ritmo da música.",
          "Tubarão. Laguna. Capivari. Gravatal. Braço do Norte. Pescaria Brava. Tá todo mundo convocado.")
    bloco(doc,
          "Pepê de frente, encarando a câmera, postura de líder. Plateia do evento desfocada atrás.",
          "Aqui ninguém joga sozinho e ninguém é mais que ninguém. Aqui é TIME. E time forte muda o placar de uma região inteira.")
    bloco(doc,
          "Plano aberto do evento lotando, povo de pé, aplauso. Logo do evento + TIME PEPÊ. Bola batendo / apito inicial.",
          "Acabou a resenha, a bola já rolou. Bora pro jogo. Bem-vindos.")
    aviso(doc, [
        "Fechar a lista oficial de lideranças/cidades pra citar na convocação.",
        "Confirmar nome e arte oficial do evento pro fechamento.",
        "Gerar também a versão vertical (Stories) cortada do mesmo material.",
    ])
    salvar(doc, "01_ABERTURA_EVENTO_Convocacao.docx")


# ════════════════════════════════════════════════════════════════
# 02 — MANIFESTO / JORNADA (2 MIN)
# ════════════════════════════════════════════════════════════════
def r02():
    doc = new_doc()
    titulo(doc, "Não foi sorte, foi trabalho",
           "Vídeo-manifesto do evento 17/04 • horizontal 16:9 • ~2min • emocional, pra mobilizar")
    texto(doc, "Números pra confirmar antes de colocar na tela: ~R$ 149 milhões destinados, 494 emendas, "
               "presença em todas as associações de municípios de SC, relator na CCJ e autor da Frente "
               "Parlamentar em Defesa da Pessoa com Autismo.", italic=True)
    bloco(doc,
          "Mosaico rápido de Tubarão e do Sul: rio, ruas, gente, obra. Imagem em P&B virando colorida.",
          "Tem gente que acha que Santa Catarina ganhou tudo de mão beijada. Quem é daqui sabe que a história foi outra.")
    bloco(doc,
          "Fotos de arquivo da trajetória: vereador, vice, prefeito de Tubarão, Defesa Civil. Linha do tempo.",
          "Vereador três vezes. Vice-prefeito. Prefeito de Tubarão. Defesa Civil. Sempre o mesmo chão: o nosso.")
    bloco(doc,
          "Pepê na tribuna da Alesc, andando pela Assembleia. Plano firme.",
          "Cheguei na Assembleia pra trabalhar, não pra aparecer. Sou advogado, apaixonado por legislativo bem feito.")
    bloco(doc,
          "Contador animado subindo até ~R$ 149 milhões. Mapa de SC acendendo cidade por cidade.",
          "Quase cento e cinquenta milhões levados pras cidades. E não pra uma só: pra região inteira.")
    bloco(doc,
          "Sequência de obras em cortes rápidos: asfalto novo, creche, ginásio de Sangão, ambulância, trator.",
          "Asfalto que tira a poeira. Creche que abre vaga. Ginásio, ambulância, trator. Recurso que vira vida real.")
    bloco(doc,
          "Pepê na CCJ, papelada, debate em comissão.",
          "Na Comissão de Constituição e Justiça eu relatei as matérias mais cabeludas. Onde a lei se decide, eu tava lá.")
    bloco(doc,
          "Crianças em equoterapia, sala sensorial, laço azul. Imagens sensíveis, com autorização.",
          "E abracei uma causa que muita gente ainda finge que não vê: o autismo. Frente parlamentar, terapia em dezenas de cidades e um censo pra enxergar quem nunca foi contado.")
    bloco(doc,
          "Rostos da comunidade olhando pra câmera, aperto de mão, a multidão do evento.",
          "Nada disso é meu. É nosso. De cada prefeito, cada liderança, cada um que não desistiu da sua cidade.")
    bloco(doc,
          "Pepê encarando a câmera, plateia de pé atrás. Logo TIME PEPÊ. Fecha no azul.",
          "O jogo não acabou. A próxima convocação é agora. Cola com a gente.")
    aviso(doc, [
        "Validar TODOS os números antes de exibir (valor total, nº de emendas, cidades).",
        "Garantir autorização de imagem nas cenas de TEA / crianças.",
        "Narração de preferência na voz do próprio Pepê (dá mais força que locutor).",
    ])
    salvar(doc, "02_MANIFESTO_Jornada_2min.docx")


# ════════════════════════════════════════════════════════════════
# 03 — PORTO DE LAGUNA / REDRAGAGEM DO RIO TUBARÃO
# ════════════════════════════════════════════════════════════════
def r03():
    doc = new_doc()
    titulo(doc, "O rio precisa respirar",
           "Redragagem do Rio Tubarão + molhes de Laguna • R$ 5 mi (bancada) • vertical 9:16 • 60–90s • com animação de mapa")
    texto(doc, "Contexto: o recurso é pro PROJETO EXECUTIVO da dragagem (não a obra pronta). Tubarão carrega o "
               "trauma da enchente de 1974; rio assoreado escoa menos e alaga mais rápido. Obra mexe em rio e "
               "barra, então depende de licença ambiental.", italic=True)
    bloco(doc,
          "Imagem aérea do Rio Tubarão. Corta pra fotos de arquivo de enchente.",
          "Tubarão conhece a água que dá vida. E conhece a água que invade.")
    bloco(doc,
          "ANIMAÇÃO DE MAPA: a bacia do Rio Tubarão acende, setas mostram a água descendo até Laguna.",
          "Toda a água da nossa região passa por aqui. Com o tempo o rio assoreia, perde fundo e perde força pra escoar.")
    bloco(doc,
          "Mapa: o trecho assoreado pisca em laranja, o nível da água sobe na simulação.",
          "É simples: rio raso é rio que transborda mais rápido. Cada temporal vira ameaça pra casa, comércio e plantação.")
    bloco(doc,
          "Mapa: animação da dragagem ao longo do trecho até Laguna, o rio 'aprofunda' e a água escoa. Molhes da barra em destaque.",
          "A redragagem devolve fundo a um trecho longo do rio, até Laguna. E a remodelagem dos molhes organiza a saída pro mar.")
    bloco(doc,
          "Laguna: pescadores, barcos, porto, turistas.",
          "Isso é segurança contra enchente, mas é pesca, é porto, é turismo. É a economia da região inteira respirando junto.")
    bloco(doc,
          "Selo de projeto / documento. Pepê falando à câmera.",
          "Como mexe no rio e na barra, precisa de licença ambiental. Por isso o passo certo é esse: cinco milhões garantidos pro projeto executivo.")
    bloco(doc,
          "Pepê de frente, rio atrás. Logo.",
          "Pauta velha que vivia no papel. Tirei do papel. E não vou largar o osso até a draga entrar na água.")
    legenda(doc,
            "O RIO PRECISA RESPIRAR 🌊 Tubarão sabe o que é conviver com enchente — e rio assoreado alaga mais "
            "rápido. Garantimos R$ 5 MILHÕES (emenda de bancada) pro projeto executivo da redragagem do Rio "
            "Tubarão e a remodelagem dos molhes do Porto de Laguna. É segurança, é pesca, é porto, é turismo. "
            "Pauta velha que finalmente saiu do papel — e não vou largar o osso até a obra sair. 💪",
            "#Tubarão #Laguna #RioTubarão #PortoDeLaguna #SulCatarinense #PepêCollaço")
    aviso(doc, [
        "Conferir os dados técnicos da bacia e do trecho com a equipe antes de postar.",
        "Produzir a animação de mapa (bacia → trecho → Laguna → molhes).",
        "Sempre reforçar: é o PROJETO EXECUTIVO (não dizer 'obra entregue').",
    ])
    salvar(doc, "03_PORTO_LAGUNA_Rio_Tubarao.docx")


# ════════════════════════════════════════════════════════════════
# 04 — APA DA BALEIA FRANCA
# ════════════════════════════════════════════════════════════════
def r04():
    doc = new_doc()
    titulo(doc, "Se a baleia é franca, a gente também tem que ser",
           "APA da Baleia Franca • pauta federal • vertical 9:16 • 60–80s • equilíbrio: proteger o ambiente sem sufocar quem mora aqui")
    texto(doc, "Mensagem-chave: não é contra a baleia. É ser franco sobre o tamanho da restrição dentro da casa "
               "das pessoas. Pedido nasceu da comunidade; Pepê levou à dep. federal Geovânia de Sá (parceiros, "
               "independente de partido). Afeta Jaguaruna, Laguna e Imbituba.", italic=True)
    bloco(doc,
          "Baleia franca no mar do litoral sul (imagem de impacto). Som de mar.",
          "A baleia franca é patrimônio do nosso litoral. E olha: ninguém aqui é contra proteger ela.")
    bloco(doc,
          "Mapa do litoral com Jaguaruna, Laguna e Imbituba marcados dentro da área da APA.",
          "Mas a área de proteção foi avançando em cima da casa de muita gente. Gente que sempre morou, pescou e trabalhou aqui.")
    bloco(doc,
          "Moradores, pescadores, pequenas propriedades dentro do território.",
          "É restrição pesada dentro do quintal das famílias. E todo mundo sabe: quando a regra é absurda, ela acaba não pegando.")
    bloco(doc,
          "Pepê conversando com a comunidade; depois imagem com a dep. Geovânia de Sá.",
          "Esse pedido nasceu da comunidade. Como é tema federal, eu mesmo levei pra deputada Geovânia de Sá. Somos parceiros, e parceria de verdade não olha partido.")
    bloco(doc,
          "Documentos / tramitação. Reunião.",
          "O projeto tá andando. Mas não dá pra calar a boca: silêncio aqui é a comunidade pagando a conta.")
    bloco(doc,
          "Pepê de frente, litoral atrás. Logo.",
          "Proteger a baleia e respeitar quem vive aqui não são coisas opostas. E é sobre isso que a gente vai continuar falando. Na franqueza.")
    legenda(doc,
            "SE A BALEIA É FRANCA, A GENTE TAMBÉM TEM QUE SER 🐋 Ninguém aqui é contra proteger a baleia. Mas a "
            "Área de Proteção foi avançando sobre a casa de famílias de Jaguaruna, Laguna e Imbituba — gente que "
            "sempre morou e pescou aqui. Esse pedido nasceu da comunidade e levei pessoalmente pra dep. federal "
            "Geovânia de Sá. Proteger o ambiente e respeitar quem vive aqui não são coisas opostas. Quando a lei "
            "é absurda, ela acaba não pegando. Vamos seguir na franqueza. 💙",
            "#BaleiaFranca #APA #Jaguaruna #Laguna #Imbituba #SulCatarinense #PepêCollaço")
    aviso(doc, [
        "Não soar 'contra a baleia' nem 'contra o meio ambiente' — o enquadramento é EQUILÍBRIO.",
        "Confirmar o estágio exato da tramitação com o gabinete (sem prometer resultado).",
        "Alinhar a citação da dep. Geovânia de Sá com a assessoria dela.",
        "Se der, captar depoimento curto de morador/pescador afetado.",
    ])
    salvar(doc, "04_APA_Baleia_Franca.docx")


# ════════════════════════════════════════════════════════════════
# 05 — TUBARÃO: AV. PEDRO ZAPELINI
# ════════════════════════════════════════════════════════════════
def r05():
    doc = new_doc()
    titulo(doc, "Tubarão vai abrir caminho",
           "Abertura da Av. Pedro Zapelini • R$ 2 mi (bancada) • vertical 9:16 • 45–70s")
    texto(doc, "A confirmar antes de gravar: a anotação interna fala num trecho de ~400 m. Confirmar com a "
               "Secretaria de Obras a extensão exata, o que a avenida liga e qual gargalo de trânsito ela "
               "resolve — esse é o coração do vídeo.", italic=True)
    bloco(doc,
          "Trânsito travado / rua sem saída no ponto onde a avenida vai abrir. Drone.",
          "Quem é de Tubarão sabe: aqui o caminho ainda trava.")
    bloco(doc,
          "Drone sobre o traçado; linha animada mostrando o novo trecho da avenida 'abrindo'.",
          "A abertura da Avenida Pedro Zapelini liga o que hoje é volta. Menos desvio, mais cidade conectada.")
    bloco(doc,
          "Mapa simples: ponto A e ponto B se ligando pelo trecho novo; carros fluindo na simulação.",
          "Um trecho curtinho que muda o trânsito de uma região inteira. É mobilidade, é segurança, é tempo de vida da pessoa.")
    bloco(doc,
          "Pepê em Tubarão, falando à câmera.",
          "Foram dois milhões, emenda de bancada, garantidos pra essa obra. Tubarão é a minha casa, e casa a gente cuida primeiro.")
    bloco(doc,
          "Pepê / imagem institucional com a cidade atrás.",
          "Aqui a gente trabalha junto com a prefeitura pra acelerar. Cidade não pode esperar a briga política passar.")
    bloco(doc,
          "Render/maquete ou faixa da obra. Logo.",
          "Tubarão vai abrir caminho. E eu vou acompanhar metro por metro.")
    legenda(doc,
            "TUBARÃO VAI ABRIR CAMINHO 🚧 Garantimos R$ 2 MILHÕES (emenda de bancada) pra abertura da Av. Pedro "
            "Zapelini. Um trecho que liga o que hoje é volta — menos trânsito, mais acesso, mais tempo de vida "
            "pra quem mora e trabalha aqui. Tubarão é a minha casa e é prioridade. E aqui a gente trabalha junto "
            "com a prefeitura: cidade não pode esperar a briga política passar. Vou acompanhar metro por metro. 💪",
            "#Tubarão #AvenidaPedroZapelini #Mobilidade #SulCatarinense #PepêCollaço")
    aviso(doc, [
        "CONFIRMAR a extensão do trecho e o que a avenida liga (Secretaria de Obras).",
        "Descobrir o gargalo de trânsito que a obra resolve (dado central do vídeo).",
        "Gravar o drone do 'antes' agora, pra render o 'antes e depois' depois.",
        "Conferir o status (publicado ≠ concluído) antes de postar.",
    ])
    salvar(doc, "05_TUBARAO_Av_Pedro_Zapelini.docx")


# ════════════════════════════════════════════════════════════════
# 06 — CAPIVARI DE BAIXO
# ════════════════════════════════════════════════════════════════
def r06():
    doc = new_doc()
    titulo(doc, "Capivari inteira atendida",
           "Pacote de emendas em Capivari de Baixo • vertical 9:16 • 50–75s • ritmo de lista que vai crescendo")
    texto(doc, "Entregas mapeadas (confirmar status): ~R$ 2,5 mi em pavimentação/reperfilagem; veículo da saúde "
               "e veículo da APAE; praça nova e praça revitalizada; iluminação do campo do Ilhotinha; Rede "
               "Feminina e Clube de Mães.", italic=True)
    bloco(doc,
          "Placa de entrada de Capivari de Baixo / vista da cidade. Drone.",
          "Capivari de Baixo, presta atenção no tamanho do que chegou pra cá.")
    bloco(doc,
          "Asfalto novo, máquina pavimentando. Contador de R$ aparecendo.",
          "Asfalto novo: um milhão pra recuperar via, mais um e meio pra reperfilar e sinalizar rua. O cheirinho de asfalto que o bairro pediu.")
    bloco(doc,
          "Posto de saúde, veículo novo da saúde, equipe. Carro da APAE.",
          "Carro novo pra saúde e veículo pra APAE levar quem precisa. Cuidar de gente também é estrutura.")
    bloco(doc,
          "Praça revitalizada, criançada brincando, campo de futebol com refletor aceso.",
          "Praça nova, praça reformada e o campo do Ilhotinha ganhando iluminação. Lugar pra família viver a cidade.")
    bloco(doc,
          "Rede Feminina e Clube de Mães — mulheres reunidas.",
          "E quem segura a comunidade no braço: Rede Feminina de Combate ao Câncer e Clube de Mães. Apoio pra quem apoia todo mundo.")
    bloco(doc,
          "Montagem rápida de tudo + Pepê de frente. Logo.",
          "Não foi uma obra, foi a cidade inteira atendida. Capivari de Baixo no mapa das prioridades.")
    legenda(doc,
            "CAPIVARI DE BAIXO INTEIRA ATENDIDA ✅ Não foi uma obra, foi um pacote pra cidade inteira: 🚧 "
            "pavimentação e reperfilagem de várias ruas · 🏥 carro novo pra Saúde e veículo pra APAE · 🌳 praça "
            "nova e revitalizada · ⚽ iluminação do campo do Ilhotinha · 💗 Rede Feminina e Clube de Mães. "
            "Trabalho de verdade, do começo ao fim da cidade.",
            "#CapivariDeBaixo #AMUREL #SulCatarinense #PepêCollaço")
    aviso(doc, [
        "Confirmar status de cada item (pago / publicado / em obra).",
        "Captar imagem real de: asfalto, praça, campo iluminado e veículo da saúde.",
        "Conferir grafia oficial das ruas citadas.",
        "Versão alternativa: carrossel de feed listando as entregas.",
    ])
    salvar(doc, "06_CAPIVARI_de_Baixo.docx")


if __name__ == "__main__":
    r01(); r02(); r03(); r04(); r05(); r06()
    print("Grupo A concluído.")
