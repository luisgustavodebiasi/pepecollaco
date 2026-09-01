/** Formatação de número e texto compartilhada pelo gerador de páginas. */

function escapar(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Cifra no formato da marca: "R$ 88 MILHÕES", "R$ 1,25 MILHÃO", "R$ 700 MIL".
 * Devolve { numero, unidade } para o HTML poder pôr a unidade num <small>.
 *
 * Arredonda sempre PARA BAIXO na casa exibida. Um "+" na frente de um número
 * arredondado para cima é afirmação falsa — foi assim que "R$ 18,9 mi" virou
 * "+R$ 20 mi" na página antiga.
 */
function cifra(valor, casas = null) {
  if (valor >= 1e6) {
    const mi = valor / 1e6;
    const casasUsadas = casas ?? (mi >= 10 ? 0 : mi >= 1 ? (Number.isInteger(mi) ? 0 : 1) : 2);
    const fator = 10 ** casasUsadas;
    const n = Math.floor(mi * fator) / fator;
    // Em português o singular vale até o 2 exclusive: "R$ 1,5 milhão",
    // "R$ 1,25 milhão", mas "R$ 2 milhões".
    const singular = n < 2;
    return {
      numero: n.toLocaleString('pt-BR', { minimumFractionDigits: casasUsadas, maximumFractionDigits: casasUsadas }),
      unidade: singular ? 'MILHÃO' : 'MILHÕES',
      curta: singular ? 'MILHÃO' : 'MI',
    };
  }
  if (valor >= 1000) {
    return { numero: String(Math.floor(valor / 1000)), unidade: 'MIL', curta: 'MIL' };
  }
  return { numero: String(Math.floor(valor)), unidade: '', curta: '' };
}

/** "R$ 88 MILHÕES" inteiro, em texto puro (meta description, WhatsApp). */
function cifraTexto(valor) {
  const c = cifra(valor);
  return `R$ ${c.numero}${c.unidade ? ` ${c.unidade.toLowerCase()}` : ''}`;
}

/**
 * Valor curto para chip: "R$ 18,9 mi", "R$ 567 mil".
 * Mantém uma casa decimal até R$ 100 milhões: num chip lado a lado com outro,
 * "R$ 18 mi" ao lado de "R$ 18,9 mi" muda a leitura da lista inteira.
 */
function cifraChip(valor) {
  const c = cifra(valor, valor >= 1e6 && valor < 1e8 ? 1 : null);
  return `R$ ${c.numero} ${c.curta.toLowerCase()}`;
}

/** 1234 → "1.234" */
const milhar = (n) => Number(n).toLocaleString('pt-BR');

/** "2026-08-31" ou "31/08/2026" → "31/08/2026" */
function data(bruta) {
  const s = String(bruta || '').trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return s;
}

/**
 * Corta a legenda sem deixar palavra pela metade nem emoji órfão no fim.
 */
function resumirLegenda(texto, limite = 150) {
  const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  const ate = corte.lastIndexOf(' ');
  return `${corte.slice(0, ate > 40 ? ate : limite).replace(/[\s\p{P}\p{S}]+$/u, '')}…`;
}

module.exports = { escapar, cifra, cifraTexto, cifraChip, milhar, data, resumirLegenda };
