# Guia de Nomenclatura de Impulsionamentos

Padrão único de nomes para campanhas, conjuntos e anúncios da conta do Pepê (`1700449990528437`). Objetivo: nomes consistentes permitem filtrar e somar por tema, geografia, plataforma e período nos relatórios.

Regra de escrita: sem travessão. Usar barra vertical ` | ` como separador de blocos e hífen simples dentro de um bloco.

---

## 1. Padrão por nível

### Campanha
```
CAMP | AAAA | EIXO/TEMA | OBJETIVO | GEO
```
Exemplo: `CAMP | 2026 | Autismo | Engajamento | SC`

### Conjunto de anúncios
```
CONJ | PUBLICO | GEO | PLATAFORMA | Rvalor
```
Exemplo: `CONJ | Interesse-Autismo | SC | Instagram | R50`

### Anúncio
```
AD | tema-do-post | FORMATO | AAAA-MM-DD
```
Exemplo: `AD | equoterapia-laguna | Reels | 2026-07-16`

---

## 2. Dicionário de blocos

**OBJETIVO** (usar o rótulo, não o código da API):
`Reconhecimento` · `Trafego` · `Engajamento` · `Video` · `Leads` · `Mensagens`

**EIXO/TEMA** (alinhar com as bandeiras do mandato):
`Autismo` · `Saude` · `Infraestrutura` · `Educacao` · `Seguranca` · `Rural` · `Entidades` · `Institucional` · `Atualidades`

**GEO** (ver `publicos/biblioteca_geografica.md`):
`Tubarao` · `AMUREL` · `Sul-SC` · `SC` · `Brasil`

**PLATAFORMA:**
`Instagram` · `Facebook` · `Insta-Face` · `Reels` · `Feed` · `Stories`

**FORMATO:**
`Reels` · `Feed` · `Story` · `Carrossel` · `Video` · `Imagem`

**Rvalor:** verba do impulso sem centavos. Ex.: `R30`, `R50`, `R100`.

---

## 3. Antes e depois (exemplos reais da conta)

| Como está hoje | Como fica no padrão |
|---|---|
| `SERÁ?[view][INSTAGRAN][R$100,0 0 30/03/2026` | `AD | sera-gancho | Feed | 2026-03-30` |
| `tubarão[view][INSTAGRAN][R$150,00 16/1/2026` | `AD | tubarao-institucional | Feed | 2026-01-16` |
| `AUTISMO - [ENGAJAMENTO] - INSTAGRAN R$120,00` | `AD | autismo-engajamento | Feed | 2026-XX-XX` |
| `CAPIVARI DE BAIXO obras[view][INSTAGRAN][R$50,00 15/12/2025` | `AD | capivari-obras | Feed | 2025-12-15` |

---

## 4. Renomeação das campanhas (APLICADA em 16/07/2026 via MCP)

> As 7 campanhas ativas/pausadas foram renomeadas via `ads_update_entity`. Nenhuma teve a entrega ou o status alterado (`status_forced_to_paused: false` em todas, inclusive na ativa). As 2 excluídas mantiveram o nome.

| ID | Nome anterior | Nome atual | Situação |
|---|---|---|---|
| 120216242475770716 | LAP-[Engajamento][view TUBARÃO] | `CAMP | 2025 | Institucional | Engajamento | Tubarao` | Pausada · feito |
| 120214284225260716 | LAP-[Engajamento][View Brasil] | `CAMP | 2024 | Institucional | Engajamento | Brasil` | Pausada · feito |
| 120240075562730716 | LAP-2026 [Engajamento SC][Insta] | `CAMP | 2026 | Institucional | Engajamento | SC` | Pausada · feito |
| 120239970345540716 | LAP-2026 [Engajamento AMUREL][Insta] | `CAMP | 2026 | Institucional | Engajamento | AMUREL` | Pausada · feito |
| 120216047481540716 | LAP-[Feed Pepê Collaço] | `CAMP | 2025 | Feed-Institucional | Engajamento | Tubarao` | Pausada · feito |
| 120242272123350716 | AUTISMO - [Santa Catarina] | `CAMP | 2026 | Autismo | Engajamento | SC` | Pausada · feito |
| 120246784137180716 | CAMP-01_CONJ-01 | `CAMP | 2026 | Institucional | Reconhecimento | SC` | Ativa · feito |
| 120213903594780716 | JFJ - [Engajamento][Video View] | mantido (campanha excluída) | Excluída |
| 120239032107950716 | PEPE [2026][Visualização][Reels] | mantido (campanha excluída) | Excluída |

Obs.: a campanha de feed (120216047481540716) recebeu o bloco `Feed-Institucional` para não colidir com a outra campanha de Tubarão de 2025.

Anúncios históricos (206) não foram renomeados em massa: baixo valor e volume alto. O padrão vale para tudo que for criado daqui pra frente.

Anúncios históricos (206) não serão renomeados em massa: baixo valor e volume alto. O padrão vale para tudo que for criado daqui pra frente.
