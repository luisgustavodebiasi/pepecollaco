# Reativação da Regional 33 posts, verbas triplicadas e novos patrocínios — 02/09/2026

Conta: CA - PEPE COLLAÇO - OFICIAL (`1700449990528437`). Executado via MCP oficial da Meta, madrugada de 02/09/2026.

## 1. Regional 33 posts reativada

| Item | Valor |
|---|---|
| Campanha | `CAMP \| 2026 \| Regional-33Posts \| Alcance \| Sul-SC` (`120248619203680716`) |
| Ação | Campanha estava PAUSED desde julho. Ativada às 01:00 de 02/09. |
| Anúncios | 25 no total: **23 ACTIVE** (entregando), 2 WITH_ISSUES |
| Pendentes de parceria | conjunto 39 Grão-Pará (`marquinhosfloripa`) e conjunto 57 Benedito Novo (`jeanm.grundmann`) não aprovaram o pedido de collab; não gastam |
| Sem anúncio | conjuntos 10, 35, 38, 40, 42, 45, 48, 53, 56 (não entregam) |
| Orçamento | R$150 vitalício por conjunto (já estava assim desde 24/08); ~R$58 gastos em julho em cada um, sobram ~R$92 × 23 ≈ **R$2.100** de teto |
| Prazo | stop_time **06/09/2026 23:59** (configurado em 24/08). Para seguir depois disso, estender a data e/ou o orçamento vitalício. |
| Selo político | Campanha criada em julho com `ISSUES_ELECTIONS_POLITICS` (BR); os anúncios foram inseridos pelo Gerenciador e já haviam rodado aprovados. Voltaram a ACTIVE sem nova revisão. |

Duplicatas que seguem pausadas, cada uma só com o conjunto 36 Carro Novo Capivari: `CAMP | ... | ELEITORAL` (`120249240886980716`) e `ELEIÇÕES | CAMP | ... Regional-33Posts` (`120249271351920716`). Não mexi.

## 2. Verba triplicada: R$10 → R$30 por dia (12 conjuntos)

| Conjunto | ID | Campanha |
|---|---|---|
| Novo conjunto de anúncios de Reconhecimento | 120249329841100716 | ELEIÇÕES \| ANTIGOS |
| Adesivo perfurado \| 19-08 | 120249323398240716 | ELEIÇÕES \| VIDEOS CAMPANHA |
| Inclusão – Semana APAE \| 21-08 | 120249323395970716 | idem |
| Pode parecer muitas coisas \| 18-08 | 120249323391920716 | idem |
| Jingle 11223 \| 26-08 | 120249323386680716 | idem |
| Quero representar você – Dia 1 \| 16-08 | 120249323383780716 | idem |
| Urubici estrada \| 24-08 | 120249323379910716 | idem |
| Tubarão precisa ter voz \| 17-08 | 120249323365930716 | idem |
| Tubarão é parte de quem eu sou \| 20-08 | 120249323359460716 | idem |
| Capivari bairro por bairro – R$ 7,5 mi \| 26-08 | 120249323372180716 | idem |
| Adesivaço Tubarão / Capivari / Braço do Norte \| 22-08 | 120249323368580716 | idem |
| Cuidar de Tubarão – 60 ruas \| 27-08 | 120249323354430716 | idem |

Gasto diário previsto dessas campanhas: **R$120 → R$360**. A campanha SEG Autismo (R$50/dia no nível da campanha) não foi alterada.

**Atenção técnica:** `ads_update_entity` com `daily_budget` **força o conjunto para PAUSED** (`status_forced_to_paused: true`). Os 12 foram reativados em seguida com `ads_activate_entity` e confirmados ACTIVE.

## 3. Novos patrocínios: conjuntos prontos, anúncio pendente no Gerenciador

Criados PAUSADOS dentro de `ELEIÇÕES | VIDEOS CAMPANHA | 2026-08 | Alcance` (`120249323277100716`), mesma configuração dos demais: Alcance, cobrança por impressão, R$30/dia, Santa Catarina (região 459), 18 a 65 anos, Advantage+ público desligado, sem data de fim.

