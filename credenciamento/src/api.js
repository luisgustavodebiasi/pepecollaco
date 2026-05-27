import { supabase } from './supabase.js'

const WEBHOOK_BOAS_VINDAS = import.meta.env.VITE_N8N_WEBHOOK_BOAS_VINDAS
const WEBHOOK_SECRET      = import.meta.env.VITE_WEBHOOK_SECRET

// ── Leitura ─────────────────────────────────────────────────

/** Busca contato via RPC (evita SELECT direto na tabela). */
export async function buscarContato(telefoneNormalizado) {
  const { data, error } = await supabase
    .rpc('buscar_contato_por_telefone', { p_telefone: telefoneNormalizado })

  if (error) throw error
  return Array.isArray(data) ? (data[0] ?? null) : (data ?? null)
}

// ── Escrita ─────────────────────────────────────────────────

/**
 * Confirma presença via RPC server-side e notifica n8n.
 * Retorna { contato, n8nOk, n8nErro }.
 * Nunca lança se só o n8n falhar.
 */
export async function confirmarPresenca(dadosContato, statusContato = 'existente') {
  // Campos internos não vão para o banco
  // eslint-disable-next-line no-unused-vars
  const { _statusContato, confirmado_evento, confirmado_em, boas_vindas_enviada,
          agradecimento_enviado, boas_vindas_enviada_em, agradecimento_enviado_em,
          created_at, updated_at, id, ...dadosLimpos } = dadosContato

  const { data, error } = await supabase
    .rpc('confirmar_presenca_evento', { p_dados: dadosLimpos })

  if (error) throw error

  const contato = Array.isArray(data) ? (data[0] ?? null) : (data ?? null)
  if (!contato) throw new Error('Upsert não retornou dados')

  let n8nOk   = false
  let n8nErro = null

  try {
    await notificarN8n({
      tipo:                 'boas_vindas',
      evento:               contato.nome_evento   || contato.cidade_evento || '',
      cidade_evento:        contato.cidade_evento || '',
      status_contato:       statusContato,
      telefone_normalizado: contato.telefone_normalizado,
      telefone_original:    contato.telefone_original  || '',
      nome:                 contato.nome,
      cargo:                contato.cargo               || '',
      cidade:               contato.cidade              || '',
      partido:              contato.partido             || '',
      observacoes:          contato.observacoes         || '',
      confirmado_evento:    true,
      confirmado_em:        contato.confirmado_em,
      origem:               contato.origem              || 'credenciamento_evento',
    })
    n8nOk = true
  } catch (err) {
    n8nErro = err
    console.warn('Webhook n8n falhou:', err)
  }

  return { contato, n8nOk, n8nErro }
}

/**
 * Envia payload ao webhook n8n com timeout de 8s.
 * Adiciona header de autenticação se VITE_WEBHOOK_SECRET estiver definido.
 * Lança erro se falhar (capturado em confirmarPresenca).
 */
export async function notificarN8n(payload) {
  if (!WEBHOOK_BOAS_VINDAS) return

  const ctrl    = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 8000)

  const headers = { 'Content-Type': 'application/json' }
  if (WEBHOOK_SECRET) headers['Authorization'] = `Bearer ${WEBHOOK_SECRET}`

  try {
    const res = await fetch(WEBHOOK_BOAS_VINDAS, {
      method:  'POST',
      headers,
      body:    JSON.stringify(payload),
      signal:  ctrl.signal,
    })
    if (!res.ok) throw new Error(`Webhook retornou HTTP ${res.status}`)
  } finally {
    clearTimeout(timeout)
  }
}

// ── Relatórios (usados pelo admin) ──────────────────────────

/** Retorna confirmados recentes via RPC. */
export async function listarRecentes(limit = 15) {
  const { data, error } = await supabase
    .rpc('listar_confirmados_recentes', { p_limit: limit })

  if (error) throw error
  return data ?? []
}

/** Retorna resumo do evento via RPC. */
export async function obterResumoEvento() {
  const { data, error } = await supabase.rpc('resumo_evento')

  if (!error && data) {
    const d = Array.isArray(data) ? data[0] : data
    return {
      ...d,
      agradecimentos_pendentes: Math.max(
        0,
        (d.total_confirmados || 0) - (d.agradecimentos_enviados || 0)
      ),
    }
  }
  return {
    total_contatos: 0, total_confirmados: 0,
    boas_vindas_enviadas: 0, agradecimentos_enviados: 0,
    agradecimentos_pendentes: 0,
  }
}

/**
 * Busca contatos via RPC (elimina injeção no .or() do PostgREST).
 * Usado na tabela do admin.
 */
export async function buscarContatos({ busca = '', limit = 200 } = {}) {
  const { data, error } = await supabase
    .rpc('listar_contatos_admin', {
      p_busca: busca,
      p_limit: limit,
    })

  if (error) throw error
  return data ?? []
}

/** Contador rápido de confirmados (para o banner do topo). */
export async function contarConfirmados() {
  const { data, error } = await supabase.rpc('contar_confirmados')
  if (error) return null
  return typeof data === 'number' ? data : (Array.isArray(data) ? data[0] : null)
}
