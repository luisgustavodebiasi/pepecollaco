/**
 * Baixar um texto gerado no navegador. Nada disso passa por servidor.
 *
 * A chamada tem de ser SÍNCRONA dentro do handler do toque: com um await antes
 * do click(), o Safari trata o download como popup e bloqueia sem avisar.
 *
 * No iPhone o Safari não salva blob: numa pasta como o Chrome. Ele abre a
 * folha "Abrir com", que oferece Calendário e Contatos, que é justamente o que
 * se quer aqui. Quando nem isso acontece, o texto do lembrete continua escrito
 * na tela logo abaixo dos botões, então a falha é inofensiva.
 */
export function baixarTexto(conteudo: string, nome: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revogar na hora quebra no Safari, que ainda não terminou de ler o blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