| Conjunto | ID | Post | ig_media_id | Nome sugerido do anúncio |
|---|---|---|---|---|
| POST AUDIO DEPUTADO \| 28-08 | 120249382398150716 | https://www.instagram.com/reel/DcmbKxwOw7I/ | 18478698850105927 | AD \| POST AUDIO DEPUTADO \| REEL \| 2026-08-28 |
| Autismo – Equoterapia e inclusão \| 31-08 | 120249382398740716 | https://www.instagram.com/reel/Dct9JBJhvHh/ | 17906396631533642 | AD \| AUT 05 \| Equoterapia e inclusao \| REEL \| 2026-08-31 |
| Autismo – Salas sensoriais Nova Veneza \| 19-07 | 120249382399750716 | https://www.instagram.com/reel/Da_V4eSBbdm/ | 18102864686135787 | AD \| AUT 06 \| Salas sensoriais \| REEL \| 2026-07-19 |

Links diretos de edição:
- https://www.facebook.com/adsmanager/manage/adsets/edit?act=1700449990528437&selected_adset_ids=120249382398150716
- https://www.facebook.com/adsmanager/manage/adsets/edit?act=1700449990528437&selected_adset_ids=120249382398740716
- https://www.facebook.com/adsmanager/manage/adsets/edit?act=1700449990528437&selected_adset_ids=120249382399750716

Como inserir (Gerenciador): selecionar o conjunto → **Criar anúncio** → identidade Página Pepê Collaço + @pepecollaco → **Usar publicação existente** → aba Instagram → escolher o reel → publicar. O Gerenciador aplica `authorization_category=POLITICAL` sozinho. Depois, ativar o conjunto.

O reel de 21/08 (Inclusão – Semana APAE) já está rodando nesta campanha, por isso não foi duplicado. O de 19/07 (salas sensoriais) entrou como segundo "último vídeo de autismo"; se não quiser, basta não criar o anúncio e apagar o conjunto.

## 4. Lixo para apagar no Gerenciador

Duas campanhas vazias que as tentativas de boost deixaram (o MCP não apaga nem arquiva):
- `ZZ | APAGAR | campanha vazia (erro boost 02-09)` (`120249382392080716`)
- `ZZ | APAGAR | campanha vazia 2 (erro boost 02-09)` (`120249382406280716`, pode ter um conjunto vazio dentro)

## 5. O que foi testado e falhou (para não repetir)

| Caminho | Resultado em 02/09 |
|---|---|
| `ads_get_ig_media` | **passou a funcionar** (estava gated em julho); lista feed, reels e stories com `ig_media_id` |
| `ads_boost_ig_post` com `OUTCOME_AWARENESS` e destino padrão | erro 1815715: destino precisa ser `UNDEFINED` para Alcance |
| `ads_boost_ig_post` com destino `UNDEFINED` | cria campanha e conjunto, mas o anúncio falha com **2875108** "Instagram Media ID Not Allowed" (mesmo bloqueio de julho) |
| `ads_create_creative` com `object_story_id` = `pagina_idDoPost` do crosspost | "Post not owned by ad's Page" |
| `ads_create_creative` com `object_story_id` = `pagina_idDoVideo` (número da URL facebook.com/reel/...) | "The reel you selected for your ad is not available" |
| `ads_update_entity` com `status: DELETED` | ignorado, força PAUSED |
| Gerenciador via Chrome | Chrome sem login no Facebook; não posso digitar senha |
| Graph API com `scripts/token.txt` | token expirou em 01/09 12:00 (PDT) |

Conclusão: continua valendo o fluxo de julho. MCP monta campanha e conjuntos; anúncio de reel do Instagram só pelo Gerenciador (ou eu pelo Chrome, se estiver logado).

## 6. Estado da conta antes das ações (02/09, 7 dias)

Gasto R$426,48 · 240 mil impressões · 142 mil alcance · CPM R$1,77 · CTR 0,12%. Acumulado da conta: R$14.265,49. Conta nova no mesmo Business: `PEPE COLLAÇO - ELEIÇÃO` (`1565441288651757`), ativa, só com uma campanha de teste.

## 7. Segunda rodada (02/09, 01:20): "pode rodar e ativar tudo" + público de autismo

**Público de autismo: sim, dá para segmentar.** O público salvo `autismo` (`120214284492970716`) não é de interesses: é um público personalizado de engajamento, "quem interagiu com o perfil do Instagram `646879912020876` nos últimos 365 dias" (47.200 a 55.500 pessoas, ativo, atualizado em 11/06/2026). Junto com ele existem dois lookalikes ativos derivados da base própria: `Semelhante (3%) - autismo` (`120246609101900716`) e `Semelhante (3% a 6%) - autismo` (`120246609105170716`). O `Lookalike (BR, 1%) - autismo` (`120248442736790716`) está INATIVO e não foi usado.

