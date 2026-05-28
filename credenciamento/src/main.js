import { normalizarTelefone, formatarTelefone } from './telefone.js'
import { buscarContato, confirmarPresenca, contarConfirmados } from './api.js'

// ── Escape de HTML (previne XSS com dados do banco) ───────────
function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ── Eventos disponíveis ────────────────────────────────────────
// Adicione mais objetos { nome, cidade } para múltiplos eventos no dia
const EVENTOS = [
  { nome: import.meta.env.VITE_NOME_EVENTO || 'Encontro Pepê Collaço 2026', cidade: '' },
]

// ── Elementos ──────────────────────────────────────────────────
const selectEvento      = document.getElementById('selectEvento')
const inputTelefone     = document.getElementById('inputTelefone')
const btnConsultar      = document.getElementById('btnConsultar')
const alertaBusca       = document.getElementById('alertaBusca')

const cardEncontrado    = document.getElementById('cardEncontrado')
const avisoJaConfirmado = document.getElementById('avisoJaConfirmado')
const dadosContatoEl    = document.getElementById('dadosContato')
const formEdicao        = document.getElementById('formEdicao')
const btnEditar         = document.getElementById('btnEditar')
const btnConfirmar      = document.getElementById('btnConfirmar')

const cardNovo          = document.getElementById('cardNovo')
const novoNome          = document.getElementById('novoNome')
const novoTelDisplay    = document.getElementById('novoTelDisplay')
const btnCancelarNovo   = document.getElementById('btnCancelarNovo')
const btnSalvarNovo     = document.getElementById('btnSalvarNovo')

const cardSucesso       = document.getElementById('cardSucesso')
const sucessoNome       = document.getElementById('sucessoNome')
const sucessoInfo       = document.getElementById('sucessoInfo')
const avisoN8n          = document.getElementById('avisoN8n')
const btnCadastrarOutro = document.getElementById('btnCadastrarOutro')

const counterNum        = document.getElementById('counterNum')
const subtituloHeader   = document.getElementById('subtituloHeader')

// ── Estado da sessão ───────────────────────────────────────────
let contatoAtual   = null
let telNormalizado = null
let telOriginal    = null
let eventoAtual    = null

// ── State machine ──────────────────────────────────────────────
function setState(estado) {
  cardEncontrado.classList.add('hidden')
  cardNovo.classList.add('hidden')
  cardSucesso.classList.add('hidden')
  alertaBusca.classList.add('hidden')
  avisoJaConfirmado.classList.add('hidden')
  avisoN8n.classList.add('hidden')
  formEdicao.classList.add('hidden')

  switch (estado) {
    case 'inicial':
      inputTelefone.value = ''
      btnConsultar.disabled = false
      btnConsultar.innerHTML = 'Consultar'
      btnEditar.innerHTML = '✏️ Editar Dados'
      contatoAtual   = null
      telNormalizado = null
      telOriginal    = null
      break

    case 'consultando':
      btnConsultar.disabled = true
      btnConsultar.innerHTML = '<span class="spinner"></span>'
      break

    case 'encontrado':
      cardEncontrado.classList.remove('hidden')
      btnConsultar.disabled = false
      btnConsultar.innerHTML = 'Consultar'
      btnConfirmar.disabled = false
      btnConfirmar.innerHTML = '✅ Confirmar Presença'
      break

    case 'novo':
      cardNovo.classList.remove('hidden')
      btnConsultar.disabled = false
      btnConsultar.innerHTML = 'Consultar'
      novoTelDisplay.value = formatarTelefone(telNormalizado)
      novoNome.value = ''
      document.getElementById('novoCargo').value   = ''
      document.getElementById('novoPartido').value = ''
      document.getElementById('novoCidade').value  = ''
      document.getElementById('novoObs').value     = ''
      btnSalvarNovo.disabled = false
      btnSalvarNovo.innerHTML = '✅ Salvar e Confirmar Presença'
      setTimeout(() => novoNome.focus(), 50)
      break

    case 'salvando':
      btnConfirmar.disabled = true
      btnConfirmar.innerHTML = '<span class="spinner"></span> Confirmando...'
      btnSalvarNovo.disabled = true
      btnSalvarNovo.innerHTML = '<span class="spinner"></span> Salvando...'
      break

    case 'sucesso':
      cardSucesso.classList.remove('hidden')
      if (typeof window.launchConfetti === 'function') window.launchConfetti()
      break
  }
}

// ── Inicialização ──────────────────────────────────────────────
function init() {
  popularEventos()
  restaurarEvento()
  atualizarContador()
  setState('inicial')
}

