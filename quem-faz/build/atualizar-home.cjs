#!/usr/bin/env node
/**
 * atualizar-home.cjs — reescreve a seção "Nossas leis" (#leis) da home a partir
 * de dados/leis.json, para que o status legislativo tenha uma fonte só.
 *
 *   node build/atualizar-home.cjs
 *
 * A home é escrita à mão e continua assim: este script troca apenas o miolo
 * entre os marcadores, preservando todo o resto do arquivo.
 */

const fs = require('fs');
const path = require('path');

const HOME = path.join(__dirname, '..', '..', 'index.html');
const LEIS = path.join(__dirname, '..', 'dados', 'leis.json');

const INICIO = '<!-- leis:inicio (gerado por quem-faz/build/atualizar-home.cjs) -->';
const FIM = '<!-- leis:fim -->';

/**
 * O texto de cada card. O status NÃO está aqui de propósito: vem de leis.json.
 * A ordem desta lista é a ordem na página.
 */
const CARDS = [
  {
    grupo: null,
    codigo: 'PL./0281/2023',
    titulo: 'Testes rápidos em farmácias',
    texto: 'Autoriza farmácias e drogarias a realizar exames clínicos e testes rápidos, ampliando o acesso à saúde básica.',
  },
  {
    grupo: null,
    codigo: 'PL./0257/2025',
    titulo: 'Energia solar para hospitais',
    texto: 'Permite destinar recursos do Fundo Social a sistemas fotovoltaicos em hospitais filantrópicos. Menos conta de luz é mais dinheiro no atendimento.',
  },
  {
    grupo: null,
    codigo: 'PL./0265/2022',
    titulo: 'Rota turística das águas termais',
    texto: 'Institui a rota estadual e inclui nela os municípios do Sul, fomentando o turismo termal na região.',
  },
  {
    grupo: null,
    codigo: 'PL./0269/2022',
    titulo: 'Incentivo à ovinocaprinocultura',
    texto: 'Apoio técnico, campanhas de divulgação, inclusão desses alimentos em escolas e hospitais, linhas de crédito e incentivo a produtores.',
  },
  {
    grupo: null,
    codigo: 'PL./0259/2025',
    titulo: 'Ressarcimento a municípios por atraso de repasses',
    texto: 'Proposta para que a prefeitura seja ressarcida quando precisa usar recurso próprio por atraso ou suspensão de repasse do Estado. O projeto foi retirado de tramitação e a pauta segue em aberto.',
  },
  {
    grupo: 'Bandeira Autismo',
    codigo: 'PL./0266/2022',
    titulo: 'Cine Azul',
    texto: 'Incentivo a sessões de cinema adaptadas a crianças e adolescentes com autismo e suas famílias.',
  },
  {
    grupo: 'Bandeira Autismo',
    codigo: 'PL./0322/2023',
    titulo: 'Protocolo de inclusão de alunos autistas (PIA)',
    texto: 'Atividades e avaliações adaptadas para promover aprendizagem de forma mais justa e inclusiva, seguindo padrões comprovados em outros estados.',
  },
  {
    grupo: 'Bandeira Autismo',
    codigo: 'PL./0052/2026',
    titulo: 'Continuidade do professor 2',
    texto: 'Dá preferência a que o segundo professor do estudante com TEA seja o mesmo profissional que já o acompanhava no ano anterior.',
  },
];

const escapar = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function main() {
  const leis = JSON.parse(fs.readFileSync(LEIS, 'utf8'));
  const porCodigo = new Map(leis.proposicoes.map((p) => [p.codigo, p]));

  const cardHtml = (c, i) => {
    const p = porCodigo.get(c.codigo);
    if (!p) throw new Error(`${c.codigo} não existe em leis.json`);

    const classe = p.virouLei ? 'selo-lei' : p.retirado || p.rejeitado ? 'selo-encerrado' : 'selo-comissao';
    const atraso = i > 0 && i < 4 ? ` d${i}` : '';
    return `      <article class="lei rv${atraso}">
        <h3 class="lei-t">${escapar(c.titulo)}</h3>
        <p class="lei-d">${escapar(c.texto)}</p>
        <span class="selo ${classe}">${escapar(p.rotulo)}</span>
        <a class="lei-fonte" href="${p.url}" target="_blank" rel="noopener">${escapar(p.codigo.replace('./', ' '))} no e-Legis</a>
      </article>`;
  };

  const grupos = [];
  for (const c of CARDS) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.nome === c.grupo) ultimo.itens.push(c);
    else grupos.push({ nome: c.grupo, itens: [c] });
  }

  const miolo = grupos
    .map((g) => {
      const rotulo = g.nome ? `\n    <p class="leis-grupo rv">${escapar(g.nome)}</p>\n` : '';
      return `${rotulo}    <div class="leis">\n${g.itens.map(cardHtml).join('\n\n')}\n    </div>`;
    })
    .join('\n');

  const html = fs.readFileSync(HOME, 'utf8');
  const i = html.indexOf(INICIO);
  const f = html.indexOf(FIM);
  if (i < 0 || f < 0) {
    throw new Error(
      'marcadores leis:inicio/leis:fim não encontrados em index.html — ' +
        'insira-os em volta dos cards da seção #leis antes de rodar este script'
    );
  }

  const novo = `${html.slice(0, i + INICIO.length)}\n${miolo}\n    ${html.slice(f)}`;
  fs.writeFileSync(HOME, novo);

  const leisSancionadas = CARDS.filter((c) => porCodigo.get(c.codigo).virouLei).length;
  console.log(`#leis atualizada: ${CARDS.length} cards · ${leisSancionadas} já são lei`);
  for (const c of CARDS) {
    console.log(`   ${porCodigo.get(c.codigo).rotulo.padEnd(20)} ${c.titulo}`);
  }
}

try {
  main();
} catch (erro) {
  console.error('ERRO:', erro.message);
  process.exit(1);
}
