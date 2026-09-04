# Campanha Regional 33 Posts — 26/07/2026

## O que foi criado

| Item | Valor |
|---|---|
| Campanha | `CAMP \| 2026 \| Regional-33Posts \| Alcance \| Sul-SC` |
| ID | `120248619203680716` |
| Objetivo | OUTCOME_AWARENESS (Alcance) |
| Categoria especial | **ISSUES_ELECTIONS_POLITICS** (país: BR) |
| Conjuntos | 33, todos PAUSED |
| Orçamento | R$50 lifetime por conjunto = **R$1.650** |
| Otimização | REACH, cobrança por IMPRESSIONS, lance automático |
| Plataforma | Instagram apenas |
| Período | 27/07/2026 09:00 a 03/08/2026 09:00 |
| Segmentação | raio custom por cidade (12 a 80 km), 18 a 65 anos, location_types home |
| Anúncios | 23, inseridos no Gerenciador |

## Publicação (26/07/2026, 18h05)

Campanha **ATIVA**. **15 conjuntos publicados**, R$50 cada, **R$750 em veiculação**:

4 Morro da Fumaça, 7 Nova Veneza, 9 Braço do Norte, 14 Tubarão, 19 Gravatal, 23 Tubarão, 24 Ituporanga, 30 A confirmar, 32 Autismo/SC, 33 Orleans, 34 A confirmar, 36 Capivari de Baixo, 44 Içara, 49 Rio Fortuna, 52 Braço do Norte.

Conteúdo de cada um conferido contra o reel pretendido: legendas batem.

## Segunda rodada (26/07/2026, 18h30)

Criados os conjuntos **57 Benedito Novo** (`120248619801880716`, raio 15 km) e **58 Maravilha** (`120248619803630716`, raio 18 km), mesma configuração. Criativos inseridos pelo Luis.

Ativados mais 10 conjuntos: 1, 2, 11, 13, 31, 37, 39, 55, 57, 58.

**Total em veiculação: 25 conjuntos, R$1.250.**

O aviso "Autentique sua conta" não bloqueou a ativação via MCP: os 5 anúncios (1, 2, 11, 13, 37) foram para ACTIVE normalmente. O aviso segue de pé na conta e vale resolver.

Conjuntos 39 e 57 estão ativos mas os anúncios ficam pendentes até `marquinhosfloripa` e `jeanm.grundmann` aprovarem o pedido de parceria por direct. Não consomem verba enquanto pendentes.

Conjunto 58 Maravilha tem **2 anúncios** dividindo os R$50.

### 9 conjuntos seguem pausados, todos por falta de anúncio

10, 35, 38, 40, 42, 45, 48, 53, 56. R$450 disponíveis.

### Estado anterior (primeira rodada)

| Motivo | Itens |
|---|---|
| Aviso "Autentique sua conta" na conta de anúncios | 1, 2, 11, 13, 37 |
| Permissão de collab pendente no Instagram | 31 (dra.giovanagalato), 39 (marquinhosfloripa) |
| Sem anúncio criado | 10, 35, 38, 40, 42, 45, 48, 53, 56 |

Conjunto 3 (O Pau Que Rola Nas Redes) foi arquivado: já roda em outra campanha.
Conjunto 55 usa post diferente do planejado, troca proposital do Luis.

## Por que os anúncios ficaram pendentes

O app `PEPE` (`1232928232192609`) está em **modo de desenvolvimento** e não pode ir para Live por falta de verificação de CNPJ. Consequência: a Graph API recusa criar qualquer criativo com erro `1885183`.

Caminhos testados em 26/07/2026:

| Caminho | Resultado |
|---|---|
| Graph API, `source_instagram_media_id` | erro `1885183` (app em dev mode) |
| Graph API, `instagram_permalink_url` | erro `1885183` |
| Graph API, vídeo re-upado + `video_data` | erro `1885183` |
| MCP `ads_boost_ig_post` | gated, rollout gradual |
| MCP `ads_get_ig_accounts` / `ads_get_ig_media` | gated |
| MCP `ads_create_creative` | **funciona** (usa app first-party da Meta) |
| MCP `ads_create_ad` com criativo do MCP | erro `2446466` — criativo sai como não político e a campanha é política |

O `authorization_category=POLITICAL` só pode ser definido na criação do criativo, e o MCP não expõe esse campo. Por isso a inserção do criativo tem que ser feita no Gerenciador de Anúncios, que atribui `POLITICAL` automaticamente. Confirmado: os anúncios da campanha política ativa (`120248442360580716`) têm `authorization_category: POLITICAL` e `object_story_id` do post real.

**Vantagem colateral:** pelo Gerenciador, usando "Usar publicação existente", o anúncio preserva curtidas e comentários do reel original. O criativo re-upado por API perderia essa prova social.

## Próximo passo

Inserir 33 anúncios no Gerenciador, um por conjunto, via "Usar publicação existente" a selecionar o reel do Instagram. Lista de trabalho pronta em `dados/checklist_anuncios_2026-07-26.csv` com conjunto, ID, cidade, permalink do reel e nome padronizado do anúncio.

## Pendências

1. **Item 34 (MAIS INVESTIMENTO NO CAMPO)** — link do reel veio truncado, falta reenviar.
2. **Item 35 (PAULO LOPES FAZ E FAZ RÁPIDO)** — conjunto existe mas o post não veio na lista.
3. **Itens 30, 31, 37** — cidade marcada "A confirmar", hoje segmentados em raio de 60 km de Tubarão.
4. Campanha antiga `LAP-[ALCANCE INSTA][33 POSTS REGIAO][R$1.650,00 26/07/2026]` (`120248617622330716`) ficou pausada, sem categoria especial e sem anúncios. Arquivar para não duplicar.
5. Ficaram na biblioteca da conta um vídeo (`1026298520296791`) e um criativo (`1018120287654701`) do diagnóstico, sem anúncio vinculado. `ads_creative_delete` está gated; remover pelo Gerenciador quando conveniente.

## Arquivos

| Caminho | Conteúdo |
|---|---|
| `dados/plano_33_posts_2026-07-26.csv` | mapa conjunto original a reel |
| `dados/checklist_anuncios_2026-07-26.csv` | lista de trabalho para o Gerenciador |