// ── Seletor de evento ──────────────────────────────────────────
function popularEventos() {
  EVENTOS.forEach((ev, i) => {
    const opt = document.createElement('option')
    opt.value = String(i)
    opt.textContent = ev.nome
    selectEvento.appendChild(opt)
  })

  if (EVENTOS.length === 1) {
    selectEvento.value = '0'
    eventoAtual = EVENTOS[0]
    sessionStorage.setItem('credenciamento_evento_idx', '0')
  }
}

function restaurarEvento() {
  const idx = sessionStorage.getItem('credenciamento_evento_idx')
  if (idx !== null && EVENTOS[+idx]) {
    selectEvento.value = idx
    eventoAtual = EVENTOS[+idx]
  }
  atualizarSubtitulo()
}

selectEvento.addEventListener('change', () => {
  const idx = selectEvento.value
  if (idx !== '' && EVENTOS[+idx]) {
    sessionStorage.setItem('credenciamento_evento_idx', idx)
    eventoAtual = EVENTOS[+idx]
  } else {
    sessionStorage.removeItem('credenciamento_evento_idx')
    eventoAtual = null
  }
  atualizarSubtitulo()
  setState('inicial')
})

function atualizarSubtitulo() {
  if (!subtituloHeader) return
  subtituloHeader.textContent = eventoAtual
    ? `Credenciamento — ${eventoAtual.nome}`
    : 'Selecione o evento e consulte pelo WhatsApp'
}

// ── Contador ───────────────────────────────────────────────────
async function atualizarContador() {
  const n = await contarConfirmados()
  counterNum.textContent = n !== null ? n : '—'
}

// ── Alerta ─────────────────────────────────────────────────────
function mostrarAlerta(msg, tipo = 'info') {
  alertaBusca.className = `alert alert-${tipo}`
  alertaBusca.textContent = msg
  alertaBusca.classList.remove('hidden')
}

// ── Render contato ─────────────────────────────────────────────
function dado(label, valor) {
  const v = esc(valor).trim()
  return `<div class="dado">
    <div class="dado-label">${label}</div>
    <div class="dado-valor${!v ? ' empty' : ''}">${v || 'Não informado'}</div>
  </div>`
}

function renderContato(c) {
  dadosContatoEl.innerHTML =
    dado('Nome',        c.nome) +
    dado('Telefone',    formatarTelefone(c.telefone_normalizado)) +
    dado('Cargo',       c.cargo) +
    dado('Partido',     c.partido) +
    dado('Cidade',      c.cidade) +
    dado('Observações', c.observacoes)
}

function preencherFormEdicao(c) {
  document.getElementById('editNome').value    = c.nome        || ''
  document.getElementById('editCargo').value   = c.cargo       || ''
  document.getElementById('editPartido').value = c.partido     || ''
  document.getElementById('editCidade').value  = c.cidade      || ''
  document.getElementById('editObs').value     = c.observacoes || ''
}

function coletarEdicao() {
  return {
    nome:        document.getElementById('editNome').value.trim(),
    cargo:       document.getElementById('editCargo').value.trim(),
    partido:     document.getElementById('editPartido').value.trim(),
    cidade:      document.getElementById('editCidade').value.trim(),
    observacoes: document.getElementById('editObs').value.trim(),
  }
}

function montarInfoSucesso(c) {
  const cargo   = esc(c.cargo)
  const cidade  = esc(c.cidade)
  const partido = esc(c.partido)
  const nomeEv  = esc(eventoAtual?.nome)
  return [
    cargo  && `<div class="sucesso-info-item">💼 ${cargo}</div>`,
    cidade && `<div class="sucesso-info-item">📍 ${cidade}${partido ? ` — ${partido}` : ''}</div>`,
    nomeEv && `<div class="sucesso-info-item">🗓️ ${nomeEv}</div>`,
  ].filter(Boolean).join('')
}

// ── BUSCA ──────────────────────────────────────────────────────
async function executarBusca() {
  if (!eventoAtual) {
    mostrarAlerta('⚠️ Selecione o evento antes de consultar.', 'warning')
    selectEvento.focus()
    return
  }

  const rawTel = inputTelefone.value.trim()
  if (!rawTel) {
    mostrarAlerta('⚠️ Digite um número de WhatsApp.', 'warning')
    inputTelefone.focus()
    return
  }

  telOriginal    = rawTel
  telNormalizado = normalizarTelefone(rawTel)

  if (!telNormalizado) {
    mostrarAlerta('❌ Telefone inválido. Inclua o DDD e ao menos 8 dígitos (ex: 48 99999-9999).', 'error')
    return
  }

  setState('consultando')

  try {
    const contato = await buscarContato(telNormalizado)

    if (contato) {
      contatoAtual = contato
      setState('encontrado')
      renderContato(contato)

      if (contato.confirmado_evento) {
        const dt = contato.confirmado_em
          ? new Date(contato.confirmado_em).toLocaleString('pt-BR')
          : ''
        avisoJaConfirmado.classList.remove('hidden')
        avisoJaConfirmado.querySelector('span').textContent =
          `Este contato já teve presença confirmada${dt ? ` em ${dt}` : ''}. Você pode atualizar os dados e confirmar novamente.`
      }
    } else {
      setState('novo')
    }
  } catch (err) {
    setState('inicial')
    mostrarAlerta(`❌ Erro ao consultar: ${err.message}`, 'error')
  }
}

