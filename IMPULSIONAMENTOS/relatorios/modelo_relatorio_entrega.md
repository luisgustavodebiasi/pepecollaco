# Relatório de Entrega de Impulsionamentos

> Modelo padrão. Copiar este arquivo para `relatorios/YYYY-MM_relatorio.md` e preencher. Dados via MCP Meta (`ads_get_ad_entities` com `time_range`), conta `1700449990528437`.

---

## Identificação
- **Período:** DD/MM/AAAA a DD/MM/AAAA
- **Responsável:** _____________
- **Data do relatório:** DD/MM/AAAA

## 1. Resumo do período

| Métrica | Valor | Meta | Situação |
|---|---|---|---|
| Investimento | R$ | | |
| Impressões | | | |
| Alcance (únicos) | | | |
| Cliques | | | |
| CPM médio | R$ | abaixo de R$5,00 | |
| CPC médio | R$ | | |
| CTR médio | % | acima de 1,00% | |
| Frequência | | 1,5 a 3,0 | |

## 2. Investimento por objetivo

| Objetivo | Anúncios | Investido | Alcance | CTR |
|---|---|---|---|---|
| Engajamento | | R$ | | % |
| Cliques no link | | R$ | | % |
| Reconhecimento | | R$ | | % |

## 3. Investimento por tema

| Tema | Anúncios | Investido | Alcance | CTR |
|---|---|---|---|---|
| Autismo / TEA | | R$ | | % |
| Saúde | | R$ | | % |
| Infraestrutura / obras | | R$ | | % |
| Tubarão | | R$ | | % |
| AMUREL / Sul | | R$ | | % |
| Atualidades / reação | | R$ | | % |

## 4. Investimento por público

| Público | Investido | Alcance | CTR | Custo por resultado |
|---|---|---|---|---|
| Base própria (lista) | R$ | | % | R$ |
| Lookalike | R$ | | % | R$ |
| Interesse + geo | R$ | | % | R$ |

## 5. Top 5 anúncios do período

| Anúncio | Investido | Alcance | CTR | Destaque |
|---|---|---|---|---|
| | R$ | | % | |

## 6. Destaques e aprendizados
- O que funcionou:
- O que não funcionou:
- Ajustes para o próximo período:

## 7. Ações executadas via MCP no período
| Data | Ação | Entidade | Valor | Status |
|---|---|---|---|---|
| | criar/pausar/ativar | | R$ | |

---

### Como preencher (passo a passo)
1. Rodar `ads_get_ad_entities` no nível `account` com o `time_range` do período para a seção 1.
2. Rodar nível `campaign` e `ad` com o mesmo `time_range`, ordenar por gasto e por CTR.
3. Exportar os resultados para CSV em `dados/` (reaproveitar `scripts` de processamento).
4. Preencher as tabelas e escrever os aprendizados.
5. Registrar no repositório para histórico e prestação de contas.
