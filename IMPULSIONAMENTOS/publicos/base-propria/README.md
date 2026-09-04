# Base própria como Público Personalizado — Meta Ads

Extração da tabela `contatos` do sistema do Time PP, formatada para subir como
**lista de clientes** na conta `1700449990528437`.

Gerar ou atualizar:

```bash
cd PEPECOPY/credenciamento-next
npm run publico:meta
```

Os números de cada extração ficam em [`RELATORIO.md`](RELATORIO.md), regravado
a cada execução.

---

## Por que isto é maior do que parece

O público próprio que já existe na conta, `cadastro ok fone.csv`, tem **1.100 a
1.300 pessoas**. Esta extração tem **16.814** — cerca de treze vezes mais. Além
do remarketing direto, é uma semente de lookalike muito melhor: a Meta trabalha
com mais sinal e a semelhança fica mais precisa.

---

## Como subir

1. Gerenciador de Anúncios → **Públicos** → Criar público → **Público
   personalizado** → **Lista de clientes**
2. Enviar `publico-meta-completo.csv`
3. O mapeamento de colunas vem automático — os nomes já são os que a Meta
   espera (`phone`, `fn`, `ln`, `ct`, `st`, `country`, `extern_id`)
4. Aceitar os **Termos de Serviço de Públicos Personalizados** (uma vez por
   conta de anúncio)
5. Nomear com a data da extração, ex.: `Base própria — 07/08/2026`

O arquivo está em **texto puro**, e é assim que deve ser: ao enviar pelo
Gerenciador, o **navegador aplica SHA-256 antes de transmitir**. Nada em claro
sai da máquina. Hash manual só é necessário pela API — e aí tem de ser
calculado sobre o valor já normalizado, com as mesmas regras deste arquivo.

---

## As colunas

| Coluna | O que é | Regra da Meta aplicada |
|---|---|---|
| `phone` | Telefone | Só dígitos, com o `55` na frente. Sem `+`, sem espaço, sem traço |
| `fn` | Primeiro nome | Minúsculas, sem pontuação. Acento preservado (UTF-8) |
| `ln` | Sobrenome | Idem. Composto inteiro (`da silva`, não só `silva`) |
| `ct` | Cidade | Minúsculas, sem acento, sem espaço (`bracodonorte`) |
| `st` | Estado | `sc` |
| `country` | País | `br` |
| `extern_id` | Id do contato no sistema | Permite reconciliar depois e evitar duplicidade entre envios |

**A normalização é o que decide a taxa de correspondência.** A Meta compara
depois de aplicar as regras dela: um telefone com `+` ou uma cidade com espaço
simplesmente não casa, e a pessoa some do público sem nenhum aviso. Por isso o
telefone reaproveita a mesma validação do credenciamento (DDD brasileiro
conferido) e a cidade sai da mesma cadeia usada em `/grupos`.

`st` e `country` só são preenchidos quando há cidade. Afirmar "sc" para quem
não tem cidade conhecida seria inventar dado — e dado inventado derruba a
correspondência em vez de ajudar.

---

## O que esperar da correspondência

O telefone é o único identificador que a base tem para todo mundo: **não existe
coluna de e-mail em `contatos`**. Só 9% têm cidade (a base veio de uma
importação de WhatsApp sem esse campo), então na prática a maioria das linhas
casa por telefone e nome.

Duas consequências práticas:

- A taxa de correspondência de listas só com telefone costuma ficar bem abaixo
  de 100%. Um público final menor que 16.814 é o normal, não um erro.
- **Melhorar a cobertura de cidade melhora o público.** A tela
  `/admin/grupos` existe justamente para isso: cada leva de contatos que recebe
  município melhora ao mesmo tempo os grupos de WhatsApp e a segmentação
  geográfica daqui.

---

## Os recortes

- `publico-meta-completo.csv` — público principal e semente do lookalike
- `por-regiao/` — uma lista por região, para campanha geossegmentada
- `por-cidade/` — só municípios com 20 contatos ou mais

Cidades pequenas não geram arquivo de propósito: nesse volume, um público
separado não paga o custo de gestão e ainda fica abaixo do mínimo de entrega da
Meta. Para uma cidade específica fora da lista, baixe o recorte da região e
filtre pela coluna `ct`.

---

## Antes de rodar a campanha

Três coisas que não dependem do arquivo e travam a entrega se ficarem para
depois:

- **Autorização de anúncios sobre política.** Anúncio de conteúdo eleitoral ou
  de tema social exige identidade verificada e o selo "Pago por" na conta. Sem
  isso o anúncio é reprovado, ou removido depois de publicado.
- **Categoria especial de anúncio.** A campanha precisa ser marcada como
  `ISSUES_ELECTIONS_POLITICS` — o módulo de impulsionamentos do painel já usa
  essa categoria por padrão.
- **Calendário eleitoral.** Propaganda eleitoral paga tem data de início
  definida em lei, e é anterior a ela que a maioria dos problemas acontece.
  Confirme a data com a assessoria jurídica antes de ativar entrega.

## Sobre os arquivos

São **dados pessoais de 16.814 pessoas**. Ficam fora do repositório de código
de propósito (esta pasta não é versionada). Não subir para drive compartilhado
nem mandar por WhatsApp; regerar com `npm run publico:meta` é mais rápido do
que procurar uma cópia antiga, e uma cópia a menos circulando é uma
preocupação a menos.
