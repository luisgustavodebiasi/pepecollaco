# Guia Operacional — Plataforma de Credenciamento Pepê Collaço

Este é o manual único para colocar a plataforma **no ar** e operá-la no dia do
evento. Siga os passos na ordem. Cada passo diz **onde** fazer e **o que** colar.

> **Status atual (verificado):** o Supabase já está de pé com **15.525 contatos
> importados**, RLS ativo e as RPCs principais funcionando. Falta: aplicar a
> migração de filtros (v3), apontar o webhook do n8n e publicar no GitHub Pages.

---

## 1. Visão geral — como as peças se conectam

```
                         ┌──────────────────────────┐
   Operador no evento →  │  /credenciar/  (app Vite) │
   busca por telefone    │  cadastro + confirmação    │
                         └────────────┬──────────────┘
                                      │ RPC (anon key)
                                      ▼
                         ┌──────────────────────────┐        ┌───────────────┐
                         │        SUPABASE          │        │     n8n       │
                         │  tabela `contatos`        │◄──────►│  (service key)│
                         │  RPCs SECURITY DEFINER    │        │  fluxos Whats │
                         └────────────┬──────────────┘        └──────┬────────┘
                                      │ RPC (anon key)                │ Evolution API
                                      ▼                               ▼
                         ┌──────────────────────────┐        📱 WhatsApp do contato
   Equipe acompanha   →  │   /admin/  (Painel)       │        (boas-vindas + agradecimento)
   KPIs, tabela, mapa    │   leitura + filtros + CSV  │
                         └──────────────────────────┘
```

**Componentes e endereços finais (GitHub Pages → www.pepecollaco.com):**

| Página | Pasta no repo | URL pública | Função |
|---|---|---|---|
| Landing institucional | `index.html` | `https://www.pepecollaco.com/` | Site do deputado |
| **Cadastro (operador)** | `credenciar/` (build) | `…/credenciar/` | Check-in no evento → grava no Supabase |
| **Painel (admin)** | `admin/` | `…/admin/` | KPIs, tabela filtrável, mapa, export CSV |
| Painel estratégico | `painel/` | `…/painel/` | Análise eleitoral (votos/emendas) — estático |
| Cadastro público | `time/` | `…/time/` | Auto-cadastro "Vem com o Pepe" (webhook) |

**Dados de acesso usados nas páginas (chave pública / anon — pode ficar no front):**

```
SUPABASE_URL  = https://rsszyvomwndrmjzoaezt.supabase.co
ANON KEY      = sb_publishable_tTuPIVnYKyIIWfRbTqT3UA_Yqu6koSy
```

> ⚠️ A **service_role key** NUNCA vai para o front. Ela só existe dentro do n8n.

---

## 2. Passo 1 — Banco de dados (Supabase)

Tudo roda no SQL Editor do projeto `rsszyvomwndrmjzoaezt`.

1. Abra **Supabase → SQL Editor → New query**.
2. Cole **todo** o conteúdo de `supabase_schema.sql` e clique em **Run**.
   - Isso cria a tabela `contatos`, o RLS, e as RPCs (`buscar_contato_por_telefone`,
     `confirmar_presenca_evento`, `resumo_evento`, etc.).
   - É **idempotente** (`CREATE OR REPLACE` / `IF NOT EXISTS`): pode rodar de novo
     sem quebrar o que já existe.
3. **Migração v3 (filtros do painel)** — já está no mesmo arquivo, no bloco
   `MIGRAÇÃO v3 — PAINEL com filtros avançados`. Ela cria:
   - `painel_facetas()` → alimenta os menus de filtro (cidades, eventos, partidos, origens).
   - `painel_contatos(...)` → listagem filtrada por busca, cidade, evento, partido,
     origem, status (confirmado/não) e boas-vindas (enviada/pendente).

   Sem essa migração, o painel **ainda funciona** (cai num modo simples de busca),
   mas os filtros ricos ficam desligados.

