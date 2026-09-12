/* ═══════════════════════════════════════════════════════════════════════
   Busca por rosto — roda inteira dentro do navegador.

   A selfie não sobe para servidor nenhum: os pixels vão da câmera para um
   canvas, do canvas para o modelo, e o que sobra é um vetor de 512 números
   que existe só enquanto a aba está aberta. O que vem do site é a lista de
   vetores das fotos do evento (rostos.bin), e a comparação acontece aqui.

   Isto não é detalhe de implementação: é a promessa escrita na página, e é
   o que torna aceitável indexar o rosto de quem foi ao evento. Se um dia
   alguém precisar mandar a selfie para fora, a promessa muda antes do código.
   ═══════════════════════════════════════════════════════════════════════ */

import { detectar, descrever } from './rosto.mjs';

const MODELOS = '/foto/modelos/';
const VENDOR = '/foto/app/vendor/';

/* Os limiares saíram de medição, não de chute. Nas fotos deste evento,
   pares da mesma pessoa dão cosseno com mediana 0,64 e décimo percentil 0,41;
   pares de pessoas diferentes ficam em 0,23 no percentil 99. Daí os dois
   degraus: acima de 0,42 a página escreve "Você", entre 0,30 e 0,42 escreve
   "Talvez", e abaixo disso nem mostra.

   O desconto por qualidade é a outra metade da regra. Rosto pequeno, borrado
   ou de lado gera vetor pouco discriminativo, e é ele que produz o falso
   positivo: medindo consultas nítidas contra o decil mais fraco do índice,
   um desconto de 0,35 corta dois terços desses encontros duvidosos sem
   perder nenhum dos 1.100 pares de mesma pessoa entre rostos bons.

   Descontar em vez de subir o limiar mantém os rótulos com sentido: o que
   se compara com 0,42 é sempre a mesma escala, e um rosto ruim precisa
   parecer muito mais para chegar lá.

   O degrau de 0,42 que separa "Você" de "Talvez" é rótulo de tela e mora em
   galeria.js; o que fica aqui é o piso, que decide o que entra na lista. */
const LIMIAR_TALVEZ = 0.30;
const DESCONTO_QUALIDADE = 0.35;

let sessoes = null;      // { detector, descritor, ort }
let indice = null;       // { vetores: Int8Array } do evento aberto

/* ── Interface ──────────────────────────────────────────────────────── */

let painel, caixa;

function montarPainel() {
  painel = document.createElement('div');
  painel.className = 'painel';
  painel.innerHTML = `
    <div class="painel-caixa" role="dialog" aria-modal="true" aria-labelledby="painel-titulo">
      <button class="icone painel-fechar" type="button" data-fechar aria-label="Fechar">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
      <div data-corpo></div>
    </div>`;
  document.body.append(painel);
  caixa = painel.querySelector('[data-corpo]');
  painel.querySelector('[data-fechar]').addEventListener('click', fechar);
  painel.addEventListener('click', (e) => { if (e.target === painel) fechar(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && painel && !painel.hidden) fechar();
  });
}

function fechar() {
  pararCamera();
  painel.hidden = true;
  document.body.style.overflow = '';
}

function abrir() {
  painel.hidden = false;
  document.body.style.overflow = 'hidden';
}

function telaEscolha() {
  caixa.innerHTML = `
    <h2 id="painel-titulo">Ache as suas fotos</h2>
    <p>Escolha como mandar o seu rosto. Vale uma selfie na hora ou uma foto
       que já esteja no celular — de frente e com o rosto bem visível.</p>
    <div class="painel-botoes">
      <button class="botao-principal" type="button" data-camera>
        <svg class="icone-rosto" viewBox="0 0 48 48"><path d="M4 15.5V8.5A4.5 4.5 0 0 1 8.5 4h7"/><path d="M32.5 4h7A4.5 4.5 0 0 1 44 8.5v7"/><path d="M44 32.5v7a4.5 4.5 0 0 1-4.5 4.5h-7"/><path d="M15.5 44h-7A4.5 4.5 0 0 1 4 39.5v-7"/><circle cx="24" cy="20.5" r="6"/><path d="M13.5 36.5c1.9-4.6 5.9-7 10.5-7s8.6 2.4 10.5 7"/></svg>
        Tirar uma selfie agora
      </button>
      <button class="botao-vazado" type="button" data-arquivo>
        <svg viewBox="0 0 24 24"><path d="M4 16.5V19h16v-2.5M12 4v11m0 0l-4-4m4 4l4-4"/></svg>
        Escolher uma foto do celular
      </button>
    </div>
    <p class="privacidade">
      A sua foto é analisada <strong>dentro do seu aparelho</strong> e não sai
      dele. Nada é enviado, nada é gravado, nada fica no site. Ao fechar esta
      janela não resta nenhum registro do seu rosto.
    </p>`;
  caixa.querySelector('[data-camera]').addEventListener('click', telaCamera);
  caixa.querySelector('[data-arquivo]').addEventListener('click', escolherArquivo);
}

