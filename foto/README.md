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
  "origem": "/Volumes/Extreme Pro/PEPE POR ELAS/FOTOS"
}
```

`origem` é a pasta com os arquivos de câmera, no HD — ela não entra no
repositório. `capa` é o `id` da foto que ilustra o evento no índice; na
primeira rodada deixe de fora, veja as miniaturas geradas, escolha uma e
rode de novo.

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

Por fim, acrescente o evento a `foto/eventos.json` para ele aparecer no
índice. É o único passo manual, e é de propósito: dá para gerar os
arquivos e conferir antes de o evento ficar visível.

Ordem: a numeração sequencial da câmera já é a ordem cronológica, então as
fotos aparecem na ordem em que foram feitas.

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
  modelos/                det_500m.onnx (SCRFD) e w600k_mbf.onnx (ArcFace)
  bin/
    gerar-evento.mjs      o gerador
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
