# Levantamento de Posts do Instagram para Impulsionamento

Conta `1700449990528437`. Extração 16/07/2026. Base: 206 anúncios (posts já impulsionados, com métricas reais) + 100 criativos recentes (legendas e datas dos posts).

---

## 1. O que está no ar agora

Nos últimos 30 dias, só 2 anúncios tiveram entrega e **apenas 1 está de fato ativo**:

| Anúncio | Post | Status | Gasto | Alcance | CTR |
|---|---|---|---|---|---|
| Hospital | Menos conta, mais saúde (energia solar p/ hospitais) | ✅ Ativo | R$50 | 7.821 | 1,11% |
| camacho | A Barra do Camacho precisa de solução | ❌ Reprovado | R$28,57 | 5.839 | 2,88% |

Conclusão: a conta está praticamente parada. Há espaço grande para ligar alcance com o acervo de posts que já provou desempenho.

---

## 2. Metodologia e uma limitação a registrar

O ranqueamento usa o desempenho **pago real** de cada post (alcance, CTR, engajamento, plays de vídeo, eficiência reach/R$). É o sinal mais confiável de "o que funciona".

**Limitação atual:** a listagem de mídia orgânica do Instagram (`ads_get_ig_accounts` / `ads_get_ig_media`) está em rollout gradual da Meta e ainda **não liberou para esta conta**. Ou seja, não dá para enumerar via API os posts orgânicos que nunca foram impulsionados. Contornos: (a) usar os posts que já existem como criativo (temos os IDs e podemos reimpulsionar reaproveitando o criativo, sem depender da liberação do IG), e (b) quando a Meta liberar, ligamos a listagem completa dos posts orgânicos mais recentes. O acervo abaixo já cobre praticamente toda a produção recente porque quase tudo passou por impulsionamento.

---

## 3. Campeões de ALCANCE (o que já entrega muita gente barato)

Melhores por alcance e por eficiência (reach por R$). Formato de vídeo domina.

| Alcance | reach/R$ | CTR | Gasto | Post |
|---|---|---|---|---|
| 35.475 | 509 | 0,68% | R$69,75 | Ganhou terra |
| 34.071 | 341 | 0,28% | R$99,93 | Vídeo (Região Sul) |
| 31.492 | 210 | 0,57% | R$149,86 | "SERÁ?" (deputado na região) |
| 29.628 | 198 | 0,26% | R$149,94 | Tubarão institucional |
| 25.012 | 357 | 2,27% | R$69,97 | Leite |
| 24.802 | 496 | 0,35% | R$50,00 | Vídeo institucional |
| 21.653 | 309 | 2,02% | R$70,00 | São Martinho (carregadeira) |

Leitura: com R$50 a R$70 em vídeo dá para alcançar 20 mil a 35 mil pessoas. Essa é a trilha de **alcance puro**.

---

## 4. Posts VIRAIS (CTR alto) para remarketing de assunto

Alto CTR significa que o assunto puxa clique e reação. São os melhores para **remarketing por tema** (reengajar quem já interagiu com aquele assunto).

| CTR | Alcance | Engaj. | Gasto | Post | Eixo |
|---|---|---|---|---|---|
| 11,33% | 8.640 | 1.043 | R$32,90 | Banco Master, prisão mantida | Atualidades |
| 7,95% | 3.269 | 499 | R$49,87 | Flávio Bolsonaro | Atualidades |
| 4,95% | 7.692 | 4.129 | R$58,85 | Trump Venezuela | Atualidades |
| 4,87% | 2.267 | 245 | R$29,56 | 7 de Setembro | Cívico |
| 4,65% | 9.650 | 8.095 | R$34,98 | Democracia | Atualidades |
| 3,97% | 17.222 | 14.299 | R$50,00 | Crianças na internet | Comportamento |
| 3,80% | 14.283 | 12.422 | R$49,97 | Pescaria Brava | Regional |
| 3,12% | 15.183 | 11.358 | R$69,97 | Ituporanga | Regional |
| 3,06% | 18.607 | 14.937 | R$69,86 | Senador Amin | Institucional |

