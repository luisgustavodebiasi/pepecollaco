# CLAUDE.md — Impulsionamentos Meta Ads (Pepê Collaço)

Módulo de gestão de impulsionamentos e campanhas de tráfego do mandato, operado via **MCP oficial da Meta** (`mcp__claude_ai_meta_mcp__*`) dentro do Claude Code.

> Objetivo: centralizar dados, públicos, padrões e relatórios para planejar, executar e prestar contas dos impulsionamentos das redes do Pepê de forma organizada e auditável.

---

## 1. Contas de anúncio

Arquivo completo: `dados/contas_meta_ads.csv`

| Papel | Conta | ID | Status |
|---|---|---|---|
| **PRINCIPAL do mandato** | CA - PEPE COLLAÇO - OFICIAL | `1700449990528437` | Ativa, com pagamento, MCP liberado |

Outras contas acessíveis pelo mesmo login (Libras.se, CA01, Movimento Sou Bem, Expedito): ver CSV. Só a conta oficial acima é usada para o mandato.

- **Página do Facebook vinculada:** `864936030306107`
- **Instagram:** a listagem de contas IG via MCP ainda está em rollout gradual da Meta para essa conta (voltar a testar depois).
- **Moeda:** BRL. **Orçamento diário mínimo:** R$5,16.

---

## 2. Como o MCP opera (regras de segurança)

O MCP permite **ler** (relatórios, métricas, públicos) e **escrever** (criar/editar/pausar campanhas, conjuntos, criativos, impulsionar posts). Regras fixas deste módulo:

1. **Toda ação que gasta dinheiro exige confirmação explícita do Luis/Pepê antes de executar.** Nunca criar ou ativar entrega sem "pode publicar".
2. **Criar sempre PAUSADO primeiro.** Montar campanha/conjunto/anúncio, revisar público, orçamento, criativo e segmentação, e só ativar depois do OK.
3. **Nunca alterar ou pausar campanha ativa existente** sem pedido claro. Ler antes de escrever.
4. **Registrar toda ação** (o que foi criado, valor, público, data) em `relatorios/` para prestação de contas.
5. Confirmar sempre a `ad_account_id` (`1700449990528437`) antes de qualquer escrita.

### Ferramentas mais usadas
- Leitura: `ads_get_ad_entities` (conta/campanha/conjunto/anúncio), `ads_get_ad_account_custom_audiences`, `ads_get_creatives`, `ads_get_insights_*`.
- IG/boost: `ads_get_ig_media`, `ads_boost_ig_post`.
- Escrita: `ads_create_campaign`, `ads_create_ad_set`, `ads_create_creative`, `ads_create_ad`, `ads_activate_entity`, `ads_update_entity`.
- Públicos: `ads_create_custom_audience`, `ads_get_custom_audience`.

### Dica técnica (importante)
`ads_get_ad_entities` devolve valores já formatados em BR (`R$3.374,92`, `889.513`, `1,14%`). Consultas com `limit` alto estouram o contexto e são salvas em arquivo: processar com `jq`/Python (ver `scripts` do processamento). Campos válidos variam por nível; use `ads_get_field_context` em caso de erro de campo. `summary.total_count` é pouco confiável: conferir pelo tamanho real do array.

---

## 3. Panorama histórico da conta (desde 02/12/2024)

Fonte: `relatorios/panorama_geral.md` e `dados/`.

| Métrica | Valor |
|---|---|
| Investimento total | **R$10.755,24** |
| Impressões | 2.589.717 |
| Alcance (pessoas únicas) | 960.701 |
| Cliques | 24.270 |
| CPM médio | R$4,15 |
| CPC médio | R$0,44 |
| CTR médio | 0,94% |
| Frequência | 2,70 |
| Campanhas | 9 |
| Conjuntos | 205 |
| Anúncios | 206 |

**Leitura rápida:** operação quase 100% de **engajamento/visualização** (impulsionar posts e vídeos), tickets pequenos (R$30 a R$150 por impulso), foco geográfico em Tubarão, AMUREL, Sul e Santa Catarina. Conteúdo de **reação a temas do dia** (notícias, datas) rende os melhores CTR.

### Benchmarks internos (usar como referência de meta)
- CPM saudável: **R$3,50 a R$5,00** (a conta já opera nessa faixa).
- CTR de engajamento aceitável: **acima de 1%**; bom acima de 2%; excelente acima de 4%.
- Os campeões de CTR (4% a 11%) foram posts de **reação/atualidade** e ganchos curtos ("SERÁ?", "BANCO MASTER", "DEMOCRACIA", "CRIANÇAS NA INTERNET").

---

## 4. Públicos configurados

Arquivo: `dados/publicos.csv` e detalhamento em `publicos/publicos_configurados.md`.

