# Treine seu voto · vote.pepecollaco.com

Uma urna de mentira em que o eleitor digita **11223** até acertar. Não é um
simulador neutro nem uma brincadeira: é peça de campanha, e o produto não é a
urna, é a fixação do número.

Duas regras mandam em tudo o que está aqui, e sempre que uma decisão de código
parecer arbitrária, é uma delas.

**A primeira: é impossível terminar com o número errado.** O dígito errado
aparece em vermelho por seis décimos de segundo e some sem entrar no estado. A
tela diz qual era o próximo, o número reaparece em destaque, e o treino segue
até o acerto. Não existe caminho no aplicativo que leve ao fim com outro número
na tela.

**A segunda: isto nunca pode passar por sistema oficial.** O aparelho na tela é
propositalmente parecido com a urna UE 2020, porque é o reconhecimento imediato
que faz a pessoa entrar no jogo. Isso torna as salvaguardas mais importantes,
não menos:

- a palavra **TREINO** na própria tela do aparelho, no lugar em que a urna de
  verdade escreve TREINAMENTO. É a única ressalva que fica **dentro da área que
  uma captura de tela pega**, e por isso é a que mais importa;
- o rodapé, sempre visível, com a negativa explícita de vínculo;
- a placa moldada do corpo, que no aparelho real traz o brasão da Justiça
  Eleitoral e "UE 2020", traz aqui a **marca da campanha**;
- nenhum brasão, nenhuma tipografia oficial, e as palavras "TSE", "Justiça
  Eleitoral", "urna eletrônica" e "Tribunal" não aparecem em lugar nenhum do
  produto, a não ser na negativa do rodapé.

**Houve uma faixa amarela no topo**, sangrada de ponta a ponta, dizendo
"TREINO DE VOTO · SIMULAÇÃO NÃO OFICIAL". Ela saiu a pedido do gabinete em
05/09/2026, por decisão de peça: competia com o aparelho e tirava dele a tela
inteira. Fica registrado que era a ressalva mais visível das quatro, e que sem
ela o peso passou para a etiqueta TREINO na tela e para o rodapé. Se um dia a
peça for questionada, é a primeira coisa a repor, e repor é remontar o
componente `AvisoTopo` que existia aqui.

---

## Como funciona para quem abre

1. **Rodada 1, o número à vista.** O 11223 está numa pílula amarela em cima das
   caixas. O objetivo é ensinar, não testar às cegas.
2. **Da rodada 2 em diante, de memória.** "Treinar de novo" esconde o número e
   troca o subtítulo, que na rodada 1 traz o número escrito. Quem não lembrar
   tem o botão "não lembro, mostrar o número", e quem errar recebe o número de
   volta sem pedir.
3. **Contadores em memória.** "Você acertou 3x seguidas" conta rodadas sem
   nenhum dígito errado. "Número decorado! 🎉" é mais exigente: conta rodadas
   sem errar **e** sem ver o número. Como a rodada 1 mostra o número por
   definição, o "decorado" aparece pela primeira vez no fim da rodada 4.
4. **Na tela FIM** o aparelho escreve FIM, como o de verdade, e embaixo vêm o
   nome de urna e o número gigante. A área que era do teclado passa a ser da
   campanha: treinar de novo, silenciar a música, compartilhar, salvar lembrete
   no calendário e salvar o número na agenda.

Nada disso é gravado. Sem servidor, sem banco, sem `localStorage`, sem cookie,
sem contagem de voto. Recarregar a página zera tudo, inclusive a sequência.

---

## Trocar de candidato

Um arquivo: `src/config/candidate.ts`. Número, nome, nome de urna, partido,
cargo, cor de destaque, data da eleição, endereço, texto de compartilhamento e
a identificação legal. Nenhum componente escreve nada disso à mão, e os textos
que citam o número são moldes com `{number}`.

Fora do arquivo, só dois ativos: `public/assets/candidate.webp` (a foto, em
retrato) e `public/marca/` (os lockups).

**A identificação legal sai vazia de fábrica**, e o rodapé só mostra a linha
quando ela é preenchida. O valor pronto para colar está em comentário logo
acima do campo: é o mesmo rótulo que a campanha já usa nos anúncios da Meta.

---

## Publicar

Projeto na Vercel: **`vote-pepecollaco`**, na conta `luis-debiasi-s-projects`,
a mesma dos outros subdomínios da campanha. Já está criado e linkado.