Os conjuntos "Publico Autismo Regiao" de julho (11, 13, 32, 38, 55) na verdade usavam só raio de 80 km de Tubarão com expansão, sem público de autismo.

Aplicado nos dois conjuntos de autismo (renomeados):

| Conjunto | ID | Segmentação |
|---|---|---|
| Autismo – Equoterapia e inclusão \| 31-08 \| Publico autismo + LAL \| SC | 120249382398740716 | públicos `autismo` + 2 lookalikes, Santa Catarina, 18 a 65, Advantage+ público desligado |
| Autismo – Salas sensoriais Nova Veneza \| 19-07 \| Publico autismo + LAL \| SC | 120249382399750716 | idem |

`POST AUDIO DEPUTADO | 28-08` (`120249382398150716`) segue Santa Catarina amplo.

**Ativação:** os 3 conjuntos novos foram colocados em ACTIVE (R$30/dia cada). Como ainda não têm anúncio, não gastam nada até o anúncio ser inserido no Gerenciador; quando for inserido e aprovado, entra no ar na hora. Chrome continuava sem login no Facebook às 01:20, então a inserção segue pendente.

Nota técnica: `ads_update_entity` com `targeting` e `name` NÃO forçou pausa (só `daily_budget` força).

## 8. Anúncios inseridos pelo Gerenciador via Chrome (02/09, 01:20 a 01:45)

Com o Chrome da conta Google pessoal do Luis (extensão "Browser 1") logado no Facebook, eu mesmo operei o Gerenciador de Anúncios e inseri os 3 anúncios, um por conjunto, com "Usar post existente" → aba Instagram → reel escolhido. O rótulo político veio automático ("Propaganda eleitoral · ELEICAO 2026 FELIPPE LUIZ COLLACO DEPUTADO ESTADUAL CNPJ 68.472.001/0001-72").

| Anúncio | ID | Conjunto | Reel |
|---|---|---|---|
| AD \| POST AUDIO DEPUTADO \| REEL \| 2026-08-28 | 120249382501880716 | 120249382398150716 | 18478698850105927 (400 curtidas, 91 comentários) |
| AD \| AUT 05 \| Equoterapia e inclusao \| REEL \| 2026-08-31 | 120249382538830716 | 120249382398740716 | 17906396631533642 (230 curtidas, 38 comentários) |
| AD \| AUT 06 \| Salas sensoriais Nova Veneza \| REEL \| 2026-07-19 | 120249382554070716 | 120249382399750716 | 18102864686135787 (132 curtidas, 9 comentários) |

Os 3 conjuntos já estavam ACTIVE (R$30/dia), então cada anúncio entra em revisão e começa a rodar assim que aprovado.

### Lições do Gerenciador (para a próxima vez)
- O "Publicar" do editor de anúncio individual publica **só aquele anúncio**; não arrasta os 211 rascunhos antigos da conta.
- "Inserir a identificação do post" **não aceita post do Instagram**; tem que ser o botão "Selecionar post" → aba Instagram → buscar por palavra da legenda.
- O clique em "Selecionar post" às vezes não abre nada na primeira vez; se a página estiver carregando, o clique pode cair num "post sugerido" errado. No anúncio 2 caiu no reel de Urubici (collab com a vereadora Josi Menegaz), o que ligou o modo "Anúncio em parceria"; resolvido desligando o toggle e escolhendo de novo.
- "Adicionar um destino" vem marcado e exige URL; desmarcar antes de publicar (o clique vai para a Página/perfil, como num impulsionamento normal).
- Vídeo fica "sendo processado" por alguns segundos; dá para publicar mesmo assim.

### Rascunhos antigos
A conta tem 191 conjuntos e 20 anúncios em rascunho, quase todos de 2025 e com erro (por isso "Conferir e publicar" fica desabilitado). São lixo de edições antigas. Recomendação: "Descartar rascunhos" no topo do Gerenciador, depois de conferir que não há nada seu ali. Não mexi.

### Status às 01:46 (MCP)
| Anúncio | Status |
|---|---|
| POST AUDIO DEPUTADO | **ACTIVE** (já aprovado e entregando) |
| AUT 05 Equoterapia | PENDING_REVIEW |
| AUT 06 Salas sensoriais | IN_PROCESS |

