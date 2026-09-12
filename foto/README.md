# Galeria de fotos — pepecollaco.com/foto

As fotos dos eventos do mandato e da campanha, com busca pelo rosto.
Tudo estático, servido pelo GitHub Pages junto do resto do site.

## O que a pessoa vê

1. `/foto/` lista os eventos, do mais novo para o mais velho.
2. `/foto/<slug>/` traz todas as fotos daquele evento, e um botão para
   achar as suas pelo rosto.
3. Clicando numa foto, abre grande, com botão de baixar e de compartilhar.

## A busca por rosto, e por que ela é aceitável

O reconhecimento roda **inteiro dentro do navegador de quem busca**. A
selfie vai da câmera para um `<canvas>`, do canvas para o modelo, e o que
sobra é um vetor de 512 números que morre quando a aba fecha. Nada sobe
para servidor nenhum, porque não existe servidor: o site é um monte de
arquivo estático.

O que vem do site é o caminho inverso — a lista de vetores das fotos do
evento (`rostos.bin`), baixada para o aparelho, onde a comparação acontece.

Isso importa por dois motivos:

- **É a promessa escrita na página.** Se algum dia alguém precisar mandar a
  selfie para fora do aparelho, o texto da página muda antes do código.
- **É o que torna defensável indexar rosto de quem foi ao evento.** Vetor
  facial é dado biométrico. Os vetores publicados aqui não têm nome
  nenhum grudado — são pseudônimos ligados a fotos que já estão públicas,
  e qualquer pessoa com as mesmas fotos chegaria neles. Não se cria
  informação identificável nova. Se alguém pedir para sair, some-se com a
  foto e roda-se o gerador de novo; o vetor vai junto.

## Publicar um evento novo

```bash
cd foto
mkdir <slug>
```

Escreva `foto/<slug>/evento.json`:

```json
{
  "titulo": "Pepê por Elas",
  "subtitulo": "Mulheres que inspiram, vozes que transformam.",
  "data": "2026-09-11",
  "local": "Tubarão",
  "credito": " Fotos de Fulano de Tal.",
  "capa": "0210",
  "og": "0198",
  "endereco": "ABECELESC",
  "origem": "/Volumes/Extreme Pro/PEPE POR ELAS/FOTOS"
}
```

`origem` é a pasta com os arquivos de câmera, no HD — ela não entra no
repositório. `capa` é o `id` da foto que ilustra o evento no índice e `og`
a que vira cartão de compartilhamento; na primeira rodada deixe as duas de
fora, veja as miniaturas geradas, escolha e rode de novo. São campos
separados porque o recorte é outro: a capa é quase quadrada e o cartão é
uma faixa larga, então raramente a mesma foto serve bem nos dois. Para o
cartão, foto de grupo aberta funciona melhor que retrato.

```bash
cd foto/bin && npm install      # só na primeira vez
cd .. && node bin/gerar-evento.mjs <slug>
```

O gerador escreve, dentro de `foto/<slug>/`:

| Saída | O que é |
|---|---|
| `p/0001.webp` … | miniatura da grade, 480 px |
| `g/0001.webp` … | a foto aberta e a que se baixa, 1800 px |
| `dados.json` | lista de fotos, caixa e nota de qualidade de cada rosto |
| `rostos.bin` | os vetores de 512 dimensões, em int8 |
| `index.html` | a página, montada a partir de `app/molde-evento.html` |
| `og.jpg` | o cartão de compartilhamento, 1200×630, por `bin/gerar-og.mjs` |

Por fim, acrescente o evento a `foto/eventos.json` para ele aparecer no
índice. É o único passo manual, e é de propósito: dá para gerar os
arquivos e conferir antes de o evento ficar visível.

Ordem: a numeração sequencial da câmera já é a ordem cronológica, então as
fotos aparecem na ordem em que foram feitas.

Para mexer só no texto da página ou no cartão, sem esperar os 90 segundos
de reprocessar as fotos:

```bash
node bin/gerar-evento.mjs <slug> --so-pagina
```

### O cartão de compartilhamento

`bin/gerar-og.mjs` monta a peça: foto de fundo com um banho leve de rosa,
faixa rosa subindo do pé, textura de setas, o lockup **Pepê por Elas** com
sombra, a linha de endereço e cidade, a assinatura com o número e, no alto
à direita, o selo branco do reconhecimento facial.

O rosa é o da linha: `#F039A1`, lido do degradê vetorial do bolão impresso
(ver `BACKDROP POR ELAS/README.md`), descendo até `#7A1B56` na borda de
baixo. O cartão cai na conversa do WhatsApp logo abaixo do convite rosa que
já circulou — sair azul ali quebraria o reconhecimento.

O lockup é PEPÊ em tipo mais o lettering "por elas" em desenho, empilhados
como no convite. **Não entra o VOTE PEPÊ 11223:** ele traz um segundo PEPÊ
grande, e dois lockups na mesma peça se anulam. O número fica na assinatura,
em texto, no canto oposto. É a mesma decisão já tomada no cartão do
credenciamento (`PEPECOPY/credenciamento-next/app/[slug]/opengraph-image.tsx`).

Dois detalhes que custaram tentativa:

