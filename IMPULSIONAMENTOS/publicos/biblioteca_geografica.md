# Biblioteca Geográfica Reutilizável

Segmentações de geografia prontas para colar no campo `targeting.geo_locations` ao criar um conjunto de anúncios (`ads_create_ad_set`) na conta `1700449990528437`. Arquivo com os specs em JSON: `biblioteca_geografica.json`.

## Por que biblioteca e não "público salvo"

O MCP oficial da Meta **não cria públicos salvos** (saved audiences) nem tem busca de segmentação para resolver chaves de região/cidade. Logo, Tubarão, AMUREL e SC não viram um objeto clicável na conta pela via MCP. A forma reutilizável e mais precisa é manter os **specs de geolocalização** aqui e aplicá-los a cada conjunto. Vantagem: versionado, auditável e igual em toda campanha.

## Como usar

Ao montar um conjunto, use o bloco do local desejado dentro do `targeting`:
```json
{ "geo_locations": { "custom_locations": [ { "latitude": -28.4713, "longitude": -49.0069, "radius": 20, "distance_unit": "kilometer" } ] } }
```

## Locais disponíveis

| Local | Método | Status | Cobertura |
|---|---|---|---|
| **Brasil** | `countries: ["BR"]` | Pronto | País inteiro (CTR baixo, rever) |
| **Tubarão** | Raio 20 km | Pronto | Cidade e entorno |
| **AMUREL** | 3 raios (Tubarão, Laguna, Braço do Norte) | Pronto | Maioria dos 18 municípios |
| **Sul-SC** | 2 raios (Tubarão, Criciúma) | Pronto | Sul catarinense amplo |
| **SC (estado)** | Chave de região | Pendente | Precisa da chave de região de SC |

Notas:
- Raio (custom_locations) é círculo, não segue o limite exato do município. Suficiente para impulsionamento.
- Limite de raio da Meta: 80 km por ponto. Por isso um estado inteiro não cabe em um raio único.
- **SC estado** exige `geo_locations.regions[].key`. Essa chave não é resolvível pelo MCP hoje. Opções: pegar a chave no Ads Manager uma vez e fixar aqui, ou usar `Sul-SC` quando o foco for a base regional. Enquanto isso o fallback é `Brasil`.
- Coordenadas são centros aproximados de cidade. Conferir se precisar de precisão fina.

## Municípios da AMUREL (referência)

Armazém, Braço do Norte, Capivari de Baixo, Grão-Pará, Gravatal, Imaruí, Imbituba, Jaguaruna, Laguna, Pedras Grandes, Pescaria Brava, Rio Fortuna, Sangão, Santa Rosa de Lima, São Ludgero, São Martinho, Treze de Maio, Tubarão.

> Lista para conferência. Se quiser AMUREL por cidade exata (em vez de raio), dá para adicionar um `custom_location` por município com as coordenadas de cada sede.