Leitura: conteúdo de **reação a temas do dia** e ganchos curtos são os que mais viralizam. "Crianças na internet" e "Senador Amin" juntam CTR alto **e** alcance grande: os melhores dos dois mundos.

---

## 5. Campeões de engajamento e vídeo

Posts com maior engajamento absoluto e mais plays de vídeo (bom para lookalike e para remarketing de engajamento):

| Engaj. | Plays vídeo | Alcance | Post |
|---|---|---|---|
| 30.136 | 36.472 | 34.071 | Vídeo Região Sul |
| 29.717 | 35.354 | 35.475 | Ganhou terra |
| 22.327 | 33.627 | 29.055 | Vídeo 01 |
| 21.632 | 35.901 | 29.628 | Tubarão institucional |
| 20.167 | 38.246 | 25.821 | Capivari de Baixo obras |

---

## 6. Posts recentes sponsoráveis (inventário jul a abr/2026)

Produção recente identificada nos criativos, do mais novo ao mais antigo (deduplicado). Todos reimpulsionáveis reaproveitando o criativo.

| Data | Post | Eixo | Observação |
|---|---|---|---|
| 16/07 | Menos conta, mais saúde (solar p/ hospitais) | Saúde | já ativo (Hospital) |
| 16/07 | A Barra do Camacho precisa de solução | Infra | rodou reprovado, revisar texto |
| 16/07 | Tubarão em obras | Infra | Tubarão, forte p/ base |
| 16/07 | Mais qualidade de vida (Rua do Teixaco, Braço do Norte) | Infra | AMUREL |
| 22/05 | "SERÁ?" (vale a pena ter deputado na região) | Atualidades | gancho campeão histórico |
| 20/05 | Made in Brasil (EIKTO, Laguna) | Economia | Laguna |
| 20/05 | Morro da Fumaça avançando | Infra | AMREC |
| 15/05 | Tubarão merece mais | Institucional | Tubarão |
| 09/05 | Energia que move Santa Catarina | Institucional | SC |
| 04/05 | Mais investimento no campo | Rural | interior |
| 01/05 | Autismo e IPVA | Autismo | ver seção 7 |
| 28/04 | Tradição que segue viva (galpão gaúcho) | Cultura | interior |
| 19/04 | Não foi sorte, foi trabalho | Institucional | SC |
| 19/04 | Autismo é prioridade (AMA Rio Rufino) | Autismo | ver seção 7 |

Lista completa dos candidatos com números em `dados/candidatos_impulsionamento.csv` (43 posts).

---

## 7. Posts de AUTISMO (para o público que já temos)

18 anúncios de autismo, 114.253 de alcance somado, R$878,55 investidos. Casam com os públicos prontos: **autismo** (salvo, 42 a 49 mil pessoas), **Semelhante 3%** e **Semelhante 3% a 6%**.

| Alcance | CTR | Engaj. | Post |
|---|---|---|---|
| 14.021 | 0,51% | 13.616 | Autismo (engajamento) |
| 11.386 | 0,66% | 9.218 | Autismo (View Brasil) |
| 6.917 | 0,67% | 945 | Autismo |
| 6.432 | 0,88% | 4.533 | Sala sensorial |
| 5.513 | 2,42% | 263 | Autismo (feed) |
| 5.227 | 3,56% | 241 | Autismo (cópia) |
| 4.902 | 2,07% | 1.992 | Autismo |

Posts recentes de autismo no acervo: Autismo e IPVA (01/05), Autismo é prioridade / AMA Rio Rufino (18/03 e 19/04), Vínculo também ensina (10/04 e 14/03), Investimento que transforma / Abril Azul (02/04), Autismo 🧩 (14/04).