| Público | Tipo | Tamanho | Uso |
|---|---|---|---|
| autismo | Salvo (interesses) | 42.200 a 49.700 | Base grande para pauta TEA |
| cadastro ok fone.csv | Lista (CUSTOM) | 1.100 a 1.300 | Base própria de contatos |
| Semelhante (3%) - autismo | Lookalike | ~1.000 | Expansão a partir da lista |
| Semelhante (3% a 6%) - autismo | Lookalike | ~1.000 | Expansão mais ampla |

Públicos geográficos recorrentes (Tubarão, AMUREL, Sul-SC, SC, Brasil): o MCP **não cria públicos salvos geográficos**. A forma reutilizável é a **biblioteca de segmentação** em `publicos/biblioteca_geografica.md` (+ `.json`), com specs `geo_locations` prontos para colar no `targeting` do conjunto.

---

## 5. Padrão de nomenclatura

Guia completo com dicionário de blocos, exemplos e proposta de renomeação: `guia_nomenclatura.md`.

Padrão por nível (separador ` | `, sem travessão):
- **Campanha:** `CAMP | AAAA | EIXO/TEMA | OBJETIVO | GEO`
- **Conjunto:** `CONJ | PUBLICO | GEO | PLATAFORMA | Rvalor`
- **Anúncio:** `AD | tema-do-post | FORMATO | AAAA-MM-DD`

Vantagem: filtra e agrega fácil nos relatórios (por tema, geo, período, valor). O padrão vale para tudo criado daqui pra frente; anúncios históricos não são renomeados em massa.

---

## 6. Fluxo para criar um impulsionamento

1. **Briefing:** post/vídeo a impulsionar, objetivo, verba, período, público, geo.
2. **Localizar o conteúdo:** `ads_get_ig_media` (IG) ou o post no Facebook.
3. **Montar PAUSADO:** campanha, conjunto (público + geo + orçamento), criativo.
4. **Revisar comigo:** público certo? geo certo? verba certa? nome no padrão?
5. **Confirmar e ativar** (`ads_activate_entity`) só após "pode publicar".
6. **Registrar** no relatório do período.

---

## 7. Relatórios de entrega

- Modelo pronto: `relatorios/modelo_relatorio_entrega.md`.
- Panorama geral (histórico): `relatorios/panorama_geral.md`.
- Para gerar um relatório de período: puxar `ads_get_ad_entities` no nível desejado com `time_range`, exportar CSV em `dados/` e preencher o modelo.

---

## 8. Arquivos do módulo

| Caminho | Conteúdo |
|---|---|
| `dados/contas_meta_ads.csv` | Contas acessíveis e status |
| `dados/campanhas.csv` | 9 campanhas com métricas |
| `dados/anuncios.csv` | 206 anúncios com métricas |
| `dados/conjuntos.csv` | 205 conjuntos com métricas e orçamentos |
| `dados/publicos.csv` | Públicos configurados |
| `guia_nomenclatura.md` | Padrão de nomes + proposta de renomeação |
| `publicos/publicos_configurados.md` | Detalhe e recomendações de públicos |
| `publicos/biblioteca_geografica.md` / `.json` | Segmentações geográficas reutilizáveis |
| `relatorios/panorama_geral.md` | Análise completa do histórico |
| `relatorios/levantamento_posts_instagram.md` | Posts sponsoráveis + plano de alcance/autismo/remarketing |
| `dados/candidatos_impulsionamento.csv` | 43 posts com bons números para reimpulsionar |
| `dados/posts_ig.csv` | 1.243 posts do Instagram (id, legenda, permalink, data) |
| `dados/posts_ig_shortlist_enriquecida.csv` | Recentes + autismo com curtidas/comentários reais |
| `scripts/listar_posts_ig.mjs` + README | Extrai posts do IG via Graph API (contorna o MCP gated) |
| `dados/catalogo_posts_impulsionaveis.csv` | 752 posts (2023-2026) com engajamento real + tema |
| `relatorios/Relatorio_Levantamento_Completo_Posts_Pepe_2026-07-16.pdf` | PDF grande: pesquisa por tema + campanhas a criar |
| `dados/catalogo_curado.csv` | Curadoria 2025-26 (status/motivo/alvo por post) |
| `relatorios/Relatorio_Curadoria_Posts_Pepe_2026-07-16.pdf` | PDF pós-curadoria: aprovados/avaliar/removidos |
| `relatorios/Plano_Impulsionamentos_Pepe_Apresentacao_Final_2026-07-16.pdf` | Apresentação final do plano curado (78 posts por tema/cidade) |
| `relatorios/modelo_relatorio_entrega.md` | Template de relatório de entregas |

> Dados extraídos em 16/07/2026 via MCP Meta. Reprocessar periodicamente para manter os CSVs atualizados.
