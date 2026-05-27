# Configuração dos Fluxos n8n

## Arquivos

| Arquivo | Fluxo |
|---|---|
| `n8n-flow-evolution-api.json` | **Boas-vindas** — disparado pelo webhook quando presença é confirmada |
| `n8n-flow-agradecimento.json` | **Agradecimento Noturno** — agendado para 22h, busca confirmados no Supabase e envia mensagem |

## Como importar no n8n

1. Acesse seu n8n → **Workflows → Import from file**
2. Importe cada arquivo `.json` separadamente
3. Configure as variáveis de ambiente (ver abaixo)
4. Ative os dois fluxos

---

## Variáveis de ambiente do n8n

Configure em **Settings → Variables** no n8n:

### Evolution API

| Variável | Descrição | Exemplo |
|---|---|---|
| `EVOLUTION_API_HOST` | URL base da Evolution API (sem `/` no final) | `https://evolution.seudominio.com` |
| `EVOLUTION_INSTANCE` | Nome da instância conectada ao WhatsApp | `pepe-principal` |
| `EVOLUTION_API_KEY` | API key da Evolution API | `ABC123...` |

### Supabase

| Variável | Descrição | Exemplo |
|---|---|---|
| `SUPABASE_URL` | URL do projeto Supabase (sem `/` no final) | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | **Service Role Key** (nunca exposta no frontend) | `eyJhbGci...` |

> A `SUPABASE_SERVICE_KEY` é usada apenas nos fluxos n8n para marcar `boas_vindas_enviada` e `agradecimento_enviado`. O frontend usa apenas a `anon key`.

### Evento

| Variável | Descrição | Exemplo |
|---|---|---|
| `NOME_EVENTO` | Nome do evento exibido na mensagem | `Encontro Pepê Collaço 2026` |

---

## Fluxo 1 — Boas-vindas (Webhook)

**Endpoint:** `POST /webhook/credenciamento-boas-vindas`

**Payload esperado** (enviado pelo frontend automaticamente ao confirmar presença):

```json
{
  "tipo": "boas_vindas",
  "evento": "Encontro Pepê Collaço 2026",
  "status_contato": "novo",
  "telefone_normalizado": "5548999999999",
  "telefone_original": "(48) 99999-9999",
  "nome": "Nome da Pessoa",
  "cargo": "Prefeito",
  "cidade": "Florianópolis",
  "partido": "PSD",
  "observacoes": "",
  "confirmado_evento": true,
  "confirmado_em": "2026-05-27T20:00:00.000Z",
  "origem": "credenciamento_evento"
}
```

**O que faz:**
1. Responde `200 OK` imediatamente ao frontend
2. Valida `telefone_normalizado` (mínimo 12 dígitos numéricos)
3. Monta mensagem de boas-vindas personalizada com nome, cargo e cidade
4. Envia via Evolution API
5. Marca `boas_vindas_enviada = true` e `boas_vindas_enviada_em` no Supabase
6. Se dados inválidos: loga e encerra sem erro visível ao operador

---

## Fluxo 2 — Agradecimento Noturno (Agendado)

**Gatilho:** Cron `0 22 * * *` (todo dia às 22h)

**O que faz:**
1. Busca no Supabase todos os contatos com `confirmado_evento = true` E `agradecimento_enviado = false`
2. Processa um contato por vez (rate limit: 3 segundos entre envios)
3. Envia mensagem de agradecimento personalizada via Evolution API
4. Atualiza `agradecimento_enviado = true` e `agradecimento_enviado_em` no Supabase
5. Nunca envia duplicado (filtro `agradecimento_enviado = false` garante idempotência)

**Para alterar o horário:** edite o campo `expression` no nó `🕙 Agendar — 22h Diário` usando notação cron.

---

## Mensagens geradas

### Boas-vindas (exemplo)
```
Olá, *Maria*! 👋

Sua presença no *Encontro Pepê Collaço 2026* foi confirmada! 🎉

Ficamos muito felizes em tê-la conosco hoje.

💼 Prefeita
📍 Florianópolis – PSD

Bem-vinda! 🤝

_Equipe Pepê Collaço_
```

### Agradecimento (exemplo)
```
Olá, *Maria*! 👋

Obrigado por participar do *Encontro Pepê Collaço 2026*! 🙏

Foi um prazer ter sua presença hoje. Esperamos que tenha sido um dia muito produtivo!

Contamos com você nas próximas iniciativas. Até breve! 👊

_Equipe Pepê Collaço_
```

---

## Variáveis do frontend (credenciamento/.env)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_N8N_WEBHOOK_BOAS_VINDAS=https://n8n.seudominio.com/webhook/credenciamento-boas-vindas
VITE_NOME_EVENTO=Encontro Pepê Collaço 2026
```