btnConsultar.addEventListener('click', executarBusca)
inputTelefone.addEventListener('keydown', e => { if (e.key === 'Enter') executarBusca() })

// ── EDITAR (toggle) ────────────────────────────────────────────
btnEditar.addEventListener('click', () => {
  if (formEdicao.classList.contains('hidden')) {
    preencherFormEdicao(contatoAtual || {})
    formEdicao.classList.remove('hidden')
    btnEditar.innerHTML = '✕ Cancelar Edição'
  } else {
    formEdicao.classList.add('hidden')
    btnEditar.innerHTML = '✏️ Editar Dados'
  }
})

// ── CONFIRMAR presença (contato existente) ─────────────────────
btnConfirmar.addEventListener('click', async () => {
  if (!telNormalizado || !eventoAtual) return

  const editando = !formEdicao.classList.contains('hidden')
  let dadosExtra = {}

  if (editando) {
    const campos = coletarEdicao()
    if (!campos.nome) {
      mostrarAlerta('⚠️ O campo Nome é obrigatório.', 'warning')
      return
    }
    dadosExtra = campos
  }

  setState('salvando')
  cardEncontrado.classList.remove('hidden')

  const payload = {
    ...(contatoAtual || {}),
    ...dadosExtra,
    telefone_normalizado: telNormalizado,
    telefone_original:    contatoAtual?.telefone_original || telOriginal,
    nome_evento:          eventoAtual.nome,
    cidade_evento:        eventoAtual.cidade || '',
    origem:               contatoAtual?.origem || 'credenciamento_evento',
  }

  try {
    const { contato, n8nOk } = await confirmarPresenca(payload, 'existente')
    atualizarContador()
    setState('sucesso')
    sucessoNome.textContent = contato.nome
    sucessoInfo.innerHTML   = montarInfoSucesso(contato)
    if (!n8nOk) avisoN8n.classList.remove('hidden')
  } catch (err) {
    setState('encontrado')
    renderContato(contatoAtual)
    mostrarAlerta(`❌ Erro ao confirmar: ${err.message}`, 'error')
  }
})

// ── CANCELAR novo cadastro ─────────────────────────────────────
btnCancelarNovo.addEventListener('click', () => setState('inicial'))

// ── SALVAR novo cadastro ───────────────────────────────────────
btnSalvarNovo.addEventListener('click', async () => {
  const nome = novoNome.value.trim()
  if (!nome) {
    novoNome.focus()
    mostrarAlerta('⚠️ O campo Nome é obrigatório.', 'warning')
    return
  }
  if (!telNormalizado || !eventoAtual) return

  setState('salvando')
  cardNovo.classList.remove('hidden')

  const payload = {
    telefone_normalizado: telNormalizado,
    telefone_original:    telOriginal,
    nome,
    cargo:       document.getElementById('novoCargo').value.trim(),
    partido:     document.getElementById('novoPartido').value.trim(),
    cidade:      document.getElementById('novoCidade').value.trim(),
    observacoes: document.getElementById('novoObs').value.trim(),
    nome_evento:   eventoAtual.nome,
    cidade_evento: eventoAtual.cidade || '',
    origem:        'credenciamento_evento',
  }

  try {
    const { contato, n8nOk } = await confirmarPresenca(payload, 'novo')
    atualizarContador()
    setState('sucesso')
    sucessoNome.textContent = contato.nome
    sucessoInfo.innerHTML   = montarInfoSucesso(contato)
    if (!n8nOk) avisoN8n.classList.remove('hidden')
  } catch (err) {
    setState('novo')
    mostrarAlerta(`❌ Erro ao cadastrar: ${err.message}`, 'error')
  }
})

// ── CADASTRAR OUTRO ────────────────────────────────────────────
btnCadastrarOutro.addEventListener('click', () => {
  setState('inicial')
  inputTelefone.focus()
})

// ── Start ──────────────────────────────────────────────────────
init()