function telaCarregando(texto, pct) {
  caixa.innerHTML = `
    <h2 id="painel-titulo">${texto}</h2>
    <div class="progresso"><i style="width:${pct}%"></i></div>
    <p>Na primeira busca o seu navegador baixa cerca de 18 MB do programa de
       reconhecimento. Depois disso ele fica guardado e a busca é instantânea.</p>`;
}

function telaErro(mensagem, tentarDeNovo = true) {
  caixa.innerHTML = `
    <h2 id="painel-titulo">Não deu certo</h2>
    <p class="aviso">${mensagem}</p>
    ${tentarDeNovo ? '<div class="painel-botoes"><button class="botao-principal" type="button" data-voltar>Tentar de novo</button></div>' : ''}`;
  caixa.querySelector('[data-voltar]')?.addEventListener('click', telaEscolha);
}

/* ── Câmera ─────────────────────────────────────────────────────────── */

let fluxo = null;

function pararCamera() {
  fluxo?.getTracks().forEach((t) => t.stop());
  fluxo = null;
}

async function telaCamera() {
  caixa.innerHTML = `
    <h2 id="painel-titulo">Olhe para a câmera</h2>
    <div class="camera"><video data-video playsinline muted autoplay></video><div class="camera-alvo"></div></div>
    <div class="painel-botoes">
      <button class="botao-principal" type="button" data-tirar>Tirar a foto</button>
    </div>
    <p class="privacidade">A imagem não sai do aparelho.</p>`;
  const video = caixa.querySelector('[data-video]');
  try {
    fluxo = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } },
      audio: false,
    });
    video.srcObject = fluxo;
  } catch {
    telaErro('Não consegui abrir a câmera. Verifique se o navegador tem permissão, ' +
             'ou escolha uma foto que já esteja no celular.');
    return;
  }
  caixa.querySelector('[data-tirar]').addEventListener('click', () => {
    const c = document.createElement('canvas');
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    c.getContext('2d').drawImage(video, 0, 0);
    pararCamera();
    void processar(c);
  });
}

function escolherArquivo() {
  const entrada = document.createElement('input');
  entrada.type = 'file';
  entrada.accept = 'image/*';
  entrada.addEventListener('change', async () => {
    const arquivo = entrada.files?.[0];
    if (!arquivo) return;
    telaCarregando('Lendo a sua foto', 5);
    try {
      const bitmap = await createImageBitmap(arquivo);
      // 1400 px de lado grande basta: o detector trabalha em 640 e o recorte
      // do rosto sai em 112. Guardar mais só gasta memória do celular.
      const escala = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
      const c = document.createElement('canvas');
      c.width = Math.round(bitmap.width * escala);
      c.height = Math.round(bitmap.height * escala);
      c.getContext('2d').drawImage(bitmap, 0, 0, c.width, c.height);
      bitmap.close();
      await processar(c);
    } catch {
      telaErro('Não consegui abrir esse arquivo. Tente uma foto comum, em JPG ou PNG.');
    }
  });
  entrada.click();
}

/* ── Carga do modelo e do índice ────────────────────────────────────── */

/** Baixa mostrando progresso real — 18 MB sem barra parece travamento. */
async function baixar(url, aoAndar) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`falhou ${url}`);
  const total = Number(resposta.headers.get('content-length')) || 0;
  if (!total || !resposta.body) return new Uint8Array(await resposta.arrayBuffer());
  const leitor = resposta.body.getReader();
  const pedacos = [];
  let lido = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    pedacos.push(value);
    lido += value.length;
    aoAndar?.(lido / total);
  }
  const saida = new Uint8Array(lido);
  let pos = 0;
  for (const p of pedacos) { saida.set(p, pos); pos += p.length; }
  return saida;
}

