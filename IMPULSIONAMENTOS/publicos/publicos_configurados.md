# Públicos Configurados — Meta Ads Pepê Collaço

Conta: `1700449990528437`. Fonte: `dados/publicos.csv`. Extração: 16/07/2026.

Estes são os públicos que já existem na conta e que podemos reutilizar e expandir. Servem de base para segmentar os próximos impulsionamentos e para montar relatórios de entrega por público.

---

## 1. Públicos existentes na conta

### autismo (público salvo, por interesses)
- **ID:** `120214284492970716`
- **Tipo:** PLATFORM (público salvo por interesses/comportamento)
- **Tamanho estimado:** 42.200 a 49.700 pessoas
- **Criado em:** 18/12/2024
- **Uso:** base ampla para toda a pauta TEA (equoterapia, censo, salas sensoriais, Frente Parlamentar). É o público temático mais maduro da conta.

### cadastro ok fone.csv (lista própria)
- **ID:** `120242526060940716`
- **Tipo:** CUSTOM (lista de contatos enviada)
- **Tamanho estimado:** 1.100 a 1.300 pessoas
- **Criado em:** 08/04/2026
- **Uso:** base própria de contatos (provável lista de WhatsApp/telefones do gabinete). Ótima para remarketing e para gerar lookalikes.

### Semelhante (3%) - autismo (lookalike)
- **ID:** `120246609101900716`
- **Tipo:** LOOKALIKE (3%)
- **Tamanho estimado:** ~1.000
- **Criado em:** 11/06/2026
- **Uso:** expansão a partir da base própria, mais parecida (mais precisa).

### Semelhante (3% a 6%) - autismo (lookalike)
- **ID:** `120246609105170716`
- **Tipo:** LOOKALIKE (3% a 6%)
- **Tamanho estimado:** ~1.000
- **Criado em:** 11/06/2026
- **Uso:** expansão mais ampla a partir da base própria.

---

## 2. Públicos geográficos recorrentes (a formalizar)

Aparecem repetidamente na segmentação dos conjuntos, mas não estão salvos como públicos reutilizáveis. Recomendação: criar e salvar cada um para padronizar.

| Público | Escopo | Observação |
|---|---|---|
| **Tubarão** | Município + entorno | Base eleitoral principal |
| **AMUREL** | Associação (Sul) | Região da base |
| **Região Sul de SC** | Mesorregião | View de vídeo |
| **Santa Catarina** | Estado | Pautas estaduais |
| **Brasil** | Nacional | Alcance amplo (baixo CTR, rever uso) |

---

## 3. Estrutura de públicos recomendada

Para os próximos ciclos, organizar em três camadas:

**Camada 1: bases próprias (quentes)**
- Lista de contatos (`cadastro ok fone.csv`) e futuras listas por tema/cidade.
- Engajadores do Instagram e do Facebook (públicos de engajamento, 365 dias).

**Camada 2: lookalikes (mornas)**
- Semelhantes 1% a 3% das bases próprias, por tema (autismo, saúde, obras).

**Camada 3: interesses + geografia (frias)**
- Públicos salvos por interesse (autismo, saúde, agricultura) cruzados com Tubarão / AMUREL / SC.

---

## 4. Como usar nos relatórios

Ao rodar um impulsionamento, registrar qual público foi usado. Assim o relatório de entrega (`relatorios/modelo_relatorio_entrega.md`) consegue mostrar desempenho **por público**, não só por anúncio, e comparar bases próprias contra interesses/lookalike.

> Para criar novos públicos via MCP: `ads_create_custom_audience`. Para conferir tamanho e status antes de usar: `ads_get_custom_audience`.
