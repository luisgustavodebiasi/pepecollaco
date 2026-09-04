# Player de jingles · jingle.pepecollaco.com

Player dos três jingles da campanha, feito para tocar em **carreata e evento**.
Site estático: HTML, CSS e JavaScript, sem framework e sem build.

O requisito que manda em todo o resto é **tocar sem internet**. Carreata é o pior
cenário de rede que existe: o comboio sai da cidade, o sinal cai, e o som não
pode parar junto.

---

## Como se usa numa carreata

1. **Em casa, no wi-fi**, abra `jingle.pepecollaco.com` e espere o selo do canto
   superior direito ficar verde, escrito **"pronto sem internet"**. É o momento
   em que as três faixas terminaram de baixar (7,8 MB).
2. **Instale na tela de início**: no Android, menu do Chrome, "Instalar
   aplicativo"; no iPhone, botão de compartilhar, "Adicionar à Tela de Início".
   Vira ícone, abre sem barra de navegador e não depende de achar o link depois.
3. **Na rua**, abra e toque em tocar. Não precisa de sinal.

Botões grandes de propósito: quem opera está num carro em movimento.

### O que deixa a operação mais tranquila

- **"Manter a tela ligada"** segura a tela acesa enquanto toca. O som continua com
  a tela apagada de qualquer forma, mas apagada atrapalha quem precisa trocar de
  faixa.
- **Controles na tela de bloqueio e no painel do carro.** O player publica título
  e capa via MediaSession, então dá para pausar e pular pelo Bluetooth do carro
  sem desbloquear o telefone.
- **Se cair uma ligação**, o som para e volta sozinho quando a ligação encerra.
- **Se uma faixa falhar**, o player pula para a próxima em vez de travar.

### Modos

| Modo | O que faz |
|---|---|
| Playlist | toca as três em ciclo, sem fim |
| Repetir uma | fica só na faixa atual, sem fim |
| Aleatório | sorteia a ordem, sem repetir a mesma em seguida |

Volume, modo e última faixa ficam gravados no aparelho.

---

## Publicar

É estático: sobe em qualquer lugar. Na Vercel:

```bash
cd jingle-player
vercel deploy --prod
```

Depois aponte `jingle.pepecollaco.com` para o projeto no painel da Vercel e
acrescente o registro na Hostinger, igual aos outros subdomínios da campanha.

O `vercel.json` já traz os cabeçalhos que importam: `sw.js` e `index.html` sem
cache (para atualização chegar), áudio e fontes com cache longo e imutável.

### Ao publicar uma versão nova

**Suba a constante `VERSAO` no topo do `sw.js`.** É ela que aposenta o cache
antigo. Sem isso o aparelho de quem já abriu continua com a versão velha, porque
o service worker serve do cache primeiro, de propósito: é o que faz o app abrir
sem rede.

---

## Trocar ou acrescentar faixas

1. Converta o WAV para MP3 (não suba WAV: são 20 MB por faixa):
   ```bash
   ffmpeg -i faixa.wav -codec:a libmp3lame -b:a 192k -ar 48000 audio/nome.mp3
   ```
2. Gere a capa em 800 px (tela) e 512 px (painel do carro):
   ```bash
   magick capa.jpg -resize 800x800 -quality 86 img/capa-04.webp
   magick capa.jpg -resize 512x512 -quality 88 img/capa-04-512.jpg
   ```
3. Acrescente a entrada na lista `FAIXAS`, no topo do `app.js`. O campo `bpm`
   **não é enfeite**: é ele que sincroniza a animação. Meça o andamento real.
4. Acrescente os arquivos novos à lista `CASCA` do `sw.js` e suba a `VERSAO`.

---

## Trocar o cartão de compartilhamento

O cartão (1200x630) é gerado por `og/gerar-og.py`, que embute os assets em base64,
rasteriza no Chrome headless e converte para JPEG, a mesma receita das capas.