- **Cor e opacidade do degradê são construídas separadas.** O
  `-function polynomial` do ImageMagick mexe em todos os canais, e num
  degradê entre duas cores diferentes ele desmonta o rosa junto com a
  rampa — o resultado sai lavado, cor de nada.
- **A sombra do lockup é feita à mão, em tela de tamanho fixo.** O
  `-shadow` com `-layers merge` recalcula a tela conforme o borrão e
  reposiciona o conteúdo: o desenho ia parar em (22,22) de uma tela de
  470×371 em vez dos (70,70) pedidos, e encostava na borda do cartão.

Sai em **JPEG**, e isso não é detalhe: WhatsApp e boa parte dos agregadores
não desenham webp em prévia de link, e é pelo WhatsApp que a página
circula. Cartão que não aparece no WhatsApp é cartão que não existe.

O texto usa os `.otf` de `_IDENTIDADE/dist/fontes/`, porque o site publica
só woff2 e o ImageMagick não lê woff2. O ícone é rasterizado pelo sharp: o
renderizador de SVG interno do ImageMagick ignora `fill="none"` e devolve
um quadrado preto.

## Peso

O evento Pepê por Elas, com 260 fotos, ocupa cerca de **40 MB** no
repositório — 36 MB de fotos grandes, 4 MB de miniaturas e 0,4 MB de
vetores. Os 2,3 GB de arquivos de câmera ficam no HD.

1800 px no lado grande é o suficiente para postar em qualquer rede e
imprimir um 10×15. Quem quiser o arquivo original pede ao gabinete — o
rodapé da página já diz isso.

Fora dos eventos, a pasta carrega uma vez só:

| | |
|---|---|
| `modelos/` | 16 MB, os dois modelos ONNX |
| `app/vendor/` | 11 MB, o runtime ONNX do navegador |

Esses 27 MB só são baixados por quem aperta "buscar pelo meu rosto", e o
navegador guarda em cache depois da primeira vez. Quem só quer olhar as
fotos nunca os toca.

## Os arquivos

```
foto/
  index.html              índice dos eventos, lê eventos.json
  eventos.json            a lista — editada à mão ao publicar
  app/
    rosto.mjs             detecção e embedding; MESMO arquivo nas duas pontas
    galeria.js            grade, visor, ponte para a busca
    busca.js              câmera, modelo e comparação (carregado sob demanda)
    estilo.css            visual da galeria e do índice
    molde-evento.html     molde da página de evento
    vendor/               onnxruntime-web, copiado de node_modules
    icone/rosto-busca.svg  o quadro de mira com rosto; a peça e a página usam o mesmo
  modelos/                det_500m.onnx (SCRFD) e w600k_mbf.onnx (ArcFace)
  bin/
    gerar-evento.mjs      o gerador
    gerar-og.mjs          o cartão de compartilhamento
    package.json          sharp + onnxruntime-node
  <slug>/                 um por evento
```

**`app/rosto.mjs` é o arquivo que não pode divergir.** Ele roda no Node,
ao indexar, e no navegador, ao buscar. Os vetores só são comparáveis
porque as duas pontas alinham o rosto exatamente do mesmo jeito. Se
alguém duplicar essa lógica em vez de importar, a busca passa a errar sem
dar erro nenhum.

## Os números da busca, e de onde saíram

Medido nas 260 fotos do Pepê por Elas, com 887 rostos indexados:

| | |
|---|---|
| mesma pessoa, pares | cosseno mediano **0,64**, décimo percentil 0,41 |
| pessoas diferentes | percentil 99 em **0,23** |
| `LIMIAR_TALVEZ` 0,30 | piso: abaixo disso a foto nem entra na lista |
| 0,42 | acima disso a página escreve "Você"; entre os dois, "Talvez" |
| `DESCONTO_QUALIDADE` 0,35 | desconto proporcional a quanto o rosto indexado é ruim |

O desconto existe porque rosto pequeno, borrado ou de lado gera vetor
pouco discriminativo, e é dele que vem o falso positivo. Descontando
0,35 · (1 − qualidade), dois terços dos encontros duvidosos somem sem
perder nenhum dos 1.100 pares de mesma pessoa entre rostos bons.

Conferido também que navegador e Node chegam ao mesmo vetor para o mesmo
rosto: cosseno entre as duas pontas fica entre 0,92 e 0,99, muito acima
do limiar. A diferença que sobra vem da compressão webp.

## Limites conhecidos

- **Rosto de costas ou de perfil não é indexado.** Numa amostra de 60
  fotos, 62 das 260 não têm nenhum rosto indexável: são decoração,
  backdrop, plateia de costas. Elas continuam na grade, só não aparecem
  em busca nenhuma.
- **O detector trabalha em 640 px.** Medimos 1024 e 1600 e não acharam um
  rosto a mais nestas fotos, que são retratos e grupos posados. Num
  evento com plateia fotografada de longe isso pode mudar.
- **Selfie ruim devolve resultado ruim.** Foto de lado, escura ou borrada
  gera um vetor tão pouco discriminativo quanto os que o índice descarta.
  A página pede foto de frente e com luz, e mostra o "Talvez" justamente
  para não afirmar o que não sabe.
