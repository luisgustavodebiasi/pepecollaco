/* Núcleo portável de detecção e reconhecimento facial.
   Roda igual no Node (pré-indexação) e no navegador (busca por selfie),
   porque recebe os pixels já decodificados e a sessão ONNX já criada.

   Detector: SCRFD 500M  (det_500m.onnx)   — caixa + 5 pontos
   Descritor: ArcFace MBF (w600k_mbf.onnx) — vetor de 512 dimensões

   Os dois vetores só são comparáveis se as duas pontas usarem ESTE arquivo:
   qualquer diferença no alinhamento dos 5 pontos desloca o embedding e a
   busca passa a errar. Não duplique a lógica; importe. */

/* 640 é a resolução em que o det_500m foi treinado, e medimos que subir para
   1024 ou 1600 não acha um rosto a mais nestas fotos: são retratos e grupos
   posados, não plateia ao longe. Subir só custaria tempo. */
export const TAM_DET = 640;
export const LIMIAR_DET = 0.5;   // confiança mínima para considerar um rosto
export const LIMIAR_NMS = 0.4;

/* Gabarito de 5 pontos do ArcFace em 112×112. Não mexer: é a referência
   contra a qual os pesos do descritor foram treinados. */
const GABARITO = [
  [38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366],
  [41.5493, 92.3655], [70.7299, 92.2041],
];

/* ── Imagem: {dados: Uint8Array RGB, largura, altura} ───────────────── */

/** Redimensiona com amostragem bilinear. Suficiente aqui: a entrada do
    detector já é uma redução grande e o descritor recorta do original. */
function redimensionar(img, larguraNova, alturaNova) {
  const saida = new Uint8Array(larguraNova * alturaNova * 3);
  const ex = img.largura / larguraNova, ey = img.altura / alturaNova;
  for (let y = 0; y < alturaNova; y++) {
    const sy = Math.min(img.altura - 1, (y + 0.5) * ey - 0.5);
    const y0 = Math.max(0, Math.floor(sy)), y1 = Math.min(img.altura - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < larguraNova; x++) {
      const sx = Math.min(img.largura - 1, (x + 0.5) * ex - 0.5);
      const x0 = Math.max(0, Math.floor(sx)), x1 = Math.min(img.largura - 1, x0 + 1);
      const fx = sx - x0;
      const i00 = (y0 * img.largura + x0) * 3, i01 = (y0 * img.largura + x1) * 3;
      const i10 = (y1 * img.largura + x0) * 3, i11 = (y1 * img.largura + x1) * 3;
      const d = (y * larguraNova + x) * 3;
      for (let c = 0; c < 3; c++) {
        const a = img.dados[i00 + c] * (1 - fx) + img.dados[i01 + c] * fx;
        const b = img.dados[i10 + c] * (1 - fx) + img.dados[i11 + c] * fx;
        saida[d + c] = a * (1 - fy) + b * fy;
      }
    }
  }
  return { dados: saida, largura: larguraNova, altura: alturaNova };
}

/* ── Detecção ───────────────────────────────────────────────────────── */

function distanciaParaCaixa(cx, cy, d) {
  return [cx - d[0], cy - d[1], cx + d[2], cy + d[3]];
}

function nms(caixas, limiar) {
  const ordem = caixas.map((_, i) => i).sort((a, b) => caixas[b].nota - caixas[a].nota);
  const mantidos = [];
  const descartado = new Uint8Array(caixas.length);
  for (const i of ordem) {
    if (descartado[i]) continue;
    mantidos.push(caixas[i]);
    const [ax1, ay1, ax2, ay2] = caixas[i].caixa;
    const areaA = (ax2 - ax1) * (ay2 - ay1);
    for (const j of ordem) {
      if (j === i || descartado[j]) continue;
      const [bx1, by1, bx2, by2] = caixas[j].caixa;
      const w = Math.min(ax2, bx2) - Math.max(ax1, bx1);
      const h = Math.min(ay2, by2) - Math.max(ay1, by1);
      if (w <= 0 || h <= 0) continue;
      const inter = w * h;
      const areaB = (bx2 - bx1) * (by2 - by1);
      if (inter / (areaA + areaB - inter) > limiar) descartado[j] = 1;
    }
  }
  return mantidos;
}

/** Detecta rostos. Devolve [{caixa:[x1,y1,x2,y2], pontos:[[x,y]×5], nota}]
    em coordenadas da imagem original. */