```bash
cd treine-seu-voto
npm ci
npm run build          # roda o tsc antes do bundle
vercel deploy --prod
```

O domínio `vote.pepecollaco.com` já está atribuído ao projeto. O que falta é o
registro no DNS da Hostinger, idêntico ao de `jingle` e `time`:

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| CNAME | `vote` | `5dd44f4a1f86dfb9.vercel-dns-017.com` | 3600 |

Esse alvo é o da conta, não do projeto: a Vercel roteia pelo `Host`, então o
mesmo valor serve para todos os subdomínios da campanha. A Vercel emite o
certificado sozinha assim que o registro propagar, e manda e-mail quando
terminar.

**A URL `.vercel.app` de produção fica atrás do login da Vercel**, por causa da
proteção padrão da conta. Isso não vale para o domínio próprio: `jingle` e
`time` respondem 200 para qualquer um, e `vote` vai responder igual assim que o
DNS subir.

O `vercel.json` já traz os cabeçalhos que importam: `index.html` sem cache
(para atualização chegar), bundle e fontes imutáveis por um ano, e a foto e o
som com cache curto, porque não têm hash no nome e precisam poder ser trocados.

O cartão de compartilhamento é desenhado por `ferramentas/gerar-og.py`, que
sai em `public/img/og-treino.jpg`:

```bash
python3 ferramentas/gerar-og.py
```

Ele monta o aparelho com o 11223 aceso na tela, a chamada à esquerda e o
endereço em pílula amarela. O fundo é o `fundo-og-1200.jpg` da identidade, que
já vem com o degradê e a textura de setas no formato exato: toda peça de
compartilhamento leva a textura, porque um retângulo azul liso poderia ser de
qualquer campanha. A metade esquerda recebe um véu de 0,74, que é o que faz o
amarelo passar de 2,66 para 7,7 de contraste sem apagar a textura. A marca é a
**reduzida**, sem o número, porque o 11223 já está grande na tela do aparelho.

**Se trocar o cartão depois de divulgado, troque o nome do arquivo.** WhatsApp
e Facebook guardam a prévia por URL durante semanas e não relêem o mesmo
endereço só porque o conteúdo mudou. Foi por isso que este se chama
`og-treino.jpg` e não `og.jpg`.

---

## O som

Três camadas, e a ordem importa.

| Quando | O quê | Arquivo |
|---|---|---|
| toda tecla | clique curto do teclado | `public/assets/clique.mp3` |
| CONFIRMA | bipe de confirmação | `public/assets/sucesso.mp3` |
| 200 ms depois do bipe | música, subindo do zero em 1,5 s | `public/musica/*.mp3` |

**O clique e o bipe vão como vieram, sem reconversão.** A primeira versão os
passou para mono a 96 kbps, e a mistura dos dois canais somou os picos e
estourou: o clique subiu de 0,806 para 1,000 e ficou distorcido. São 14 KB e
36 KB; não há nada a economizar ali que justifique tocar no arquivo.

**A música nunca repete o mesmo trecho em duas rodadas seguidas.** A rotação
está em `src/config/musica.ts` e anda com a rodada: quatro entradas diferentes
do jingle (38s04, 45s, 53s17, 56s03), depois o pagode e o sertanejo, e então
recomeça. Quem treina quatro vezes ouvindo o mesmo pedaço desiste na terceira.

Os quatro pontos do jingle foram escolhidos de ouvido pelo gabinete. Os do
pagode e do sertanejo saíram de `ferramentas/achar-refrao.py`, que procura a
janela de 12 s com maior energia da faixa, que na prática é o refrão:

```bash
python3 ferramentas/achar-refrao.py         # sugere o segundo de entrada
python3 ferramentas/achar-batida.py         # mede o BPM, se um dia o confete
                                            # for seguir a faixa em vez do relógio
```

### O banner e o confete

Enquanto a faixa toca, a tela FIM mostra um banner com o nome dela, um
equalizador de três barras que pulsa e um anel que abre e fecha no compasso. O
confete não para depois da comemoração: sai uma rajada a cada **meio segundo**,
alternando os cantos, e a cada quatro batidas uma rajada mais alta pelo meio.
É isso que faz a tela continuar viva justamente enquanto a pessoa está lendo o
número.

Posição, ângulo e quantidade são sorteados dentro de faixas estreitas de
propósito: rajada sempre igual, no mesmo lugar, vira padrão e o olho para de ver
em dez segundos.