### Erro pré-existente encontrado na VIDEOS CAMPANHA
O conjunto **Jingle 11223 | 26-08** (`120249323386680716`, agora a R$30/dia) tem o anúncio `120249324395500716` bloqueado: "Page Post Can't Be Used: Post ID 1427537469189488 can't be promoted in an ad". Provável restrição de música/direitos no reel do jingle. O conjunto está ativo mas não entrega nem gasta. Para resolver: trocar o post do anúncio no Gerenciador (ou subir o vídeo do jingle como criativo próprio). Não mexi.

## 9. Retrato do que está rodando (02/09, 01:55)

**Entregando de fato (anúncio ACTIVE dentro de conjunto e campanha ativos):**
- VIDEOS CAMPANHA: 10 conjuntos com anúncio ativo a R$30/dia = R$300/dia (7 antigos + POST AUDIO DEPUTADO + AUT 05 + AUT 06; os 3 novos já aprovados).
- ANTIGOS: 1 conjunto, R$30/dia.
- Regional 33 posts: 23 anúncios ativos em 23 conjuntos (R$150 vitalício cada, ~R$92 restante), até 06/09 23:59.

**Ativo mas SEM entrega (não gasta):**
| Item | Motivo |
|---|---|
| VIDEOS CAMPANHA › Capivari bairro por bairro \| 26-08 (`120249323372180716`) | conjunto a R$30/dia **sem nenhum anúncio** |
| VIDEOS CAMPANHA › Adesivaço Tubarão/Capivari/Braço do Norte \| 22-08 (`120249323368580716`) | idem, sem anúncio |
| VIDEOS CAMPANHA › Cuidar de Tubarão – 60 ruas \| 27-08 (`120249323354430716`) | idem, sem anúncio |
| VIDEOS CAMPANHA › Jingle 11223 \| 26-08 | anúncio WITH_ISSUES ("Page Post Can't Be Used") |
| SEG \| Autismo \| Trafego Perfil IG (R$50/dia CBO, até 03/10) | os 4 anúncios AUT 01 a 04 estão PAUSED |
| Regional › conjuntos 39 Grão-Pará e 57 Benedito Novo | parceria pendente (marquinhosfloripa, jeanm.grundmann) |
| Regional › 9 conjuntos (10, 35, 38, 40, 42, 45, 48, 53, 56) | sem anúncio |
| ELEIÇÕES \| VID 01 \| Tubarao 60 ruas (2 campanhas) | uma tem conjunto PAUSED (R$10/dia, fim 03/09), a outra não tem conjunto |

Gasto diário efetivo previsto: **R$330/dia** (VIDEOS 10 × R$30 + ANTIGOS R$30) + o que a Regional consumir até sábado.

## 10. Terceira rodada (02/09, 02:00 a 02:35): "bote tudo para funcionar"

Feito pelo MCP:
- Reativados os 4 anúncios da campanha `ELEIÇÕES | SEG | Autismo | Trafego Perfil IG` (R$50/dia): AUT 01 Cordões coloridos (`120249271492010716`), AUT 02 Vínculo também ensina (`120249271494550716`), AUT 03 Autismo e o papel do pai (`120249271498320716`), AUT 04 Lei Autismo (`120249271502730716`). Estavam PAUSED desde antes de hoje (eu nunca tinha tocado nessa campanha). Todos ACTIVE.

Feito pelo Gerenciador (Chrome pessoal), "Usar post existente" → reel do Instagram, destino desmarcado, publicado um a um:

| Anúncio | ID | Conjunto | Reel |
|---|---|---|---|
| AD \| Capivari bairro por bairro \| REEL \| 2026-08-26 | 120249388612400716 | 120249323372180716 | 17953749510230558 |
| AD \| Adesivaco Tubarao Capivari Braco do Norte \| REEL \| 2026-08-22 | 120249388703060716 | 120249323368580716 | reel de 22/08 (254 curtidas) |
| AD \| Cuidar de Tubarao 60 ruas \| REEL \| 2026-08-27 | 120249388757020716 | 120249323354430716 | reel de 27/08 (136 curtidas) |
| AD \| Jingle 11223 \| REEL IG \| 2026-08-26 | 120249388841340716 | 120249323386680716 | reel de 26/08 (310 curtidas); tentativa de contornar o "Post não aceito" do anúncio antigo |

