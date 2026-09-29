/**
 * Totais por tema, calculados da base de emendas com critério escrito aqui,
 * para que a página que anuncia "R$ X em terapias para o TEA" possa ser
 * conferida pelo build como as páginas de região.
 *
 * O critério é o objeto da emenda. Ficou de fora de propósito o que é APAE em
 * geral (veículo, reforma de sede): ajuda muita gente, mas não é política de
 * autismo, e somar isso inflaria o número do tema.
 */

const CRITERIOS = {
  autismo: /TEA\b|AUTIS|ESPECTRO|EQUOTERAPIA|ECOTERAPIA|SENSORIA|TERAPIA OCUPACIONAL/i,
};

function resumir(linhas) {
  return {
    valor: Math.round(linhas.reduce((s, e) => s + (e.valor || 0), 0) * 100) / 100,
    n: linhas.length,
    municipios: new Set(linhas.map((e) => e.municipioChave)).size,
    lista: [...new Set(linhas.map((e) => e.municipio))].sort((a, b) => a.localeCompare(b, 'pt')),
  };
}

// porCoordenacao: o mesmo critério recortado por região, para a página da
// AMUREL anunciar o autismo dela com a mesma régua da página do tema.
function calcularTemas(emendas) {
  const temas = {};
  for (const [nome, re] of Object.entries(CRITERIOS)) {
    const linhas = emendas.emendas.filter((e) => re.test(e.objeto));
    const porCoordenacao = {};
    for (const c of new Set(linhas.map((e) => e.coordenacao))) {
      porCoordenacao[c] = resumir(linhas.filter((e) => e.coordenacao === c));
    }
    temas[nome] = { ...resumir(linhas), porCoordenacao };
  }
  return temas;
}

module.exports = { calcularTemas, CRITERIOS };
