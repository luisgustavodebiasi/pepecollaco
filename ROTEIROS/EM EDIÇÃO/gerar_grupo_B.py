# -*- coding: utf-8 -*-
"""Grupo B — Autismo, Pescaria Brava, Rua Coberta Ituporanga, Energia Solar (formato simples)."""
from _roteiro_base import (new_doc, titulo, secao, bloco, texto, linha,
                           legenda, aviso, salvar)


# ════════════════════════════════════════════════════════════════
# 07 — AUTISMO (TEA)
# ════════════════════════════════════════════════════════════════
def r07():
    doc = new_doc()
    titulo(doc, "Quem não é contado, não é cuidado",
           "Autismo / TEA • vertical 9:16 • 60–80s • causa central do mandato, com apelo emocional")
    texto(doc, "Base (confirmar status): Frente Parlamentar em Defesa da Pessoa com Autismo (autoria); equoterapia "
               "e terapia ocupacional em dezenas de cidades (Laguna, Gravatal, Braço do Norte, São Ludgero, "
               "Armazém, Orleans, Jacinto Machado e outras); salas sensoriais (Treviso, Nova Veneza); parque "
               "adaptado em Tubarão; censo do autismo em SC.", italic=True)
    bloco(doc,
          "Criança em equoterapia, sorriso, mão da mãe. Luz suave. (com autorização)",
          "Tem família que esperou a vida inteira por uma palavra: atendimento.")
    bloco(doc,
          "Laço azul; selo da Frente Parlamentar; Pepê em reunião sobre o tema.",
          "Por isso criei a Frente Parlamentar em Defesa da Pessoa com Autismo. Não é pra lembrar só no Abril Azul e esquecer no resto do ano.")
    bloco(doc,
          "Animação de mapa de SC com as cidades acendendo. Cenas de terapia ocupacional.",
          "Equoterapia e terapia ocupacional em dezenas de cidades. Em cada uma, uma família recebendo cuidado de verdade.")
    bloco(doc,
          "Sala sensorial dentro da escola; parque infantil adaptado.",
          "Sala sensorial dentro da escola pública. Parque adaptado pra criança autista brincar do jeito dela.")
    bloco(doc,
          "Animação de dados / plataforma. Mapa de SC se preenchendo.",
          "E o passo mais importante: um censo pra mapear quem tem autismo em Santa Catarina. Porque quem não é contado não vira política pública.")
    bloco(doc,
          "Pepê de frente, olhar firme. Famílias atrás. Logo.",
          "Autismo não tem fronteira. E enquanto eu tiver mandato, essas famílias vão ter quem fale por elas.")
    legenda(doc,
            "QUEM NÃO É CONTADO, NÃO É CUIDADO 💙 Autismo não é pauta de Abril Azul pra esquecer depois — é "
            "política pública o ano inteiro: 🧩 Frente Parlamentar em Defesa da Pessoa com Autismo (autoria) · 🐴 "
            "equoterapia e terapia ocupacional em dezenas de cidades · 🏫 salas sensoriais na escola e parque "
            "adaptado · 📊 um censo pra mapear quem tem autismo em SC. Porque quem não é contado não vira "
            "política pública. Autismo não tem fronteira.",
            "#AbrilAzul #Autismo #TEA #Inclusão #SantaCatarina #PepêCollaço")
    aviso(doc, [
        "Autorização de imagem assinada em TODA cena com criança/PCD.",
        "Confirmar municípios atendidos e status.",
        "Não prometer cura/resultado — falar em cuidado, acesso e direito.",
        "Se rolar, um depoimento curto de mãe ou terapeuta eleva muito o vídeo.",
    ])
    salvar(doc, "07_AUTISMO_TEA.docx")


