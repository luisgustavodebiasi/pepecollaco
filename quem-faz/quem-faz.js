/* ══════════════════════════════════════════════════════════════════════════
   QUEM FAZ, movimento das páginas de resposta rápida

   Quatro coisas, nesta ordem:

     1. entrada do hero, no carregamento, escalonada
     2. revelação de cada seção quando ela entra na tela
     3. cascata dentro das grades: card a card, não tudo de uma vez
     4. contagem dos números grandes, de zero até o valor

   Tudo isso é enfeite, e enfeite não pode quebrar a página. Se a pessoa pediu
   menos movimento no sistema, o arquivo entrega tudo visível e sai de cena. O
   CSS só esconde quando existe a classe .js no <html>, então um erro aqui não
   deixa a página em branco.

   A revelação é feita por varredura, e não por IntersectionObserver, de
   propósito: o observer só avisa sobre o que atravessa a borda da tela, então
   quem pula direto para o meio da página (âncora, botão "ver o que foi
   feito", restauração de scroll ao voltar) deixaria para trás blocos que
   nunca mais apareceriam. A varredura olha a posição real e revela tudo que
   já passou. Ela roda presa a um requestAnimationFrame, uma vez por quadro no
   máximo, e se desliga sozinha quando não sobra nada para revelar.

   Carregado com defer pelas seis páginas. Não depende de nada.
   ══════════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const raiz = document.documentElement;

  /* As grades que ganham cascata. Elas perdem o .rv: quem anima é cada filho,
     e manter os dois faria a seção desaparecer duas vezes. */
  const GRADES = '.placar, .obras, .chips, .portas, .pautas, .leis, .imprensa, .redes';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    raiz.classList.remove('js');          // devolve tudo visível e parado
    return;
  }

  /* ── 1. Hero ────────────────────────────────────────────────────────────
     Não espera scroll: acontece no carregamento, escalonado de 90 em 90 ms,
     na ordem em que a pessoa lê. O retrato tem animação própria no CSS. */
  const hero = document.querySelector('.hero-grade > :first-child');
  if (hero) {
    [...hero.children].forEach((e, i) => {
      e.classList.add('entra');
      e.style.setProperty('--atraso', (i * 0.09).toFixed(2) + 's');
    });
  }

  /* ── 2 e 3. Quem é revelado ─────────────────────────────────────────────*/
  document.querySelectorAll(GRADES).forEach((grade) => {
    grade.classList.remove('rv');
    grade.classList.add('cascata');
    [...grade.children].forEach((filho, i) => {
      /* teto em 10 para a lista de ruas, que tem dezenas de chips: passar
         disso vira espera, não animação */
      filho.style.setProperty('--atraso', (Math.min(i, 10) * 0.06).toFixed(2) + 's');
    });
  });

  let pendentes = [...document.querySelectorAll('.rv, .cascata')];

  /* ── 4. Contagem ────────────────────────────────────────────────────────
     Vale para a cifra do hero e para as células do placar. O número é
     encontrado no texto, isolado num <span> e animado dali; o "R$", o "+" e
     a unidade ficam parados, porque só o valor precisa subir.

     A curva é de saída: começa rápido e freia no fim, senão o número parece
     travar antes de chegar. */
  const CURVA = (t) => 1 - Math.pow(1 - t, 4);
  const DURACAO = 1100;
  const numeros = new Map();

  function preparar(elemento) {
    for (const no of [...elemento.childNodes]) {
      if (no.nodeType !== Node.TEXT_NODE) continue;
      const achado = no.nodeValue.match(/\d[\d.]*(?:,\d+)?/);
      if (!achado) continue;

      const bruto = achado[0];
      const casas = (bruto.split(',')[1] || '').length;
      const valor = parseFloat(bruto.replace(/\./g, '').replace(',', '.'));
      if (!isFinite(valor)) continue;

      const alvo = document.createElement('span');
      alvo.className = 'contando';
      alvo.textContent = bruto;

      const antes = no.nodeValue.slice(0, achado.index);
      const depois = no.nodeValue.slice(achado.index + bruto.length);
      no.replaceWith(document.createTextNode(antes), alvo, document.createTextNode(depois));

      numeros.set(elemento, { alvo, valor, casas });
      return;
    }
  }

  document.querySelectorAll('.manchete .cifra, .placar b').forEach(preparar);

  function formatar(v, casas) {
    return v.toLocaleString('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });
  }

  function contar(elemento) {
    const dado = numeros.get(elemento);
    if (!dado || dado.rodou) return;
    dado.rodou = true;
    const inicio = performance.now();

    const passo = (agora) => {
      const t = Math.min((agora - inicio) / DURACAO, 1);
      dado.alvo.textContent = formatar(dado.valor * CURVA(t), dado.casas);
      if (t < 1) requestAnimationFrame(passo);
      else dado.alvo.classList.remove('contando');   // devolve o algarismo proporcional
    };
    requestAnimationFrame(passo);
  }

  /* ── A varredura ────────────────────────────────────────────────────────*/
  function revelar(elemento) {
    elemento.classList.add('dentro');
    if (numeros.has(elemento)) contar(elemento);
    elemento.querySelectorAll('.cifra, b').forEach((n) => {
      if (numeros.has(n)) contar(n);
    });
  }

  function varrer() {
    const limite = window.innerHeight * 0.92;
    const restam = [];
    for (const e of pendentes) {
      if (e.getBoundingClientRect().top < limite) revelar(e);
      else restam.push(e);
    }
    pendentes = restam;
    if (!pendentes.length) {
      window.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', agendar);
    }
  }

  let agendado = false;
  function agendar() {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => { agendado = false; varrer(); });
  }

  window.addEventListener('scroll', agendar, { passive: true });
  window.addEventListener('resize', agendar);
  varrer();

  /* A cifra do hero não é revelada pela varredura: ela entra junto com o
     hero, por animação de CSS. Só a contagem precisa ser disparada, depois
     que o bloco terminou de subir. */
  const cifra = document.querySelector('.manchete .cifra');
  if (cifra) setTimeout(() => contar(cifra), 420);
})();