**O compasso é relógio fixo, não análise do áudio.** Houve um analisador de
espectro aqui, que seguia a batida de verdade. Saiu por dois motivos. O
primeiro é que ele obrigava a música a passar por dentro do Web Audio, e um
contexto suspenso ali não deixa a música baixa: deixa muda. Era o único risco
aberto da peça no iPhone, e sumiu junto com ele. O segundo é que meio segundo é
mais festa que a batida real: as faixas têm 131, 92 e 88 BPM, e num pagode de 88
o confete sairia a cada 0,68 s, devagar demais para o efeito que se quer.

Se um dia valer trocar pelo compasso de cada faixa, os andamentos saem de
`ferramentas/achar-batida.py`. O pulso é escrito direto no DOM, numa custom
property, e nunca em estado do React: seriam sessenta renders por segundo.

O botão **silenciar** fica dentro do banner e alterna: silenciar sem volta seria
porta só de ida para quem tocou por engano. A escolha vale para a sessão e não é
gravada em lugar nenhum.

### Trocar as faixas

```bash
ffmpeg -y -i original.mp3 -c:a libmp3lame -b:a 128k -ar 44100 public/musica/nova.mp3
ffmpeg -y -i clique.wav -ac 1 -c:a libmp3lame -b:a 96k -ar 44100 public/assets/clique.mp3
```

128 kbps estéreo é o ponto em que a faixa de 90 s cabe em 1,5 MB sem soar pior
no alto-falante de um celular. As três somam 5 MB, e só a que vai tocar é
baixada: a primeira entra no primeiro toque em tecla, as outras quando chega a
vez delas.

---

## Conferir

```bash
python3 ferramentas/contraste.py          # prova WCAG dos 18 pares deste app

npm run build && cp ferramentas/aferir.html dist/ && npm run preview
# abra /aferir.html: os quatro tamanhos de tela do briefing, lado a lado
# /aferir.html?e=0.6 muda a escala de exibição
```

---

## Decisões que não são óbvias

**Por que dois motores de áudio.** O clique e o bipe vão por Web Audio, a
música vai por `<audio>`. Não é gosto: quem digita rápido aperta a segunda
tecla antes de o clique da primeira acabar, e com `<audio>` o segundo toque
corta o primeiro ou chega atrasado. Decodificados uma vez, os dois efeitos
custam nada. Já decodificar uma faixa de 90 s em memória passaria de 30 MB, e o
`<audio>` ainda dá busca por tempo, que é justamente o que a rotação precisa.

**Por que a música entra 200 ms depois do bipe, e não junto nem depois.** Junto,
ela abafa a confirmação, que é o som que diz "deu certo". Depois que o bipe
acaba, soa a corte de rádio. Entrando por cima da cauda, com fade de 1,5 s a
partir do zero, os dois viram uma coisa só.

**Por que o dígito errado aparece antes de sumir.** A primeira versão descartava
o dígito sem mostrar, o que é mais limpo no modelo e pior no ensino: quem errou
não vê o que apertou e não aprende nada com a correção. Ele aparece na tela por
600 ms mas nunca entra no estado, então a invariante continua de pé.

**Por que os timers dependem de contador e não de booleano.** `erroId` e
`revelaId` só crescem. Com um booleano `erro`, o segundo erro seguido não
mudaria a dependência do efeito, o `setTimeout` não seria reagendado e o dígito
vermelho ficaria preso na tela até o próximo acerto. Foi o primeiro bug que a
máquina de estado evitou de propósito.

**Por que CORRIGE não revela o número.** A tentação era fazer CORRIGE voltar ao
estado inicial completo, com o número à vista. Isso transformaria o teste de
memória da rodada 2 num botão de cola: erra de propósito, corrige, lê. CORRIGE
apaga os dígitos e preserva a visibilidade que já havia. Quem quiser ver tem o
botão que assume a consulta e zera a sequência cega.

**Por que a tecla é medida em `cqw` e não em `vw`.** Com `12vw`, num monitor
largo a tecla ia para o teto, o teclado engordava, a tela da urna encolhia e o
cartão do candidato saía cortado. A urna tem no máximo 420px de largura, então
quem manda no tamanho da tecla é o painel, não a janela.

**Por que `height: 100%` e não `min(100%, 660px)`.** Dentro do `min()` a
porcentagem ficava indefinida, o termo caía para `auto` e a urna crescia com o
conteúdo até passar por baixo do rodapé no iPhone SE. São duas declarações
separadas de propósito.