**Conferir se aplicou (cole no SQL Editor):**

```sql
select count(*) as total from contatos;             -- deve dar 15525 (ou mais)
select * from painel_facetas();                      -- deve retornar um JSON
select nome, cidade from painel_contatos('', '', '', '', '', 'confirmados', '', 5);
```

---

## 3. Passo 2 — Cadastro do operador (`credenciamento/` → `/credenciar/`)

Esta é a app que o operador usa para dar check-in. Já está pronta e gravando no
Supabase. O que falta é (a) apontar o WhatsApp e (b) gerar o build de produção.

1. Edite `credenciamento/.env` (copie de `.env.example` se não existir):

   ```env
   VITE_SUPABASE_URL=https://rsszyvomwndrmjzoaezt.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_tTuPIVnYKyIIWfRbTqT3UA_Yqu6koSy
   VITE_N8N_WEBHOOK_BOAS_VINDAS=https://SEU-N8N/webhook/credenciamento-boas-vindas
   VITE_WEBHOOK_SECRET=          # opcional, ver Passo 4
   VITE_NOME_EVENTO=Encontro Pepê Collaço 2026
   VITE_ACCESS_CODE=senhaDoOperador
   ```

   > Deixe `VITE_N8N_WEBHOOK_BOAS_VINDAS` **vazio** se ainda não tem o n8n: o
   > cadastro no Supabase continua funcionando, só não dispara o WhatsApp.

2. Gere o build:

   ```bash
   cd credenciamento
   npm install        # só na primeira vez
   npm run build
   ```

   O build sai em `../credenciar/` (raiz do repo), com caminhos relativos
   (`base: './'`), então funciona em subpasta do GitHub Pages.

3. **Toda vez que mudar o `.env`, rode `npm run build` de novo** — as variáveis
   `VITE_*` são "assadas" dentro do bundle no momento do build.

**Rodar local para testar:** `cd credenciamento && npm run dev` → http://localhost:5173/

---

## 4. Passo 3 — Painel / Admin (`admin/`)

O `admin/index.html` é um arquivo único (sem build). A configuração fica no topo
do `<script>`, no bloco `CONFIG`:

```js
const CONFIG = {
  SUPABASE_URL: 'https://rsszyvomwndrmjzoaezt.supabase.co',
  SUPABASE_KEY: 'sb_publishable_tTuPIVnYKyIIWfRbTqT3UA_Yqu6koSy',
  ACCESS_CODE:  'senhaDoOperador',   // troque por uma senha forte
}
```

**O que o painel já faz com dados reais do Supabase:**
- KPIs: total de contatos, confirmados, boas-vindas e agradecimentos enviados.
- Lista de confirmados recentes.
- **Aba Contatos com filtros combináveis:** busca (nome/telefone), status
  (confirmados / não), boas-vindas (enviadas / pendentes), cidade, evento,
  partido, origem, limite de linhas (200→2000) e **exportação CSV** do resultado.
- Contador de resultados ao lado dos filtros.

> Os menus de Cidade/Evento/Partido/Origem se preenchem sozinhos a partir de
> `painel_facetas()`. Enquanto o evento não começa, a maioria dos contatos
> importados ainda não tem cidade/cargo preenchidos — esses campos vão se
> populando conforme o operador confirma presença.

> ⚠️ `ACCESS_CODE` é uma trava **client-side** (fraca). Para o painel ficar
> realmente privado, ative Supabase Auth e restrinja a RPC `painel_contatos` a
> `authenticated`. Para o evento, no mínimo **troque a senha** do padrão.

---

## 5. Passo 4 — WhatsApp via n8n + Evolution API

Dois fluxos prontos em JSON na raiz do repo (detalhe completo em `n8n-README.md`):

| Arquivo | Fluxo | Gatilho |
|---|---|---|
| `n8n-flow-evolution-api.json` | **Boas-vindas** | Webhook `POST /webhook/credenciamento-boas-vindas` |
| `n8n-flow-agradecimento.json` | **Agradecimento noturno** | Cron `0 22 * * *` (22h) |