# ════════════════════════════════════════════════════════════════
# 08 — PESCARIA BRAVA
# ════════════════════════════════════════════════════════════════
def r08():
    doc = new_doc()
    titulo(doc, "Cidade pequena, investimento gigante",
           "Pescaria Brava • vertical 9:16 • 50–70s • prova de que cidade pequena não é cidade esquecida")
    texto(doc, "Entregas mapeadas (a maioria PAGA): R$ 2,316 mi infraestrutura viária; R$ 2 mi Av. Eliete de "
               "Souza; R$ 1 mi pavimentação de vias; R$ 550 mil infraestrutura; ressonância magnética; portal de "
               "entrada; abrigos de passageiros; kits de artesanato pras mulheres.", italic=True)
    bloco(doc,
          "Placa / entrada de Pescaria Brava. Drone sobre a cidade.",
          "Pescaria Brava é cidade pequena. Mas olha o tamanho do que entrou aqui.")
    bloco(doc,
          "Asfalto novo na Av. Eliete de Souza e nas vias. Máquinas, ruas prontas.",
          "Mais de cinco milhões só em asfalto e infraestrutura. Já pago. A poeira deu lugar ao asfalto.")
    bloco(doc,
          "Hospital/clínica, equipamento; abrigos de ônibus novos.",
          "Ressonância mais perto de casa. Abrigo de passageiro pra quem espera o ônibus na chuva. É o básico bem feito.")
    bloco(doc,
          "Portal de entrada do município; mulheres do grupo de artesanato.",
          "Um portal pra cidade se mostrar. E kit de artesanato pra gerar renda na mão das mulheres daqui.")
    bloco(doc,
          "Montagem do conjunto + Pepê de frente. Logo.",
          "Cidade pequena não pode ser cidade esquecida. Aqui cada bairro virou prioridade.")
    legenda(doc,
            "CIDADE PEQUENA, INVESTIMENTO GIGANTE 🚧 Pescaria Brava provando que pequena não é esquecida: 🛣️ "
            "mais de R$ 5 milhões em asfalto e infraestrutura (já pago) · 🏥 ressonância mais perto de casa · 🚌 "
            "abrigos de passageiros novos · 🪧 portal de entrada · 🧶 kits de artesanato gerando renda pras "
            "mulheres. Aqui cada bairro virou prioridade. Isso é trabalho de verdade.",
            "#PescariaBrava #AMUREL #SulCatarinense #PepêCollaço")
    aviso(doc, [
        "Confirmar status de cada item (a maioria consta PAGO/PRONTO).",
        "Captar imagem real da Av. Eliete de Souza asfaltada e do portal.",
        "Conferir grafia oficial dos logradouros.",
    ])
    salvar(doc, "08_PESCARIA_BRAVA.docx")


# ════════════════════════════════════════════════════════════════
# 09 — RUA COBERTA DE ITUPORANGA
# ════════════════════════════════════════════════════════════════
def r09():
    doc = new_doc()
    titulo(doc, "Um centro pra chamar de nosso",
           "Rua Coberta de Ituporanga • R$ 1 mi • vertical 9:16 • 45–65s • formato que já bombou (lembra o reel de Morro da Fumaça)")
    texto(doc, "Atenção: a emenda está AGUARDANDO DOCUMENTAÇÃO. O vídeo é de projeto/expectativa ('vai nascer'), "
               "nunca de obra entregue. Render/maquete é a peça central.", italic=True)
    bloco(doc,
          "Centro de Ituporanga hoje, movimento, mas espaço subaproveitado. Drone.",
          "Toda cidade precisa de um lugar pra chamar de coração. Ituporanga vai ganhar o dela.")
    bloco(doc,
          "Render / maquete eletrônica da rua coberta. Animação da cobertura surgindo sobre o centro.",
          "Uma rua coberta no centro. Espaço pra feira, pra evento, pra encontrar gente. Com sol ou com chuva.")
    bloco(doc,
          "Simulação de gente circulando: comércio aberto, mesas, feira, apresentação.",
          "Isso é movimento pro comércio, é turismo, é a economia da cidade pulsando bem no centro.")
    bloco(doc,
          "Pepê falando à câmera, centro atrás.",
          "Garanti um milhão pra essa transformação. Agora é seguir junto com o município pra tirar do papel.")
    bloco(doc,
          "Render final iluminado à noite, cidade viva. Logo.",
          "O que hoje é projeto, amanhã vira o ponto de encontro de Ituporanga.")
    legenda(doc,
            "ITUPORANGA VAI GANHAR UM CENTRO PRA CHAMAR DE NOSSO 🌟 Garantimos R$ 1 MILHÃO pra construção da Rua "
            "Coberta na área central. Espaço pra feira, pra evento, pra encontrar gente — com sol ou com chuva. "
            "Movimento pro comércio, turismo e a economia pulsando no centro. O que hoje é projeto, amanhã será "
            "realidade. Seguimos juntos com o município pra tirar do papel! 🚧✨",
            "#Ituporanga #RuaCoberta #AltoVale #InvestimentoQueTransforma #PepêCollaço")
    aviso(doc, [
        "Por estar 'aguardando documentação': linguagem de projeto, nunca 'entregue'.",
        "Produzir render/maquete da rua coberta (peça central).",
        "Reaproveitar o formato do reel de Morro da Fumaça (alto desempenho).",
    ])
    salvar(doc, "09_RUA_COBERTA_Ituporanga.docx")