**Por que a página é cinza e não azul.** O degradê azul com textura de setas é
o ativo mais reconhecível da identidade, e ficou de fora de propósito: a peça só
funciona se o aparelho parecer um aparelho, e um aparelho cinza sobre fundo azul
de campanha vira ilustração. A campanha aparece em três lugares e nenhum deles é
o fundo: a faixa amarela do topo, o número aceso em amarelo dentro da tela e a
marca na placa do corpo.

**Por que o teclado não usa a fonte da campanha.** O dígito da tecla e o número
digitado na tela saem em `--fonte-urna`, uma grotesca de sistema (Helvetica,
Arial), grande e de peso normal. A Acumin Wide Black é manchete de campanha e
entrega na hora que aquilo é uma peça publicitária; a urna tem letra leve e
larga. A Acumin continua mandando em tudo que é da campanha: o título TREINE SEU
VOTO, a pílula do número de referência e o número gigante da tela FIM. É a
mesma divisão do resto do app: o aparelho parece aparelho, a campanha parece
campanha.

**Por que as teclas têm braile.** As teclas do aparelho de referência são
moldadas com braile: uma célula ao lado do dígito, a palavra inteira embaixo do
rótulo nas de ação. Os pontos aqui são desenhados em CSS, a partir de
`src/lib/braille.ts`, e derivam do próprio rótulo da tecla: trocar o texto de um
botão troca o braile junto, sem ninguém precisar lembrar. São decoração e vão
marcados como tal, porque quem usa leitor de tela é atendido pelo `aria-label`
do botão, não por pontinhos.

**Por que o CONFIRMA é sempre verde.** Na urna de verdade a tecla não muda de
cor enquanto o voto está incompleto, e a peça só é reconhecida se ela também
não mudar. A troca é deliberada e tem contrapartida: a cor deixou de ser o
sinal, e o sinal passou a ser a frase. Quem apertar antes da hora lê "Digite os
5 números primeiro" na tela, e o botão continua marcado com `aria-disabled` para
quem ouve a página. Antes o botão ficava cinza; se um dia isso for reavaliado, é
uma regra em `Teclado.module.css`.

**Por que a marca é imagem, e a reduzida.** A identidade proíbe reconstruir
lockup com CSS. A placa usa a versão **clara**, porque o corpo do aparelho é
claro e a versão escura sumiria ali.

**Por que a foto usa `contain` e não `cover`.** O ativo é um busto recortado em
fundo transparente. Com `cover`, numa caixa 3:4, o corte come o topo da cabeça.
A caixa tem campo claro próprio atrás, senão a camisa branca sumiria no bege.

**Por que a página não rola.** O rodapé com a negativa de vínculo precisa estar
sempre visível, e `position: fixed` no iPhone briga com a barra de endereço que
aparece e some. A casca tem altura de tela e a única região que rola por dentro
é a tela da urna, quando o cartão não cabe.

**Por que não guardamos a sequência entre visitas.** Seria fácil e é tentador:
a pessoa volta amanhã e continua de onde parou. Mas o compromisso é que nada do
treino sobrevive ao recarregamento, e `localStorage` de progresso seria o
primeiro passo para alguém pôr ali o que foi digitado. Fica registrado aqui
para ninguém "melhorar" isso depois.

---

## Limites conhecidos

- **O iPhone não vibra.** O Safari do iOS não implementa `navigator.vibrate`, e
  não há como contornar pela web. Metade do público não sente o retorno tátil;
  por isso o retorno visual da tecla e o do dígito são obrigatórios, não enfeite.
- **O iPhone nem sempre baixa o `.ics` e o `.vcf`.** Dependendo da versão, o
  Safari abre a folha "Abrir com", que oferece Calendário e Contatos, que é o
  desejado; às vezes salva em Arquivos e a pessoa precisa tocar no arquivo. Por
  isso o lembrete continua escrito por extenso logo abaixo dos botões: se nada
  acontecer, a informação está na tela.
- **O som depende do primeiro toque.** A autorização de áudio é comprada na
  primeira tecla. Quem chegar na tela FIM sem nunca tocar numa tecla, o que só
  acontece pelo teclado do computador, não ouve nem o bipe nem a música. O fluxo
  não muda.