Recomendação: rodar uma trilha fixa de autismo mirando o público **autismo** + **lookalikes**, com os posts de maior engajamento e os de CTR mais alto para captação.

---

## 8. Plano de impulsionamento proposto

Três frentes, todas criadas PAUSADAS para revisão antes de qualquer gasto. Nomenclatura e geografia seguem os padrões do módulo (`guia_nomenclatura.md`, `publicos/biblioteca_geografica.md`).

### Frente A: ALCANCE (aparecer no feed)
- **Objetivo:** OUTCOME_AWARENESS, otimização REACH.
- **Posts:** os mais recentes (Tubarão em obras, Menos conta mais saúde, Braço do Norte) + 2 ou 3 campeões de alcance em vídeo.
- **Geo:** Tubarão + AMUREL + Sul-SC (biblioteca geográfica).
- **Verba sugerida:** R$40 a R$70/dia por post, controle de frequência para não saturar.

### Frente B: AUTISMO (público próprio)
- **Objetivo:** engajamento/alcance.
- **Posts:** trilha de autismo da seção 7.
- **Público:** autismo (salvo) + Semelhante 3% + Semelhante 3% a 6%.
- **Verba sugerida:** R$30 a R$50/dia.

### Frente C: REMARKETING DE ASSUNTO
- **Como:** criar públicos de **engajamento** (quem interagiu com o Instagram e com a página no Facebook, 365 dias) via `ads_create_custom_audience` (subtype ENGAGEMENT). Isso o MCP faz.
- **Uso:** reimpactar quem já reagiu a um tema (ex.: quem engajou com posts de saúde recebe o próximo de saúde; quem engajou com autismo recebe a trilha de autismo).
- **Semente para lookalike:** esses públicos de engajamento também viram base de novos lookalikes por tema.

---

## 9. O que falta para executar

1. **Sua aprovação de verba e escopo** (quantos posts, quanto por dia, período).
2. Criar os públicos de engajamento (frente C) via MCP: rápido e reversível.
3. Montar as campanhas PAUSADAS e te mostrar o preview antes de ativar.
4. Acompanhar a liberação do IG na Meta para habilitar o boost direto dos posts orgânicos mais novos.

> Nada nesta etapa gastou dinheiro.

---

## 10. Montagem executada (16/07/2026, tudo PAUSADO)

Verba base aprovada: R$50 a R$70/dia por post (ABO, orçamento por conjunto). Nada entrega enquanto campanha e conjunto estiverem pausados.

### Campanha A: `CAMP | 2026 | Institucional | Alcance | Sul` (`120248442723760716`)
Objetivo OUTCOME_AWARENESS, otimização REACH, R$60/dia por conjunto.

| Conjunto | Geo | Post (criativo) | IDs |
|---|---|---|---|
| Tubarão em obras | AMUREL (raio) | Tubarão em obras | conj `120248442731130716` / ad `120248442737270716` |
| Saúde hospitais | Sul-SC (raio) | Menos conta, mais saúde | conj `120248442732110716` / ad `120248442738010716` |
| Braço do Norte | AMUREL (raio) | Mais qualidade de vida (Rua do Teixaco) | conj `120248442732910716` / ad `120248442738360716` |

### Campanha B: `CAMP | 2026 | Autismo | Engajamento | SC` (`120248442725070716`)
Objetivo OUTCOME_ENGAGEMENT, otimização REACH, R$50/dia.

| Conjunto | Público | Post (criativo) | IDs |
|---|---|---|---|
| Autismo-público | Público salvo "autismo" (42 a 49 mil) | Autismo é prioridade (AMA Rio Rufino) | conj `120248442734070716` / ad `120248442741290716` |

### Frente C: remarketing de assunto (pendente)
Depende dos públicos de **engajamento do Instagram**, que exigem o ID da conta IG. Como `ads_get_ig_accounts` ainda está gated pela Meta para esta conta, essa frente fica pronta para montar assim que a Meta liberar o IG. Público de engajamento só do Facebook seria quase vazio (operação é IG), por isso não foi criado.

