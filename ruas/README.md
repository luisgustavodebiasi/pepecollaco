# RUAS — as ruas de Tubarão com recurso do mandato

Fonte-verdade dos dados da página **pepecollaco.com/tubarao/ruas/**
(no repositório do site: `pepecollaco-site/tubarao/ruas/`).

## De onde vêm os dados

- A relação de 69 ruas vem das **páginas 10 e 11** da apresentação
  `_APRESENTAÇÃO 1  MANDATO GERAL - 2026.pdf`: ruas de Tubarão contempladas
  por recursos de pavimentação, drenagem e rede de esgoto.
- Bairro, CEP e grafia oficial vêm da **base dos Correios**, consultada pela
  API pública ViaCEP (`completar-ceps.mjs`).

## Arquivos

| Arquivo | Papel |
|---|---|
| `ruas.json` | Fonte-verdade. Um registro por rua: `nome_arte` (como está na apresentação), `nome_oficial` (Correios), `bairro`, `cep`, `status`, `obs`. |
| `ruas-tubarao.csv` | A mesma base em CSV (`;`), para conferência no Excel/Numbers. |
| `completar-ceps.mjs` | Busca bairro e CEP das ruas ainda pendentes no ViaCEP e regrava `ruas.json` + `dados.js`. Roda devagar de propósito (600 ms por chamada). |

## Status

- `confirmado` — o logradouro dos Correios bate com o da apresentação
  (diferenças só de acento, abreviação ou erro de digitação da própria base).
- `provavel` — o ViaCEP devolveu um nome próximo, mas não idêntico
  (ex.: "Manoel Pedro" → "Manoel Pedro Rosa"). Conferir com o gabinete.
- `pendente` — sem correspondência confiável. Em 31/08/2026 são 7:
  Caruru, João Silva, José Corrêa de Souza (sem o "Sobrinho"),
  Exped. J. Anastácio Teixeira, Beco 1900, Gilson Teodoro Ouriques e
  Adário Bernardinho Damásio. O campo `obs` explica cada caso.

O campo `obs` é **anotação interna de conferência** e não é exibido na página
publicada; só `nome_oficial`, `bairro` e `cep` aparecem lá.

## O mapa

A página desenha o traçado real de 65 das 69 ruas (Leaflet + tiles do
OpenStreetMap na base clara, só com a saturação puxada para baixo por filtro
CSS). Cada rua é uma polyline amarela (#FFC400) sobre um casing navy num pane
próprio: o amarelo sozinho some sobre base clara. As geometrias vêm do OSM via
Overpass e moram em `pepecollaco-site/tubarao/ruas/dados-mapa.js` (~31 KB).

- `osm-match.json` — id da rua → nome da via no OSM. Inclui 6 casamentos
  manuais por grafia (ex.: "Exped. J. Anastácio Teixeira" é a
  "Rua Expedicionário **Joaquim** Anastácio Teixeira" do OSM, via distinta
  da Anastácio Teófilo).
- Sem traçado (não existem no OSM com esses nomes): Caruru, João Silva,
  José Corrêa de Souza e Adolfo José de Souza.
- Duas homônimas resolvidas por âncora geográfica do bairro dos Correios:
  São Geraldo (Oficinas) e Valdemar Rafael (margem esquerda).

Para regerar as geometrias: Overpass query por nome exato dentro da área
administrativa de Tubarão (`out geom`), filtrando as homônimas pela âncora.

A imagem de compartilhamento (`og.jpg`) tem molde e gerador em
`pepecollaco-site/tubarao/ruas/og/` (mesmo esquema das páginas QUEM FAZ):

```bash
cd pepecollaco-site/tubarao/ruas/og
NODE_PATH="../../../../gerador-materiais/node_modules" node render.cjs
```

## Atualizar a página

```bash
cd RUAS
node completar-ceps.mjs          # completa pendentes via ViaCEP
cp dados.js ../pepecollaco-site/tubarao/ruas/dados.js
cd ../pepecollaco-site && git add tubarao/ruas && git commit && git push
```

Correção manual (trecho certo, CEP confirmado pelo gabinete): edite
`ruas.json`, mude o `status` para `confirmado` e regenere `dados.js` com
`node -e "const d=require('./ruas.json');require('fs').writeFileSync('dados.js','window.RUAS = '+JSON.stringify(d.ruas,null,2)+';\n')"`.