```bash
python3 og/gerar-og.py     # escreve img/og.jpg
```

**Se o cartão mudar depois de já ter sido divulgado, troque o nome do arquivo.**
WhatsApp e Facebook guardam a prévia por URL durante semanas e não relêem o
arquivo só porque o conteúdo mudou. Sobrescrever `img/og.jpg` deixa a prévia
velha rodando nos grupos. Salve como `og-2.jpg` e atualize `og:image`,
`og:image:secure_url` e `twitter:image` no `index.html`.

O cartão **não entra** na lista `CASCA` do service worker de propósito: quem
busca é robô de rede social, não o app, e cachear gastaria 98 KB do telefone do
apoiador à toa.

---

## Decisões que não são óbvias

**Por que site separado, e não uma rota no `credenciamento-next`.** Os outros
subdomínios (santinho, euapoio, parceria) são rotas daquele app, roteadas por
host no `proxy.ts`. Aqui a exceção é deliberada: o app precisa pré-carregar tudo
num service worker, e num app Next isso significaria versionar no cache os
pedaços de `/_next/static/` com hash que mudam a cada publicação. É exatamente o
tipo de coisa que quebra o offline em silêncio, e o offline é o produto. Um site
estático de 26 arquivos é auditável inteiro. Se um dia migrar para dentro do
Next, registre o service worker **só** quando o host for o do jingle, senão ele
passa a valer para o site todo.

**Por que a animação não analisa o áudio.** Um visualizador de verdade pede Web
Audio, e pendurar o `<audio>` num `AudioContext` é o que arrisca a reprodução
parar com a tela bloqueada. Como o andamento das três faixas é conhecido e fixo
(88, 92 e 128 bpm), a animação é dirigida pelo relógio da própria faixa. Fica
sincronizada com a batida sem encostar no caminho do som.

**Por que MP3 e não o WAV entregue.** A regra de "não converter para MP3" da
pasta `ENTREGA-DISTRIBUIDORA` vale para o envio à distribuidora, onde o WAV é
exigido. Aqui são 60 MB contra 7,8 MB, num app cujo propósito é caber no
telefone antes de o sinal acabar. A conversão foi conferida: duração idêntica ao
milésimo e volume dentro de 0,2 LUFS do original.

**O aviso de IA aparece no rodapé** porque a peça é propaganda eleitoral com
conteúdo sintético (Res. TSE 23.732/2024), igual às capas.

---

## Limites conhecidos

- **No iPhone o controle de volume não aparece**, porque o iOS não deixa o site
  mexer no volume: manda o botão físico. O player detecta e esconde o controle
  em vez de mostrar algo que não funciona.
- **A faixa 1 termina em corte seco** (o WAV original é cortado no meio do som).
  Em looping isso estalaria, então o player aplica um fade de 0,22 s no fim e
  0,10 s no início. É efeito de reprodução: o MP3 continua fiel ao WAV. No
  iPhone, onde o volume é travado, o fade não acontece e o corte fica audível.
- **A lista de faixas some no modo paisagem** em telas baixas, para os controles
  caberem. Trocar de faixa continua pelos botões.

---

## Verificação já feita

- Os três MP3 decodificam pelo service worker com duração exata do WAV
  (109,88 / 109,20 / 90,92 s), estéreo, 48 kHz.
- O service worker responde a pedido de faixa de bytes com `206` correto, que é o
  que o Safari exige para tocar áudio vindo do cache.
- Ciclo da playlist, `loop` no modo "Repetir uma", seleção pela lista e gravação
  de preferências, todos conferidos no navegador.

**Falta testar em aparelho de verdade**, o que este ambiente não permitiu: a aba
de automação fica sempre oculta e o Chrome adia carregar mídia em aba oculta.
Antes da primeira carreata, confirme no telefone que vai rodar: som saindo,
troca de faixa pelo Bluetooth do carro, tela apagada sem parar o som, e o modo
avião ligado para provar o offline.