async function preparar(base) {
  if (sessoes && indice) return;

  telaCarregando('Preparando o reconhecimento', 3);
  const ort = await import(`${VENDOR}ort.wasm.min.mjs`);
  ort.env.wasm.wasmPaths = VENDOR;
  /* GitHub Pages não manda os cabeçalhos COOP/COEP, então não há
     SharedArrayBuffer e não há como usar mais de uma thread. Dizer isso
     explicitamente evita o aviso no console e uma tentativa que falha. */
  ort.env.wasm.numThreads = 1;
  ort.env.logLevel = 'error';

  /* Os dois modelos somam 16 MB e o índice 0,4 MB. O peso está no descritor,
     então a barra segue o progresso real dele em vez de contar arquivos. */
  const [det, desc, bin] = await Promise.all([
    baixar(`${MODELOS}det_500m.onnx`),
    baixar(`${MODELOS}w600k_mbf.onnx`, (f) => telaCarregando('Preparando o reconhecimento', 5 + f * 85)),
    baixar(`${base}rostos.bin`),
  ]);

  telaCarregando('Quase lá', 95);
  const opcoes = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' };
  sessoes = {
    ort,
    detector: await ort.InferenceSession.create(det, opcoes),
    descritor: await ort.InferenceSession.create(desc, opcoes),
  };
  indice = { vetores: new Int8Array(bin.buffer, bin.byteOffset, bin.length) };
}

/* ── Comparação ─────────────────────────────────────────────────────── */

/** Percorre os vetores do evento e devolve a melhor foto de cada pessoa
    encontrada. É um produto escalar de 512 termos por rosto indexado —
    milissegundos para os 887 deste evento, sem precisar de índice aproximado.
    Devolve [{ foto, s, rosto }] ordenado, com s já descontado pela qualidade. */
function comparar(consulta, dados) {
  const { vetores } = indice;
  const { n, escala, foto: deQualFoto, q } = dados.rostos;
  const porFoto = new Map();
  for (let i = 0; i < n; i++) {
    let soma = 0;
    const base = i * 512;
    for (let k = 0; k < 512; k++) soma += consulta[k] * vetores[base + k];
    const s = soma / escala - (1 - q[i]) * DESCONTO_QUALIDADE;   // int8 → cosseno, menos o desconto
    if (s < LIMIAR_TALVEZ) continue;
    const f = deQualFoto[i];
    /* Guarda QUAL rosto casou, não só a foto: é ele que a página emoldura
       depois. Numa foto com dez pessoas, apontar o primeiro rosto indexado
       em vez do que casou mostra um estranho para quem procurou por si. */
    if (!porFoto.has(f) || porFoto.get(f).s < s) porFoto.set(f, { s, rosto: i });
  }
  return [...porFoto.entries()]
    .map(([foto, { s, rosto }]) => ({ foto, s, rosto }))
    .sort((a, b) => b.s - a.s);
}

/* ── Fluxo principal ────────────────────────────────────────────────── */

let contexto = null;   // o que galeria.js passou

async function processar(canvas) {
  try {
    await preparar(contexto.BASE);
  } catch (e) {
    console.error(e);
    telaErro('Não consegui baixar o programa de reconhecimento. Confira a sua ' +
             'conexão e tente de novo.');
    return;
  }

  telaCarregando('Procurando você nas fotos', 97);
  /* Dá um respiro para o navegador pintar essa tela antes de o modelo tomar
     a thread. setTimeout e não requestAnimationFrame: quem está no celular
     troca de aplicativo enquanto espera, e aba em segundo plano não recebe
     quadro nenhum — com rAF a busca ficava pendurada para sempre. */
  await new Promise((r) => setTimeout(r, 16));

  const d = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  const rgb = new Uint8Array(canvas.width * canvas.height * 3);
  for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
    rgb[j] = d[i]; rgb[j + 1] = d[i + 1]; rgb[j + 2] = d[i + 2];
  }
  const img = { dados: rgb, largura: canvas.width, altura: canvas.height };

  let resultado;
  try {
    const achados = await detectar(sessoes.detector, img, sessoes.ort.Tensor);
    if (!achados.length) {
      telaErro('Não encontrei um rosto nessa imagem. Tente uma foto de frente, ' +
               'com o rosto maior no quadro e boa iluminação.');
      return;
    }
    /* Se a pessoa mandou uma foto com mais gente, quem manda é o rosto maior:
       numa selfie é sempre quem tirou. */
    achados.sort((a, b) => (b.caixa[2] - b.caixa[0]) - (a.caixa[2] - a.caixa[0]));
    const vetor = await descrever(sessoes.descritor, img, achados[0].pontos, sessoes.ort.Tensor);
    resultado = comparar(vetor, contexto.dados);
    vetor.fill(0);                  // o vetor do rosto de quem buscou morre aqui
  } catch (e) {
    console.error(e);
    telaErro('Deu um problema ao analisar a imagem. Tente de novo, ou escolha outra foto.');
    return;
  }
  fechar();
  contexto.mostrarResultado(resultado);
}

/* ── Entrada ────────────────────────────────────────────────────────── */

export async function abrirBusca(ctxExterno) {
  contexto = ctxExterno;
  if (!painel) montarPainel();
  abrir();
  telaEscolha();
}