### Observações
- Anúncios em `PENDING_REVIEW`/`IN_PROCESS`: revisão normal da Meta. Não entregam enquanto pausados.
- **Autorização política:** conta de agente político. Se a Meta exigir a categoria "questões sociais, eleições ou política" e autorização, alguns anúncios podem ser reprovados ao ativar (como aconteceu com "camacho"). Confirmar o status de autorização da conta antes de ativar.
- Ativação: só quando você mandar. Ativar de cima para baixo (campanha, conjunto, anúncio) via `ads_activate_entity`.

---

## 11. Extração completa do Instagram (script próprio, 16/07/2026)

O script `scripts/listar_posts_ig.mjs` (leitura pura via Graph API) extraiu **1.243 posts** do Instagram (736 feed, 508 reels), de 2014 a hoje. Dados em `dados/posts_ig.csv`. A shortlist recente + autismo foi enriquecida com engajamento orgânico real (curtidas + comentários) em `dados/posts_ig_shortlist_enriquecida.csv`.

**Nota de capacidade:** o `ads_boost_ig_post` (boost nativo do MCP) e o `ads_get_ig_media` continuam gated pela Meta para esta conta. Então o boost de um post orgânico que **nunca foi impulsionado** ainda não é possível direto pelo MCP. O caminho que funciona é reaproveitar o criativo de um post que já virou anúncio (feito nas campanhas A e B). Quando a Meta liberar o boost, ligamos qualquer post da lista pelo `ig_media_id`.

### Posts recentes com melhor engajamento orgânico (candidatos a alcance)

| Engaj. | Data | Tipo | Post | ig_media_id |
|---|---|---|---|---|
| 1.010 | 28/05 | Reels | Feliz aniversário, Tubarão! (156 anos) | 18591510112014083 |
| 796 | 28/06 | Reels | A Barra do Camacho precisa de solução | 17895087366481685 |
| 632 | 01/06 | Reels | O Brasil precisa voltar a ensinar valores | 17898516051305004 |
| 320 | 18/06 | Reels | Força, união, resultados | 18083640998403325 |
| 300 | 04/06 | Reels | La bella polenta (cultura italiana) | 18075823358669442 |
| 284 | 15/06 | Reels | Abrindo caminho (obra) | 17863830918633197 |
| 195 | 29/06 | Reels | Santa Catarina merece respeito | 18103664563847547 |
| 193 | 14/07 | Reels | Infraestrutura é prioridade | 18078590954676013 |

Observação: os campeões de engajamento (aniversário de Tubarão, Barra do Camacho) são fortes, mas o de aniversário é datado e o da Barra do Camacho já foi reprovado como anúncio (rever texto/autorização). Para alcance recente e perene, "Infraestrutura é prioridade" e "Santa Catarina merece respeito" são as melhores apostas.

### Posts de autismo com melhor engajamento orgânico

| Engaj. | Data | Tipo | Post | ig_media_id |
|---|---|---|---|---|
| 306 | 12/03 | Reels | Vínculo também ensina | 18076342364419956 |
| 286 | 05/06/25 | Reels | Dados dos autistas em SC (censo) | 17919435150095663 |
| 276 | 10/03/25 | Reels | Mande sua ideia em defesa do autismo | 18026979665380794 |
| 254 | 02/04/24 | Reels | Eu defendo o autismo e você? | 17918819336873002 |
| 222 | 01/11/24 | Reels | Um censo de autismo | 18046968611099018 |
| 160 | 27/04 | Reels | Autismo e IPVA | 18065478617342975 |

Recomendação: "Vínculo também ensina" (líder de engajamento e já tem criativo) é a melhor troca para o anúncio de autismo da Campanha B, no lugar do atual (AMA Rio Rufino). "Dados dos autistas em SC" casa direto com a bandeira do censo TEA.
