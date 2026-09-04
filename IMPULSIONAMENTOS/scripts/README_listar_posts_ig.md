# Listar posts do Instagram via API (para direcionar pelo MCP)

`listar_posts_ig.mjs` puxa os posts publicados do Instagram do @pepecollaco pela
Graph API (mesma chamada do painel Next.js) e mostra o `ig_media_id` de cada um.
Esse id é o que o MCP oficial da Meta (`ads_boost_ig_post`) pede para impulsionar.

**É só leitura. Não cria nada e não gasta nada.**

## Rodar em outro terminal

```bash
cd "/Users/luisgustavodebiasi/TRABALHOS/Projetos Externo/PEPE/IMPULSIONAMENTOS/scripts"

# jeito mais simples: passar o token direto
node listar_posts_ig.mjs --token=EAxxxxxxxx

# ou exportar o token na sessão do terminal
export META_TOKEN=EAxxxxxxxx
node listar_posts_ig.mjs
```

Requisitos: Node 18+ (aqui está o 24). Nenhuma dependência a instalar.

## De onde vem o token (ordem de prioridade)

1. `--token=...` no comando
2. variável de ambiente `META_TOKEN`
3. arquivo `token.txt` na mesma pasta do script (NÃO versionar)
4. `META_SYSTEM_USER_TOKEN` do `.env.local` do credenciamento-next

Os demais valores (IG user id, page id, versão da API e o app secret para o
`appsecret_proof`) são lidos do `.env.local` em
`../../PEPECOPY/credenciamento-next/.env.local`.

## Opções úteis

| Flag | O que faz |
|---|---|
| `--limit=N` | posts por página (padrão 25) |
| `--all` | pagina até o fim (pega o feed inteiro) |
| `--source=ig\|page\|both` | Instagram (padrão), Página do FB, ou os dois |
| `--json` | imprime JSON cru (bom para pipe) |
| `--csv=arquivo.csv` | salva o resultado em CSV |
| `--no-proof` | não envia appsecret_proof (token de outro app) |
| `--env=caminho` | usar outro `.env.local` |

Exemplos:

```bash
node listar_posts_ig.mjs --all --csv=../dados/posts_ig.csv
node listar_posts_ig.mjs --source=both --limit=50
node listar_posts_ig.mjs --json | jq '.[].ig_media_id'
```

## Depois de listar: impulsionar pelo MCP

Com o `ig_media_id` em mãos, o boost é montado com:

- `ad_account_id = 1700449990528437`
- `ig_account_id = 17841401444333135`  (o `META_IG_USER_ID`)
- `ig_media_id   = <id do post escolhido>`

⚠️ Criar o anúncio de **Instagram** exige o app "PEPE" em modo **Live** (bloqueio
atual — erro 1885183). Listar/direcionar funciona já; publicar boost de IG só
com o app publicado. Boost de post da **Página do FB** funciona hoje.

## Erros comuns

- `code 190 ... Session has expired`: o token venceu. Gere outro e rode de novo.
- Token curto do Graph API Explorer dura ~1–2h; token de usuário de longa
  duração ~60 dias; token de **System User** não expira (ideal).
```