export async function detectar(sessao, img, Tensor, limiar = LIMIAR_DET) {
  // Letterbox no canto superior esquerdo, como faz o insightface.
  const escala = Math.min(TAM_DET / img.largura, TAM_DET / img.altura);
  const lr = Math.round(img.largura * escala), ar = Math.round(img.altura * escala);
  const red = redimensionar(img, lr, ar);

  // NCHW, RGB, (x − 127,5) / 128
  const entrada = new Float32Array(3 * TAM_DET * TAM_DET);
  const plano = TAM_DET * TAM_DET;
  for (let y = 0; y < ar; y++) {
    for (let x = 0; x < lr; x++) {
      const s = (y * lr + x) * 3, d = y * TAM_DET + x;
      entrada[d] = (red.dados[s] - 127.5) / 128;
      entrada[plano + d] = (red.dados[s + 1] - 127.5) / 128;
      entrada[2 * plano + d] = (red.dados[s + 2] - 127.5) / 128;
    }
  }
  // O padding vale 0 no pixel, que normalizado é −0,996 — é assim no original.
  for (let i = 0; i < 3 * plano; i++) if (entrada[i] === 0) entrada[i] = -127.5 / 128;

  const saida = await sessao.run({
    [sessao.inputNames[0]]: new Tensor('float32', entrada, [1, 3, TAM_DET, TAM_DET]),
  });
  const n = sessao.outputNames;
  const brutos = [];
  const strides = [8, 16, 32];
  for (let k = 0; k < 3; k++) {
    const notas = saida[n[k]].data;
    const caixas = saida[n[k + 3]].data;
    const pontos = saida[n[k + 6]].data;
    const s = strides[k];
    const lg = Math.ceil(TAM_DET / s), al = Math.ceil(TAM_DET / s);
    const ancoras = 2;                      // o SCRFD 500M usa 2 por célula
    for (let i = 0; i < notas.length; i++) {
      if (notas[i] < limiar) continue;
      const cel = Math.floor(i / ancoras);
      const cx = (cel % lg) * s, cy = Math.floor(cel / lg) * s;
      if (cy >= al * s) break;
      const cb = i * 4;
      const caixa = distanciaParaCaixa(cx, cy, [
        caixas[cb] * s, caixas[cb + 1] * s, caixas[cb + 2] * s, caixas[cb + 3] * s,
      ]);
      const cp = i * 10, pts = [];
      for (let p = 0; p < 5; p++) {
        pts.push([cx + pontos[cp + p * 2] * s, cy + pontos[cp + p * 2 + 1] * s]);
      }
      brutos.push({ caixa, pontos: pts, nota: notas[i] });
    }
  }
  // Volta para as coordenadas da imagem original.
  return nms(brutos, LIMIAR_NMS).map((f) => ({
    nota: f.nota,
    caixa: f.caixa.map((v) => v / escala),
    pontos: f.pontos.map(([x, y]) => [x / escala, y / escala]),
  }));
}

/* ── Alinhamento ────────────────────────────────────────────────────── */

/** Similaridade por mínimos quadrados (rotação + escala única + translação,
    sem reflexão) dos 5 pontos para o gabarito. Forma fechada do Procrustes
    complexo — equivale ao Umeyama do insightface sem precisar de SVD. */
function transformacao(pontos) {
  let mx = 0, my = 0, mu = 0, mv = 0;
  for (let i = 0; i < 5; i++) { mx += pontos[i][0]; my += pontos[i][1]; mu += GABARITO[i][0]; mv += GABARITO[i][1]; }
  mx /= 5; my /= 5; mu /= 5; mv /= 5;
  let num1 = 0, num2 = 0, den = 0;
  for (let i = 0; i < 5; i++) {
    const xc = pontos[i][0] - mx, yc = pontos[i][1] - my;
    const uc = GABARITO[i][0] - mu, vc = GABARITO[i][1] - mv;
    num1 += xc * uc + yc * vc;
    num2 += xc * vc - yc * uc;
    den += xc * xc + yc * yc;
  }
  const a = num1 / den, b = num2 / den;
  return { a, b, tx: mu - (a * mx - b * my), ty: mv - (b * mx + a * my) };
}

/** Recorta e alinha o rosto em 112×112 amostrando a imagem ORIGINAL. */
export function alinhar(img, pontos) {
  const { a, b, tx, ty } = transformacao(pontos);
  const det = a * a + b * b;                    // inversa da similaridade
  const ia = a / det, ib = -b / det;
  const saida = new Uint8Array(112 * 112 * 3);
  for (let v = 0; v < 112; v++) {
    for (let u = 0; u < 112; u++) {
      const du = u - tx, dv = v - ty;
      const sx = ia * du - ib * dv, sy = ib * du + ia * dv;
      const d = (v * 112 + u) * 3;
      if (sx < 0 || sy < 0 || sx > img.largura - 1 || sy > img.altura - 1) continue;
      const x0 = Math.floor(sx), y0 = Math.floor(sy);
      const x1 = Math.min(img.largura - 1, x0 + 1), y1 = Math.min(img.altura - 1, y0 + 1);
      const fx = sx - x0, fy = sy - y0;
      const i00 = (y0 * img.largura + x0) * 3, i01 = (y0 * img.largura + x1) * 3;
      const i10 = (y1 * img.largura + x0) * 3, i11 = (y1 * img.largura + x1) * 3;
      for (let c = 0; c < 3; c++) {
        const p = img.dados[i00 + c] * (1 - fx) + img.dados[i01 + c] * fx;
        const q = img.dados[i10 + c] * (1 - fx) + img.dados[i11 + c] * fx;
        saida[d + c] = p * (1 - fy) + q * fy;
      }
    }
  }
  return saida;
}

/* ── Descritor ──────────────────────────────────────────────────────── */

/** Vetor de 512 dimensões, já normalizado em L2 — então comparar dois é só
    fazer o produto escalar, e o resultado é o cosseno. */
export async function descrever(sessao, img, pontos, Tensor) {
  const recorte = alinhar(img, pontos);
  const entrada = new Float32Array(3 * 112 * 112);
  const plano = 112 * 112;
  for (let i = 0; i < plano; i++) {
    entrada[i] = (recorte[i * 3] - 127.5) / 127.5;
    entrada[plano + i] = (recorte[i * 3 + 1] - 127.5) / 127.5;
    entrada[2 * plano + i] = (recorte[i * 3 + 2] - 127.5) / 127.5;
  }
  const saida = await sessao.run({
    [sessao.inputNames[0]]: new Tensor('float32', entrada, [1, 3, 112, 112]),
  });
  const v = Float32Array.from(saida[sessao.outputNames[0]].data);
  let norma = 0;
  for (const x of v) norma += x * x;
  norma = Math.sqrt(norma) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= norma;
  return v;
}