### Importar e configurar

1. n8n → **Workflows → Import from File** → importe os dois `.json`.
2. n8n → **Settings → Variables**, crie:

   | Variável | Valor |
   |---|---|
   | `EVOLUTION_API_HOST` | URL da sua Evolution API (sem `/` no fim) |
   | `EVOLUTION_INSTANCE` | nome da instância conectada ao WhatsApp |
   | `EVOLUTION_API_KEY` | API key da Evolution |
   | `SUPABASE_URL` | `https://rsszyvomwndrmjzoaezt.supabase.co` |
   | `SUPABASE_SERVICE_KEY` | **service_role key** (Supabase → Settings → API) |
   | `NOME_EVENTO` | `Encontro Pepê Collaço 2026` |

3. **Ative** os dois workflows.
4. Copie a URL do webhook do fluxo de boas-vindas (algo como
   `https://SEU-N8N/webhook/credenciamento-boas-vindas`) e cole em
   `VITE_N8N_WEBHOOK_BOAS_VINDAS` no `.env` → rode `npm run build` de novo.

### (Opcional) Proteger o webhook

Se definir `VITE_WEBHOOK_SECRET` no `.env`, o front envia
`Authorization: Bearer <segredo>`. Configure o nó **Webhook** do n8n para validar
esse header e rejeitar quem não tiver. Sem isso, o webhook fica aberto (aceitável
para um evento curto, mas troque a URL depois).

### Como a dinâmica funciona (sequência completa)

**A) No momento do check-in (tempo real):**
1. Operador confirma presença em `/credenciar/`.
2. Front chama a RPC `confirmar_presenca_evento` → grava/atualiza no Supabase
   (`confirmado_evento = true`, `confirmado_em = agora`).
3. Front dispara o webhook de boas-vindas (com timeout de 8s; se falhar, **não
   trava o operador** — o cadastro já está salvo).
4. n8n responde `200` na hora e, em paralelo:
   valida o telefone → monta a mensagem personalizada (nome, cargo, cidade) →
   envia pela Evolution API → marca `boas_vindas_enviada = true` no Supabase.

**B) À noite (22h, automático):**
1. Cron dispara o fluxo de agradecimento.
2. n8n busca no Supabase quem tem `confirmado_evento = true` **e**
   `agradecimento_enviado = false`.
3. Percorre um a um, com **3s de intervalo** (rate limit), envia o agradecimento
   e marca `agradecimento_enviado = true`.
4. O filtro garante **idempotência**: rodar de novo não manda mensagem duplicada.

Para mudar o horário, edite a `expression` do nó *Agendar — 22h Diário* (cron).

---

## 6. Passo 5 — Publicar online (GitHub Pages)

O repositório já tem `CNAME` apontando para **www.pepecollaco.com**.

1. Garanta que o build do cadastro está atualizado (Passo 2): a pasta
   `/credenciar/` deve existir e estar commitada.
2. Commit & push de tudo para a branch que o Pages serve (normalmente `main`):

   ```bash
   git add credenciar/ admin/ painel/ time/ supabase_schema.sql \
           GUIA-OPERACIONAL.md n8n-README.md credenciamento/vite.config.js \
           credenciamento/.env.example
   git commit -m "Plataforma de credenciamento operacional + painel com filtros"
   git push
   ```

   > `credenciamento/.env`, `node_modules/` e os CSVs com dados pessoais estão no
   > `.gitignore` e **não** são versionados — correto.

3. GitHub → repositório → **Settings → Pages** → Source: `Deploy from a branch`
   → Branch `main` / `/ (root)` → Save. Confirme o domínio `www.pepecollaco.com`.
4. Aguarde ~1 min e teste as URLs da tabela do Passo 1.