- **A música pesa 5 MB no total.** Só a faixa da vez é baixada, e o jingle
  entra logo no primeiro toque em tecla, com folga para carregar antes do
  CONFIRMA. Em rede ruim a música pode entrar alguns segundos atrasada, ou não
  entrar; o resto da peça não depende dela.
- **Sem CONFIRMA cinza, quem enxerga não vê que falta dígito** antes de
  apertar. É consequência aceita de manter a tecla sempre verde como no
  aparelho real; a mensagem na tela cobre o caso, e o `aria-disabled` cobre
  quem usa leitor de tela.
- **A assinatura QUEM FAZ REPRESENTA aparece só na tela FIM.** No estado de
  número completo a tela do aparelho já está cheia (dados do candidato mais o
  bloco de instrução), e a campanha aparece ali pela placa do corpo. Se for para
  ter a assinatura nos dois lugares, o caminho é encurtar o bloco de instrução.
- **A Acumin é fonte comercial da Adobe.** A pendência de licença está
  registrada em `_IDENTIDADE/CLAUDE.md` e vale para este app também.

---

## Verificação já feita

Tudo abaixo foi conferido no navegador, com o build de produção servido por
`npm run preview`.

- **Os quatro tamanhos do briefing**, 375x667, 390x844, 393x852 e 430x932, com o
  aparelho inteiro acima do rodapé e a página sem rolagem, nos três estados:
  tela vazia, número completo com os dados do candidato, e tela FIM.
- **O percurso inteiro:** erro de dígito com tremor, vermelho, descarte e a
  frase "Quase! O próximo é o 1."; o número reaparecendo em destaque; CORRIGE;
  BRANCO com a mensagem e sem registrar nada; CONFIRMA bloqueado dizendo o que
  falta; CONFIRMA válido; tela FIM.
- **O laço de fixação:** rodada 2 nascendo sem o número e com o subtítulo de
  memória, "Você acertou 2x seguidas", "3x seguidas" e "Número decorado! 🎉" no
  fim da rodada 4. CORRIGE sem erro anterior não revela o número.
- **Teclado do computador:** 0 a 9, Backspace apagando tudo, Enter confirmando,
  e a tecla da tela acendendo junto.
- **Foco:** ao entrar na tela FIM o foco vai para o título, e não fica órfão num
  botão que sumiu.
- **`prefers-reduced-motion`:** com a preferência ligada o confete não desenha
  nada e o fluxo continua igual.
- **Privacidade, medida e não presumida:** depois de uma rodada completa,
  `localStorage.length`, `sessionStorage.length` e `document.cookie` estão
  vazios, e todas as requisições de rede são do próprio domínio.
- **`.ics` e `.vcf`:** CRLF em toda linha, dobra em 75 **bytes** com continuação
  por espaço, escape de vírgula e ponto e vírgula, `DTSTART;VALUE=DATE` no dia 4
  e `DTEND` no dia 5. A data é lida como local: `new Date("2026-10-04")` daria
  dia 3 no fuso do Brasil, e era o erro mais provável do app inteiro.
- **Som:** `clique.mp3` e `sucesso.mp3` são buscados e decodificados no primeiro
  toque em tecla; `jingle-pepe.mp3` responde com HTTP 206, que é o que prova que
  a busca por tempo funciona; na quinta rodada o `pagode.mp3` é baixado sozinho,
  que é a rotação trocando de faixa. O botão silenciar alterna nos dois sentidos.
- **Cartão de contato:** o `.vcf` sai com `TEL;TYPE=CELL,VOICE:+5548999412599`,
  o WhatsApp do gabinete, além do número de urna em ORG e NOTE. É o telefone que
  faz o cartão valer a pena guardar depois da eleição.
- **Contraste:** `ferramentas/contraste.py` passa em todos os dezessete pares.
- **Console limpo**, sem erro nem aviso.

**Falta testar em aparelho de verdade**, o que este ambiente não permite. Antes
de divulgar, confirme num iPhone e num Android: som saindo depois do primeiro
toque, vibração no Android, o `.ics` abrindo no Calendário, o `.vcf` abrindo a
folha de novo contato, o botão do WhatsApp abrindo o aplicativo instalado, a
folha nativa de compartilhamento, e a área segura no aparelho com ilha dinâmica.

A música já **não** passa mais por dentro do Web Audio: o `<audio>` toca direto,
como qualquer player. Era esse o risco que sobrava no iPhone, e ele saiu junto
com o analisador de batida.