As campanhas `ELEIÇÕES | VID 01 | Tubarao 60 ruas` (2) não têm anúncio nenhum: são cascas vazias, nada a ativar.

## 11. Rótulo político em uso (verificado 02/09 à tarde, no editor do Gerenciador)

Dois rótulos diferentes convivem na conta:

| Rótulo ("Pago por") | Onde aparece | Como foi criado |
|---|---|---|
| **Propaganda eleitoral · ELEICAO 2026 FELIPPE LUIZ COLLACO DEPUTADO ESTADUAL CNPJ 68.472.001/0001-72** | Regional 33 posts (julho, ex.: conjunto 1), VIDEOS CAMPANHA (28/08, ex.: Adesivo perfurado), ANTIGOS, e os 7 anúncios que inseri hoje | Gerenciador, "Usar post existente" (o rótulo vem sozinho da Página) |
| **Pago por Pepê Collaço** (sem CNPJ, rótulo antigo do mandato) | Campanha `ELEIÇÕES \| SEG \| Autismo \| Trafego Perfil IG` (R$50/dia): AUT 01 a AUT 04 | Criativos `CR \| AUT 0x` feitos pelo MCP em 25/08 (`ads_create_creative`), que herda o disclaimer antigo e não expõe o campo |

O rótulo não é editável depois de publicado. Para os 4 AUT ficarem com o rótulo eleitoral com CNPJ, é preciso recriar os 4 anúncios pelo Gerenciador (mesmo fluxo de hoje) e apagar os antigos. Os 4 reels: Cordões coloridos, Vínculo também ensina, Autismo e o papel do pai, Lei Autismo.

Também vale conferir o mesmo ponto nos 3 anúncios `CR \| RMK` e `CR \| REG 36` (criados pelo MCP em 25/08) se algum voltar a rodar; hoje estão em campanhas pausadas.

A Biblioteca de Anúncios lista 36 anúncios políticos ativos da Página em 02/09 (o MCP não devolve o campo "pago por"; a leitura foi feita no editor).

**Campanha SEG Autismo voltou a PAUSED às 13:31 de 02/09** (updated_time), depois de eu ter reativado os 4 anúncios às 02:00. Não fui eu; ver log de atividades.

## 12. Pausados todos os anúncios com rótulo errado (02/09, tarde)

A pedido do Luis, pausei no nível do ANÚNCIO (status PAUSED) todos os anúncios criados pelo MCP, que carregam o rótulo antigo "Pago por Pepê Collaço" (sem CNPJ). Total: **38 anúncios** em 8 campanhas, todas já pausadas no nível da campanha, exceto a SEG Autismo ELEIÇÕES que o Luis pausou às 13:31.

| Campanha | Anúncios pausados |
|---|---|
| ELEIÇÕES \| SEG \| Autismo \| Trafego Perfil IG (`120249271349180716`) | AUT 01 a 04 (4) |
| ELEIÇÕES \| RMK \| Captacao de Seguidores (`120249271347020716`) | RMK 01/02/03/05/08 em 2 conjuntos (10) |
| ELEIÇÕES \| CAMP \| Regional-33Posts (`120249271351920716`) | REG 36 (já estava pausado) |
| SEG \| Autismo \| ... \| ELEITORAL (`120249240887480716`) | AUT 01 a 04 ELEITORAL (4) |
| RMK \| Captacao \| ... \| ELEITORAL (`120249240887660716`) | RMK ELEITORAL em 2 conjuntos (10) |
| CAMP \| Regional-33Posts \| ... \| ELEITORAL (`120249240886980716`) | 36 Carro Novo ELEITORAL (1) |
| SEG \| Autismo \| Trafego Perfil IG \| 2026-08 (`120248900766040716`, 07/08) | AUT 01 a 04 (4) |
| RMK \| Captacao de Seguidores \| 2026-08 (`120248899148370716`, 07/08) | RMK 01/02/03/05/08 (5) + RESERVA já pausado |

Assim, mesmo que alguma dessas campanhas seja religada, nenhum anúncio com o rótulo antigo volta a rodar. O que segue ativo na conta (VIDEOS CAMPANHA, ANTIGOS, Regional 33 posts de julho) foi todo criado pelo Gerenciador e usa o rótulo eleitoral com CNPJ.

Regra daqui em diante: **anúncio político só pelo Gerenciador** ("Usar post existente"). O MCP serve para campanha, conjunto, orçamento e status; criativo pelo MCP herda o rótulo errado.
