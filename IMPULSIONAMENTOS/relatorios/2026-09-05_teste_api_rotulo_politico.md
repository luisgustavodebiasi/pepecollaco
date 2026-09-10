# 05/09/2026 · Teste: o "nome aprovado" destrava a API?

Pedido do Luis: "parece que o nosso nome foi aprovado na api da meta. Mande e faça acontecer para aparecer".
Testado direto na API (MCP oficial) na conta OFICIAL `1700449990528437`, madrugada de 05/09.

## Resultado: os dois bloqueios continuam

| Teste | Chamada | Resultado |
|---|---|---|
| Impulsionar post do Instagram | `ads_boost_ig_post` (reel Pescaria Brava, `17878706997628830`, Alcance, SC, R$30/dia, categoria política) | **erro 2875108** "Instagram Media ID Not Allowed: You don't have permission for using instagram_media_id yet" |
| Criar anúncio político com criativo próprio | `ads_create_ad` com `object_story_spec.video_data` em conjunto de campanha `ISSUES_ELECTIONS_POLITICS` | **erro 2446466** "Cannot Have a Non Political Creative in a Political Campaign" (o MCP não expõe `authorization_category`) |
| Subir vídeo para a conta | `ads_creative_upload_media` e `ads_creative_upload_video` | "This tool is new and is being gradually rolled out" (gated nesta conta) |

Ou seja: seja lá o que a Meta aprovou, **não foi a permissão de `instagram_media_id` nem o rótulo político via API**. Anúncio eleitoral continua saindo só pelo Gerenciador.

## Achado na conta ELEIÇÃO

`PEPE COLLAÇO - ELEIÇÃO` (`1565441288651757`) segue com erro na única campanha (`TESTE 1 Campanha`):

> "Authorization Needed: Your ad account has not been authorized to run ads about social issues, elections or politics for this Page. To begin the authorization process, please visit Page Settings, select Professional Settings, and then select Issue, Electoral or Political Ads."

Se a aprovação do nome for para essa conta, falta ainda vincular a autorização política da conta à Página (`864936030306107`) nas configurações da Página. Enquanto isso, nada roda ali.

## O que ficou pronto e pausado

Criado para receber o reel novo assim que der para publicar:

| Nível | Nome | ID | Status |
|---|---|---|---|
| Campanha | `ELEIÇÕES \| REELS API \| 2026-09 \| Alcance \| SC` | `120249433616420716` | PAUSED, OUTCOME_AWARENESS, ISSUES_ELECTIONS_POLITICS/BR |
| Conjunto | `Pescaria Brava resultado \| 04-09 \| SC \| R30` | `120249433624920716` | PAUSED, R$30/dia, Alcance, região 459 (SC), 18 a 65 |

Link de edição: https://www.facebook.com/adsmanager/manage/ads?act=1700449990528437&selected_adset_ids=120249433624920716

Post alvo: reel de 04/09 (Pescaria Brava, "Quando o trabalho é de verdade, o resultado chega") — https://www.instagram.com/reel/Dc4RDmTuiWZ/ · `ig_media_id 17878706997628830`

Lixo da tentativa de boost, para apagar no Gerenciador: `ZZ | APAGAR | campanha vazia (erro boost 04-09)` (`120249433637410716`).

## Chrome

Tentei abrir o Gerenciador pelo navegador escolhido (Browser 1): o Facebook está **deslogado** (tela de perfil salvo pedindo login). Não digito senha, então parei aí.

## Estado da operação (sem erro novo)

Tudo que está ativo continua entregando: `ELEIÇÕES | REGIONAL 22 POSTS`, `ELEIÇÕES | VIDEOS CAMPANHA` (R$1.186,86 em 7 dias, 668.944 impressões), `ELEIÇÕES | ANTIGOS`, `Regional-33Posts`, `VID 01 Tubarão 60 ruas`. Os 3 conjuntos que ficaram sem anúncio em 02/09 (áudio deputado, equoterapia, salas sensoriais) já estão com anúncio ACTIVE. Único anúncio com problema é o `Novo anúncio de Reconhecimento` (`120249324395500716`), que já está PAUSADO e cujo conjunto entrega pelo `AD | Jingle 11223`.
