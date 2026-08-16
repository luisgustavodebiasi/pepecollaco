# Identidade visual — Pepê Collaço 11223 (campanha 2026)

Este é o documento normativo da identidade. Se um app, uma peça ou um agente
precisar decidir cor, fonte, logo ou fundo, a resposta está aqui. Onde este
documento e o código divergirem, **este documento está certo e o código está
desatualizado**.

Versão 1.0.0 · fonte-verdade em `_IDENTIDADE/` · originais da agência em `_ARTE /`

---

## O que mudou, e por quê

A marca **TIME PEPÊ** foi aposentada. Ela nasceu na pré-campanha, quando pedir
voto era proibido e a metáfora esportiva ("convocação", "seleção", "jogadores")
servia para mobilizar sem infringir a lei eleitoral.

Em **15/08/2026** a candidatura foi registrada e o número de urna confirmado.
A partir de **16/08/2026** o pedido explícito de voto está liberado. A identidade
nova existe para isso: ela carrega o número **11223** em toda peça, e é assinada
como **VOTE PEPÊ** ou **PEPÊ COLLAÇO**, nunca mais como "Time".

Consequência prática: nenhuma superfície nova deve dizer "Time Pepê". A única
exceção está registrada em [Legado que não se toca](#legado-que-não-se-toca).

---

## As duas marcas

Existem duas, com usos distintos. Não são intercambiáveis.

### VOTE PEPÊ — a marca de pedido de voto

```
VOTE
PEPÊ
DEPUTADO ESTADUAL
11223
```

Use quando a peça pede voto: santinho, adesivo, banner de rua, anúncio pago,
chamada de campanha, rodapé de peça eleitoral. É a marca mais direta.

`marca/vote-11223-claro-*` (fundo claro) · `marca/vote-11223-escuro-*` (fundo escuro)

### PEPÊ COLLAÇO — a marca institucional

```
DEPUTADO ESTADUAL
PEPÊ
COLLAÇO
11223
```

Use quando a peça apresenta a pessoa: site institucional, prestação de contas,
material de mandato, apresentação, assinatura de documento. O cargo vem antes do
nome, e o sobrenome aparece — é a marca que se apresenta em vez de pedir.

`marca/collaco-11223-claro-*` · `marca/collaco-11223-escuro-*`

### A marca reduzida

`marca/reduzida-escuro-*` é o VOTE PEPÊ sem o número, para quando o 11223 já
aparece em destaque na mesma peça e repetir seria ruído. Use com parcimônia:
**em peça eleitoral o número é obrigatório em algum lugar visível.**

### Regras que valem para as duas

- **A marca é sempre imagem.** Nunca reconstrua o lockup com texto e CSS. A fonte
  original é Acumin Variable Concept nos pesos Black e Light, que não temos; uma
  reconstrução sai errada e o `11223` é justamente o que não pode sair errado.
- **Proporção travada.** Os lockups com número são ≈1,09 (quase quadrados); a
  reduzida é ≈1,48. Nunca distorça — sempre `object-fit: contain` ou largura livre
  com altura automática.
- **Versão certa para o fundo certo.** A versão "claro" tem o `PEPÊ` em navy e só
  funciona sobre fundo claro; a "escuro" tem o `PEPÊ` em branco e some no claro.
- **Respiro mínimo:** a altura da palavra `VOTE` em volta de todo o lockup.
- **Nunca** aplique sombra, contorno, rotação, recorte parcial ou recolorização.

---

## O símbolo

A seta é uma fita em chevron vista em perspectiva: face externa amarelo-laranja,
avesso navy virando verde. Ela é três coisas ao mesmo tempo:

1. o acento circunflexo do `Ê` dentro do lockup — por isso nunca aparece "PEPE" sem acento;
2. o ícone da marca (favicon, avatar, marcador);
3. o módulo da textura de fundo.

| Arquivo | Uso |
|---|---|
| `simbolo/seta-{128,256,512}.{webp,png}` | símbolo colorido; é ilustração 3D com degradê, por isso raster |
| `simbolo/seta-atual.svg` | vetor mono em `currentColor` — ícone inline, bullet, marcador |
| `simbolo/seta-{branca,tinta,amarela}.svg` | vetor mono com cor fixa |
| `simbolo/favicon-512.png`, `apple-touch-icon.png`, `favicon-32.png` | ícones de aplicativo |

A seta **aponta sempre para cima**. Não gire para virar "próximo", "voltar" ou
seta de menu: para isso use um ícone comum de interface. Girar a marca a
descaracteriza.

---

## Cores

Todos os valores foram medidos por amostragem de pixel nos arquivos da agência.
Não invente tons novos; se faltar um, derive com `color-mix()` a partir destes.

### Azuis — a espinha dorsal

| Token | Hex | Papel |
|---|---|---|
| `--pp-azul-foco` | `#0082BF` | o ponto mais claro do fundo, canto superior esquerdo |
| `--pp-azul-medio` | `#006A9E` | corpo do degradê |
| `--pp-azul-profundo` | `#0A5480` | transição |
| `--pp-navy` | `#123F68` | transição |
| `--pp-navy-escuro` | `#12314F` | superfície elevada |
| `--pp-abismo` | `#0E1E46` | fundo base, canto inferior direito do degradê |
| `--pp-tinta` | `#061A3A` | o navy da marca; texto escuro do sistema |
| `--pp-azul-marca` | `#23638D` | início do degradê do `PEPÊ` sobre fundo claro |
| `--pp-azul-claro` | `#8BC1DC` | texto secundário sobre fundo escuro |
| `--pp-vote` | `#233F64` | a palavra `VOTE` no lockup |

### Amarelo e laranja — ação e número

| Token | Hex | Papel |
|---|---|---|
| `--pp-amarelo` | `#FFC400` | acento, botão primário, link |
| `--pp-amarelo-num` | `#FDC51E` | início do degradê do `11223` |
| `--pp-laranja` | `#FAAA40` | fim do degradê do `11223` |
| `--pp-laranja-quente` | `#FF9C33` | face do símbolo |

### Verdes — institucional

| Token | Hex | Papel |
|---|---|---|
| `--pp-verde` | `#00B171` | confirmação, sucesso, o `COLLAÇO` |
| `--pp-verde-claro` | `#8ACD88` | início do degradê do `COLLAÇO` |
| `--pp-verde-legenda` | `#54AE74` | `DEPUTADO ESTADUAL` na marca VOTE |
| `--pp-petroleo` | `#01374B` | `DEPUTADO ESTADUAL` na marca institucional |

### Uma cor que não vem da arte

`--pp-alerta` `#E5484D` não existe no material da agência. Foi declarada aqui para
que erro e ação destrutiva tenham **uma** cor em todo o sistema, em vez de cada
app inventar a sua. Use só para isso.

---

## Contraste — as regras inegociáveis

Razões calculadas em WCAG 2.1. Isto não é recomendação de estilo: é o que decide
se o eleitor consegue ler a peça no celular, no sol.

| texto ↓ / fundo → | `#0082BF` | `#006A9E` | `#0A5480` | `#123F68` | `#12314F` | `#0E1E46` | `#061A3A` |
|---|---|---|---|---|---|---|---|
| branco | 4,25 ▲ | 5,91 ✓ | 8,10 ✓ | 10,84 ✓ | 13,31 ✓ | 16,24 ✓ | 17,26 ✓ |
| `#FFC400` amarelo | **2,66 ✗** | 3,70 ▲ | 5,07 ✓ | 6,79 ✓ | 8,33 ✓ | 10,17 ✓ | 10,81 ✓ |
| `#8BC1DC` azul claro | 2,18 ✗ | 3,03 ▲ | 4,15 ▲ | 5,56 ✓ | 6,82 ✓ | 8,32 ✓ | 8,84 ✓ |
| `#FAAA40` laranja | 2,20 ✗ | 3,06 ▲ | 4,20 ▲ | 5,62 ✓ | 6,90 ✓ | 8,42 ✓ | 8,95 ✓ |
| `#00B171` verde | 1,52 ✗ | 2,12 ✗ | 2,90 ✗ | 3,89 ▲ | 4,77 ✓ | 5,82 ✓ | 6,19 ✓ |

✓ passa em corpo de texto (≥4,5) · ▲ só em texto grande, ≥24px ou ≥18,7px em negrito (≥3,0) · ✗ reprova

1. **Amarelo não vive no claro do degradê.** Sobre `#0082BF` dá 2,66 e reprova até
   em título. Como o degradê de fundo começa justamente em `#0082BF` no canto
   superior esquerdo, **texto amarelo não pode ficar ali**. Ou desce para a parte
   escura, ou ganha véu.
2. **Branco pequeno também não.** Sobre `#0082BF` dá 4,25 e só passa em corpo grande.
3. **Verde nunca é cor de texto.** Reprova em quase todo o sistema. É preenchimento:
   barra, ícone, o `COLLAÇO` do lockup. E se comunicar estado, sempre com rótulo
   escrito junto — cor sozinha exclui quem não distingue verde e vermelho.
4. **Botão primário é amarelo `#FFC400` com texto `#061A3A`** — 10,81, o melhor par
   do sistema. É o CTA canônico; não invente outro.
5. **Texto sobre o degradê pede véu.** Use `--veu-conteudo` entre o fundo e o texto.

---

## Fundo

O fundo é o ativo mais reconhecível da identidade, e é **CSS, não imagem**.

```css
background: var(--grad-fundo);
```

Um degradê radial com foco no topo deslocado à esquerda (18%, 0%), saindo de
`#0082BF` e caindo até `#0E1E46` no canto inferior direito. Os stops reproduzem o
perfil medido em `FUNDO.png`.

Por cima vem a textura de setas, sempre discreta, aplicada como **máscara**:

```css
.fundo-campanha { position: relative; background: var(--grad-fundo); }
.fundo-campanha::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-color: #fff;              /* é isto que colore a textura */
  -webkit-mask-image: var(--textura-setas);
          mask-image: var(--textura-setas);
  -webkit-mask-size: var(--textura-tamanho);
          mask-size: var(--textura-tamanho);
  opacity: var(--textura-opacidade);   /* 0,07 */
}
```

**Não use `background-image` aqui.** Um SVG carregado por `url()` renderiza num
contexto isolado: ele não enxerga a cor da página, `currentColor` cai para preto,
e uma textura preta a 7% sobre o azul escuro fica invisível. Com máscara, a cor
vem do `background-color` e o mesmo arquivo serve fundo claro e escuro.

Existe `fundo/fundo-1920.webp` para onde CSS não chega: imagem de compartilhamento
e e-mail. Não use no site — são 13 KB desnecessários sobre um degradê que o
navegador desenha de graça, e que fica nítido em qualquer tela.

A textura é assinatura, não papel de parede. Acima de 0,10 de opacidade ela começa
a competir com o conteúdo e a poluir a leitura.

---

## Tipografia

**Acumin Pro**, self-hosted, subsetada para latim. Quatro arquivos, ~19 KB cada.

```css
font-family: var(--fonte);   /* "Acumin Pro", ui-sans-serif, system-ui, … */
```

**Só existem os pesos 400 e 700**, com itálicos. Não peça 900: o navegador
sintetiza um negrito falso, borrado, e o resultado envergonha a marca ao lado do
material impresso. Onde a arte parece "mais pesada que 700", ela é imagem —
porque é mesmo.

Hierarquia sem pesos extras: tamanho, caixa alta e `letter-spacing`. O próprio
lockup faz isso — o `DEPUTADO ESTADUAL` é pequeno com tracking largo, e lê como
legenda sem precisar de um peso próprio.

> **Licença:** Acumin Pro é fonte comercial da Adobe. A licença desktop padrão
> não cobre self-host de webfont em site público. Confirme antes de publicar. Se
> não estiver coberta, o substituto identificado é **Archivo** (Google Fonts), que
> tem eixo de largura e chega perto; nesse caso, troque só `--fonte`.

---

## Nomenclatura

| Escreva | Não escreva |
|---|---|
| Pepê Collaço 11223 | Time Pepê |
| Apoiadores | Jogadores, seleção, elenco |
| Quem faz representa | Tá todo mundo convocado |
| Vote Pepê 11223 | Vote no Pepê |

"Quem faz representa" é a assinatura da Federação União Progressista e já está no
material impresso (`marca/federacao-uniao-progressista-*`). É a frase que substitui
o mote esportivo.

`PEPÊ` leva acento circunflexo, sempre — e no lockup esse acento é a seta.

---

## Legado que não se toca

`credenciamento-next/lib/grupos/csv.ts` grava o rótulo `"Time Pepê"` dentro dos
vCards exportados, e `app/grupos/[cidade]/contatos.vcf/route.ts` faz o mesmo.

**Não mude.** Esses contatos já foram importados na agenda de milhares de
apoiadores, onde o rótulo virou nome de grupo no iPhone. Trocar a string não
renomeia o grupo de ninguém: cria um segundo grupo, órfão, com os mesmos contatos
duplicados. É identificador de dado, não identidade visual.

A string vive isolada em `lib/grupos/constantes.ts` como `ROTULO_AGENDA_LEGADO`,
comentada, justamente para ninguém "terminar o rebrand" por engano.

---

## Arquivos

Tudo em `_IDENTIDADE/dist/`, gerado por `bin/gerar-assets.sh` a partir de `_ARTE /`.
Os originais (PNG de 8000 px, `.ai`, `.psd`) **não entram em repositório**.

```
marca/     vote-11223-{claro,escuro}-{480,960,1600}.{webp,png}
           collaco-11223-{claro,escuro}-{480,960,1600}.{webp,png}
           reduzida-escuro-*  ·  federacao-uniao-progressista-*
simbolo/   seta-{128,256,512}.{webp,png}   coloridos
           seta-{atual,branca,tinta,amarela}.svg   mono
           favicon-512.png · apple-touch-icon.png · favicon-32.png
textura/   setas-tile.svg
foto/      pepe-{900,1400,2000}.webp · pepe-2400.png
fundo/     fundo-1920.webp
fontes/    acumin-{400,400i,700,700i}.{woff2,otf}
css/       tokens.css · tipografia.css · compat/*.css
```

O `.otf` das fontes existe por um motivo específico: as open-graph images do app
de credenciamento são renderizadas por Satori, que **não lê woff2**. Sem o `.otf`
as OG saem com fonte de fallback.

### Regenerar

```bash
cd _IDENTIDADE && ./bin/gerar-assets.sh     # lê _ARTE /, reconstrói dist/
./bin/sincronizar.sh all                     # copia dist/ para os três apps
```

### Retrato

`foto/pepe-*` sai de `FOTO PEPE.png`: retrato oficial recortado, camisa branca,
braços cruzados. É o hero natural sobre o fundo azul.

Existe um `FOTO PEPE_azul (NÃO USAR).png` na pasta da arte. O nome é a instrução.
O pipeline aborta se alguém apontar para ele.

---

## Aplicação nos três apps

Os três são repositórios git independentes; não há monorepo e não dá para importar
entre eles. `_IDENTIDADE/` é a bancada, e `sincronizar.sh` copia os derivados para
cada `public/`. Cada app recebe um `brand/MANIFESTO.json` com os hashes, e
`verificar.sh` acusa se alguém editou um token direto no app.

| App | Caminho | Como consome |
|---|---|---|
| Site | `pepecollaco-site/` | HTML estático; `tokens.css` no `<head>`, sub-áreas com `compat/*.css` |
| Credenciamento | `PEPECOPY/credenciamento-next/` | Tailwind v4: `@theme inline` referenciando os tokens |
| Gerador de materiais | `gerador-materiais/` | Tailwind v4 + `CORES_PADRAO` em `lib/brand.ts` |

**Impressão é CMYK.** Os hex aqui são referência de tela. A conversão desloca os
tons, e o `#FFC400` é o mais sensível. Peça os valores CMYK à agência ou tire prova
antes de mandar tiragem.