# ════════════════════════════════════════════════════════════════
# 10 — ENERGIA SOLAR PARA HOSPITAIS FILANTRÓPICOS
# ════════════════════════════════════════════════════════════════
def r10():
    doc = new_doc()
    titulo(doc, "Sol no telhado, saúde na ponta",
           "Energia solar pros hospitais filantrópicos — projeto do Pepê • vertical 9:16 • 55–75s")
    texto(doc, "A confirmar: o formato jurídico exato do projeto (PL / programa / linha de destinação) e em que "
               "estágio está, pra fala ficar precisa. Hospitais de referência: N. S. da Conceição (Tubarão), "
               "Santa Terezinha (Braço do Norte), São Donato (Içara), Caridade (Jaguaruna).", italic=True)
    bloco(doc,
          "Telhado de hospital no sol. Placas solares brilhando. Drone subindo.",
          "E se o sol que bate no telhado do hospital virasse mais atendimento lá dentro?")
    bloco(doc,
          "Conta de luz / gráfico de custo alto do hospital. Médicos e corredores.",
          "Hospital filantrópico vive no aperto. E uma das maiores contas que ele paga é a conta de luz.")
    bloco(doc,
          "Instalação de placas solares no hospital; animação da energia fluindo.",
          "Meu projeto leva energia solar pros hospitais filantrópicos. O sol gera, o hospital economiza todo mês.")
    bloco(doc,
          "Dinheiro economizado 'virando' leito, exame, equipe. Seta animada.",
          "E cada real que sai da conta de luz vira o que importa: mais exame, mais leito, mais cuidado com você.")
    bloco(doc,
          "Pepê de frente, placas solares atrás. Bandeira do Brasil/SC.",
          "É energia limpa e energia daqui. Made in Brasil. Boa pro planeta e boa pro caixa do hospital.")
    bloco(doc,
          "Fachada do hospital filantrópico iluminada. Logo.",
          "Quem cuida da gente também precisa ser cuidado. Esse projeto é por eles.")
    legenda(doc,
            "SOL NO TELHADO, SAÚDE NA PONTA ⚡🇧🇷 Uma das maiores contas de um hospital filantrópico é a conta de "
            "luz. Por isso criei um projeto pra levar ENERGIA SOLAR pros hospitais filantrópicos da nossa "
            "região. O sol gera, o hospital economiza todo mês — e cada real que sai da luz vira mais exame, "
            "mais leito, mais cuidado com você. Energia limpa, energia daqui. Quem cuida da gente também precisa "
            "ser cuidado. 💙",
            "#EnergiaSolar #HospitaisFilantrópicos #Saúde #MadeInBrasil #SulCatarinense #PepêCollaço")
    aviso(doc, [
        "CONFIRMAR formato e estágio do projeto com o gabinete (PL / programa / destinação).",
        "Listar os hospitais filantrópicos alvo pra citar/legendar.",
        "Captar imagem real de placas solares e de hospital da região.",
        "Aproveitar a pegada do post 'Made in Brasil' que já performou bem.",
    ])
    salvar(doc, "10_ENERGIA_SOLAR_Hospitais.docx")


if __name__ == "__main__":
    r07(); r08(); r09(); r10()
    print("Grupo B concluído.")
