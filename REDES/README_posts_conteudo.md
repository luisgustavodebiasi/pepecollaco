# Base de posts das redes (últimos 3 anos)

Lista de tudo que o mandato publicou no Instagram e na Página do Facebook entre
**01/09/2023 e 31/08/2026**, com link, data, legenda inteira e engajamento.

Serve para o site: quando um texto citar algo específico — o ginásio de Sangão,
o enrocamento de Capivari, a SC-370, a dragagem do Porto de Laguna — dá para
achar o post original e linkar a prova.

Extraído em **01/09/2026** pela Graph API v23.0.

## Os arquivos

| Arquivo | O que é |
|---|---|
| `acervo-posts.html` | **Comece por aqui.** A página de consulta: abre com duplo clique, busca por assunto, destaca o termo na legenda e copia o link. Não precisa de servidor nem de internet, só a fonte vem da web |
| `posts_conteudo_3anos_unico.csv` | Os mesmos 686 conteúdos em planilha, para cruzar com outras bases |
| `posts_conteudo_3anos.csv` | Bruto, 1.038 linhas, uma por publicação em cada rede (auditoria) |
| `acervo-posts.artifact.html` | A mesma página sem o esqueleto HTML, caso um dia se queira publicar como link |

Cobertura: 647 posts do Instagram + 391 da Página. Desses, 350 são o mesmo
conteúdo nas duas redes, e por isso o consolidado tem 686 linhas e não 1.038.

Na página, digite `/` para cair direto na busca. Os atalhos de assunto e de
município são os termos que mais aparecem nas legendas, com a contagem ao lado.

## Colunas do arquivo consolidado

| Coluna | Conteúdo |
|---|---|
| `data`, `hora` | Publicação (`AAAA-MM-DD`, hora UTC) |
| `redes` | `instagram`, `facebook` ou `facebook+instagram` |
| `tipo` | `REELS`, `FEED` ou `post` (Facebook) |
| `link` | Link principal — o do Instagram quando existe |
| `link_facebook` | Link do crosspost, quando o post saiu nas duas |
| `curtidas`, `comentarios`, `engajamento` | Do Instagram (`engajamento` = curtidas + comentários) |
| `compartilhamentos`, `salvamentos`, `alcance`, `visualizacoes`, `novos_seguidores` | Do export do Business Suite (ver abaixo) |
| `id_instagram`, `id_facebook` | Ids da API (o do Instagram serve para impulsionar) |
| `legenda` | Texto integral, com quebras de linha e emojis |

## Métricas: por que vêm de dois lugares

A Graph API entrega **curtidas e comentários** de todo post do Instagram. Mas
**alcance, visualizações, salvamentos e novos seguidores** ela só entrega com a
permissão `instagram_manage_insights`, que o app PEPE não tem aprovada — nenhum
token resolve isso, é caso de App Review. Do Facebook a API também não entrega
curtidas nem comentários, pelo mesmo motivo (`pages_read_engagement` não
aprovado); de lá vêm só link, data, legenda e compartilhamentos.

O que a API nega, o **export manual do Business Suite** entrega, e casa certinho
com a nossa base pela "Identificação do post" (é o mesmo id da API).

**Estado hoje: 310 dos 647 posts do Instagram estão com métrica completa.** Os
exports que temos cobrem 2025 inteiro e dez/2025 a jun/2026.

### Como completar o resto

1. Meta Business Suite → **Insights** → **Conteúdo**
2. Escolher o período (o Business Suite limita a janela, então saem vários
   arquivos — tudo bem, o script aceita quantos forem e lida com sobreposição)
3. **Exportar dados** → CSV
4. Jogar os arquivos em `metricas_export/` e rodar:

```bash
cd REDES && python3 enriquecer_metricas.py
```

Ele diz quantos posts ainda estão sem métrica e qual período falta. Pendentes
hoje: **set/2023 a dez/2024** (256 posts) e **jun/2026 a ago/2026** (81 posts).

O export traz posts de outras contas (marcações e colaborações); o script
filtra só o `@pepecollaco`.

## Regerar

```bash
cd ../IMPULSIONAMENTOS/scripts
node extrair_conteudo_posts.mjs --anos=3 --source=both --token=EAxxxx
cd ../../REDES
python3 consolidar_posts.py      # 1 linha por conteúdo
python3 enriquecer_metricas.py   # aplica os exports do Business Suite
python3 gerar_documento.py       # remonta a página de consulta
```

Rode sempre nessa ordem: o `consolidar_posts.py` recria o arquivo do zero e
zera as colunas de métrica, que o `enriquecer_metricas.py` preenche de novo.

Detalhes das opções: cabeçalho do `extrair_conteudo_posts.mjs`. É só leitura,
não cria nada e não gasta nada.
