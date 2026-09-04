/**
 * Completa bairro e CEP das ruas pendentes consultando a base dos Correios
 * através da API pública ViaCEP.
 *
 * Uso:  node completar-ceps.mjs
 *
 * Lê  ruas.json  →  grava  ruas.json  e  dados.js  atualizados.
 * Roda devagar de propósito (600 ms entre chamadas): o ViaCEP bloqueia
 * IPs que fazem acesso massivo.
 */

import { readFile, writeFile } from "node:fs/promises";

const UF = "SC";
const CIDADE = "Tubarao";
const PAUSA_MS = 600;

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

const semAcento = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Remove o tipo do logradouro e as abreviações de nome ("J.", "B.") */
function termos(nome) {
  const limpo = nome
    .replace(/^(R\.|Rua|Av\.|Avenida|Tv\.|Travessa|Beco|Rod\.|Rodovia)\s+/i, "")
    .replace(/\b[A-ZÀ-Ú]\.\s*/g, " ")      // iniciais soltas
    .replace(/\s+/g, " ")
    .trim();
  const p = limpo.split(" ").filter((w) => w.length > 2);
  const tentativas = [limpo];
  if (p.length >= 2) tentativas.push(p.slice(0, 2).join(" "));
  if (p.length >= 1) tentativas.push(p[p.length - 1]);
  if (p.length >= 1) tentativas.push(p[0]);
  return [...new Set(tentativas)].filter((t) => t.length >= 3);
}

/** Quantas palavras da arte aparecem no logradouro devolvido */
function pontuar(nomeArte, logradouro) {
  const a = new Set(semAcento(nomeArte).split(/\W+/).filter((w) => w.length > 2));
  const b = new Set(semAcento(logradouro).split(/\W+/).filter((w) => w.length > 2));
  let iguais = 0;
  for (const w of a) if (b.has(w)) iguais++;
  return a.size ? iguais / a.size : 0;
}

async function buscar(termo) {
  const url = `https://viacep.com.br/ws/${UF}/${CIDADE}/${encodeURIComponent(termo)}/json/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} em "${termo}"`);
  const json = await res.json();
  return Array.isArray(json) ? json : [];
}

const arquivo = JSON.parse(await readFile("ruas.json", "utf8"));
let achadas = 0;
let ambiguas = 0;

for (const rua of arquivo.ruas) {
  if (rua.cep) continue;

  let melhor = null;
  let melhorNota = 0;
  let empate = false;

  for (const termo of termos(rua.nome_arte)) {
    let resultados = [];
    try {
      resultados = await buscar(termo);
    } catch (e) {
      console.warn(`  ! ${rua.nome_arte}: ${e.message}`);
    }
    await dorme(PAUSA_MS);

    for (const r of resultados) {
      const nota = pontuar(rua.nome_arte, r.logradouro || "");
      if (nota > melhorNota) {
        melhor = r;
        melhorNota = nota;
        empate = false;
      } else if (nota === melhorNota && melhor && r.cep !== melhor.cep) {
        empate = true;
      }
    }
    if (melhorNota === 1) break; // achou tudo, não precisa dos fallbacks
  }

  if (melhor && melhorNota >= 0.6) {
    rua.nome_oficial = melhor.logradouro;
    rua.bairro = melhor.bairro || null;
    rua.cep = melhor.cep;
    rua.status = melhorNota === 1 && !empate ? "confirmado" : "provavel";
    if (empate) {
      rua.obs = [rua.obs, "A via tem mais de um CEP; conferir o trecho."]
        .filter(Boolean).join(" ");
      ambiguas++;
    }
    achadas++;
    console.log(`✓ ${rua.nome_arte} → ${melhor.logradouro} · ${melhor.bairro} · ${melhor.cep}`);
  } else {
    console.log(`· ${rua.nome_arte} → sem correspondência`);
  }
}

arquivo.atualizado_em = new Date().toISOString().slice(0, 10);
await writeFile("ruas.json", JSON.stringify(arquivo, null, 2) + "\n", "utf8");
await writeFile(
  "dados.js",
  "window.RUAS = " + JSON.stringify(arquivo.ruas, null, 2) + ";\n",
  "utf8"
);

console.log(
  `\n${achadas} ruas completadas, ${ambiguas} com mais de um trecho. ` +
  `Arquivos ruas.json e dados.js atualizados.`
);
