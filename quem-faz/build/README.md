# Como atualizar as páginas "Quem faz"

As páginas `pela-amurel/` e `por-tubarao/` **são geradas**. Não edite o
`index.html` delas à mão: a próxima execução do build apaga a alteração.

O texto fica em `dados/lugares.json`. Os números e os status vêm das bases.

## Rodar tudo

```bash
cd pepecollaco-site/quem-faz

node build/coletar-alesc.cjs     # e-Legis da Alesc  → dados/leis.json
node build/normalizar.cjs        # CSVs do gabinete  → dados/*.json + MATRIZ.csv
node build/gerar-paginas.cjs     # dados + texto     → <slug>/index.html
node build/atualizar-home.cjs    # leis.json         → seção #leis da home
```

Precisa só do Node (testado no 24). Sem dependências.

Para regerar as imagens de compartilhamento (essas sim pedem o Playwright, que
mora no projeto irmão `gerador-materiais`):

```bash
cd og
NODE_PATH="../../../gerador-materiais/node_modules" node render.cjs pela-amurel por-tubarao
```

## O que cada script faz

| Script | Lê | Escreve |
|---|---|---|
| `coletar-alesc.cjs` | portalelegis.alesc.sc.gov.br | `dados/leis.json` |
| `normalizar.cjs` | `EMENDAS /emendas_site_historico.csv`, `IMPRENSA/*.csv`, `REDES/*.csv` | `dados/emendas.json`, `imprensa.json`, `redes.json`, `MATRIZ.csv` |
| `gerar-paginas.cjs` | `dados/*.json` | `<slug>/index.html` |
| `atualizar-home.cjs` | `dados/leis.json` | trecho `#leis` de `../index.html` |

## As travas

O build falha de propósito, em vez de publicar número errado:

- **`normalizar.cjs`** confere que a base ainda tem 525 emendas somando
  R$ 156.367.827,19. Se o gabinete atualizar a planilha, atualize também a
  constante `CONTROLE` no topo do script — a quebra é o aviso de que os textos
  precisam ser revisados.
- **`gerar-paginas.cjs`** confere cada valor anunciado contra a base, pelo bloco
  `conferir` de cada lugar em `lugares.json`. Se a página diz R$ 88 milhões e a
  base diz outra coisa, o build para.
- **`coletar-alesc.cjs`** para se o e-Legis devolver menos proposições que o
  esperado, se uma ementa vier com o breadcrumb do portal ou se uma lei vier sem
  número. Status legislativo errado no ar é pior que build quebrado.

## Status legislativo: a regra

Nunca escreva "Aprovado" ou "Em comissões" à mão. O selo de cada card vem de
`leis.json`, apurado da tramitação oficial. Só um marcador vale:

- Onde a tramitação diz **"Transformado em Lei"**, o card mostra o número da lei.
- **"Arquivado" não quer dizer nada sozinho.** A Alesc arquiva tanto projeto
  rejeitado quanto projeto que virou lei e foi arquivado depois da sanção. Foi
  o que aconteceu com o Cine Azul: constava "Arquivado" e é a Lei 19.160/2025.

Em `lugares.json` você escolhe *quais* projetos aparecem e escreve a descrição.
O status, o número da lei e o link para o e-Legis o build resolve.

## Adicionar uma cidade

1. Rode `normalizar.cjs` e confira os números do município em `dados/emendas.json`
   (`porMunicipio`).
2. Escolha as matérias em `dados/imprensa.json` e os posts em `dados/redes.json`.
3. Acrescente a entrada em `lugares.json` copiando `por-tubarao` como molde:
   `seo`, `conferir`, `hero`, `placar`, `pergunta`, `secoes`, `fecho`.
4. Ponha o slug em `portas` com `"existe": true`.
5. `node build/gerar-paginas.cjs <slug>`.

Tipos de seção disponíveis: `obras`, `chips`, `pautas`, `leis`, `imprensa`,
`redes`. Todas são opcionais — cidade sem imprensa relevante simplesmente não
leva o bloco.

## MATRIZ.csv

Matriz de validação, uma linha por emenda e por proposição. Duas colunas são
para preencher à mão e sobrevivem à regeração:

- **`area_manual`** — corrige a área quando a classificação automática erra.
  São ~68 registros genéricos demais para o classificador (veículo, praça,
  material de construção).
- **`publicar`** — `sim`, `nao` ou `validar`. Nasce como `validar` quando a área
  saiu como "Outros".

## Pendências de validação com o gabinete

| Item | Situação |
|---|---|
| Enrocamento do Rio Capivari | A obra está na apresentação do mandato, mas sem valor. Na base só há "enrocamento no bairro Santo André", R$ 500 mil. A página mostra a obra **sem cifra** até o gabinete confirmar. |
| Termo de Cooperação TEA | O .docx está datado de 2016 e cita a UNESC; a reportagem da NDTV cita a Acafe. Nenhuma data ou parceiro é citado nas páginas até isso ser esclarecido. |
