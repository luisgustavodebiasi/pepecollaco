# Como atualizar as páginas "Quem faz"

**São geradas**, e não se editam à mão (a próxima execução do build apaga a
alteração):

| Página | Texto em |
|---|---|
| `index.html` (o índice, /quem-faz/) | `dados/indice.json` |
| `por-tubarao/`, `pela-amurel/`, `pela-amrec/`, `pela-amesc/`, `pelo-autismo/` | `dados/lugares.json` |
| `projetos-de-lei/` e as 7 páginas de lei dentro dela | `dados/leis-paginas.json` |

Os números e os status vêm das bases. `pelo-sul/` foi apagada em 25/09/2026
(deu lugar a AMREC e AMESC). As outras duas (`pela-educacao/`,
`pelas-cidades/`) ainda são escritas à mão;
nelas o build só mexe no trecho entre `<!-- visual:inicio -->` e
`<!-- visual:fim -->` e na grade de portas (ver `atualizar-manuais.cjs`).

## Rodar tudo

```bash
cd quem-faz

node build/coletar-alesc.cjs        # e-Legis da Alesc       → dados/leis.json
node build/normalizar.cjs           # CSVs do gabinete       → dados/*.json + MATRIZ.csv
node build/coletar-instagram.cjs    # Graph API (token)      → dados/instagram.json + redes/capas/
node build/preparar-fotos.cjs       # dados/fotos.json       → img/*.webp
node build/gerar-paginas.cjs        # dados + texto          → index.html, <slug>/, projetos-de-lei/
node build/atualizar-manuais.cjs    # dados/manuais.json     → trecho das 4 páginas manuais
node build/atualizar-home.cjs       # leis.json              → seção #leis da home
cd og && node render-chrome.cjs     # imagens de compartilhamento do índice e das leis
```

Precisa só do Node (testado no 24), mais `magick` e `ffmpeg` (Homebrew) para as
fotos e o Google Chrome instalado para as imagens de compartilhamento. Sem
dependências de npm.

## Regras de conteúdo (25/09/2026)

- **Nenhum valor em reais por município**, em lugar nenhum: nem total de
  cidade, nem lista de cidades com valor. O build recusa `municipio.*` no
  bloco `conferir`, e a seção `chips` mostra só o nome. Total de região e de
  tema pode; valor de uma obra específica no card de obra também.
- Projeto que virou lei leva o selo verde **APROVADO**, com o número da lei ao
  lado. Vem de `leis.json`, nunca escrito à mão.
- Tema autismo: `"tema": "autismo"` no lugar (ou na lei, em
  `leis-paginas.json`) troca a estética da página (fundo claro nas seções de
  leitura, cores do espectro, corpo maior, fundo parado). O total do tema sai
  de `lib/temas.cjs`, com critério escrito, e é conferido por `tema.autismo.*`.

## Posts do Instagram

`coletar-instagram.cjs` lista os posts do @pepecollaco pela Graph API e baixa a
capa de cada um em WebP (`redes/capas/<shortcode>.webp`). As páginas mostram a
capa e levam para o post; não usam o embed oficial, que pesa meio megabyte por
post e quebra quando o post sai do ar.

- **O token nunca entra no repositório**, que é público. Ele vem de
  `META_TOKEN` ou de `IMPULSIONAMENTOS/scripts/token.txt` (fora do Git).
- Tokens desta conta vencem em cerca de duas horas. A resposta crua fica em
  `build/.cache/` (fora do Git) com as URLs de CDN, que duram alguns dias: dá
  para baixar capa depois com `--so-capas`, sem token.
- `--desde=AAAA-MM-DD` escolhe a janela; `--incluir=SC1,SC2` acrescenta posts
  antigos que alguma página cita (a lista só cresce).
- Quadro de vídeo no lugar da capa: `--quadro=SHORTCODE@SEGUNDOS`.
- `dados/indice.json` → `ocultar`: posts que não entram nos blocos automáticos
  de "Nas redes" (não somem do Instagram, só não viram vitrine).

## Fotos

Cada foto nasce de `dados/fotos.json`: arquivo do site (`assets/img/`,
`foto/pepe-por-elas/g/`), quadro de um reel baixado (`build/.cache/video/`) ou
foto do **Pexels** pelo id. `preparar-fotos.cjs` recorta na proporção pedida e
grava `img/<id>.webp`.

Foto de banco leva `"ilustrativa": true` e aparece com o selo **imagem
ilustrativa** na página. Foto de banco nunca mostra gente que possa passar por
beneficiário do mandato: só objeto, paisagem e lugar.

Para regerar as imagens de compartilhamento das páginas temáticas (essas pedem
o Playwright, que mora no projeto irmão `gerador-materiais`):

```bash
cd og
NODE_PATH="../../gerador-materiais/node_modules" node render.cjs pela-amurel por-tubarao
```

As do índice e das leis saem de `og/render-chrome.cjs`, que usa o Chrome do
sistema e o mesmo molde.

## O que cada script faz

| Script | Lê | Escreve |
|---|---|---|
| `coletar-alesc.cjs` | portalelegis.alesc.sc.gov.br | `dados/leis.json` |
| `normalizar.cjs` | `EMENDAS /emendas_site_historico.csv`, `IMPRENSA/*.csv`, `REDES/*.csv` | `dados/emendas.json`, `imprensa.json`, `redes.json`, `MATRIZ.csv` |
| `coletar-instagram.cjs` | Graph API (token fora do Git) | `dados/instagram.json`, `redes/capas/` |
| `preparar-fotos.cjs` | `dados/fotos.json` | `img/*.webp` |
| `gerar-paginas.cjs` | `dados/*.json` | `index.html`, `<slug>/index.html`, `projetos-de-lei/**` |
| `atualizar-manuais.cjs` | `dados/manuais.json` | trecho marcado das 4 páginas manuais |
| `atualizar-home.cjs` | `dados/leis.json`, `dados/leis-paginas.json` | trecho `#leis` de `../index.html` |

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