> **Sobre as variáveis no Pages:** o GitHub Pages é estático e não injeta env
> vars. Por isso o cadastro usa o build (`/credenciar/`) com as variáveis já
> embutidas, e o admin usa o bloco `CONFIG`. Só a **anon key** fica exposta —
> é o esperado e está protegido por RLS + RPCs.

---

## 7. No dia do evento — operação

1. Abra `…/credenciar/` no aparelho do operador, digite o `ACCESS_CODE`.
2. Selecione o evento, digite o **WhatsApp** da pessoa e clique **Consultar**:
   - **Achou** → confira/edite os dados → **Confirmar Presença**.
   - **Não achou** → preenche nome (e o que tiver) → **Salvar e Confirmar**.
3. A pessoa recebe o WhatsApp de boas-vindas em segundos (se o n8n estiver ligado).
4. A equipe acompanha em tempo real por `…/admin/` (KPIs + aba Contatos com filtros).
5. Às 22h, o agradecimento sai sozinho para todos os confirmados do dia.

**Dica:** mais de um operador pode usar `/credenciar/` ao mesmo tempo. O telefone
é único (`telefone_normalizado`), então confirmações simultâneas não duplicam.

---

## 8. Filtros do painel — referência rápida

Na aba **Contatos** do `/admin/`:

| Filtro | O que faz |
|---|---|
| Busca | nome OU telefone (parcial) |
| Status | Confirmados / Não confirmados |
| Boas-vindas | Enviadas / Pendentes |
| Cidade | uma cidade específica (com contagem) |
| Evento | um `nome_evento` específico |
| Partido | um partido específico |
| Origem | `importacao_csv`, `credenciamento_evento`, etc. |
| Linhas | teto de resultados (200 a 2000) |
| Exportar CSV | baixa exatamente o resultado filtrado (UTF-8, `;`) |
| Limpar filtros | zera tudo |

Os filtros são combináveis e processados **no servidor** (RPC `painel_contatos`),
então funcionam bem mesmo com os 15k+ contatos.

---

## 9. Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| Painel mostra "Configure SUPABASE_URL…" | `CONFIG` vazio no `admin/index.html` | preencha URL + anon key |
| Filtros de cidade/evento vazios | migração v3 não aplicada | rode o bloco v3 do `supabase_schema.sql` |
| Cadastro salva mas não chega WhatsApp | webhook vazio ou n8n desligado | preencha `VITE_N8N_WEBHOOK_BOAS_VINDAS` e rebuild; ative o fluxo |
| "Could not find function painel_contatos" no console | v3 não aplicada | o painel cai no modo simples; aplique a v3 p/ filtros |
| Mudei o `.env` e nada mudou | esqueceu o build | `cd credenciamento && npm run build` |
| Telefone "inválido" na busca | faltou DDD | use formato `48 99999-9999` |
| `/credenciar/` 404 no Pages | pasta não commitada | confirme que `credenciar/` foi para o git e push |

---

## 10. Segurança — checklist mínimo antes do evento

- [ ] Trocar `ACCESS_CODE` / `VITE_ACCESS_CODE` do padrão `senhaDoOperador`.
- [ ] `service_role key` **somente** no n8n (nunca no `.env` do front nem no admin).
- [ ] (Recomendado) `VITE_WEBHOOK_SECRET` definido e validado no n8n.
- [ ] (Recomendado p/ pós-evento) Supabase Auth no painel e RPC `painel_contatos`
      restrita a `authenticated`.
- [ ] Confirmar que `.gitignore` está barrando `.env` e os CSVs (já está).

---

### Arquivos de referência

- `supabase_schema.sql` — schema + RPCs + migração v3.
- `n8n-README.md` — detalhe nó-a-nó dos fluxos e exemplos de mensagem.
- `n8n-flow-evolution-api.json` / `n8n-flow-agradecimento.json` — fluxos para importar.
- `credenciamento/` — código-fonte do cadastro (Vite). Build → `credenciar/`.
- `admin/index.html` — painel.
