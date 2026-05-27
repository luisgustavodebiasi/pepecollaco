import { supabase } from './supabase.js'

const WEBHOOK_BOAS_VINDAS = import.meta.env.VITE_N8N_WEBHOOK_BOAS_VINDAS

// ── Leitura ─────────────────────────────────────────────────

/** Busca contato pelo telefone normalizado. Retorna objeto ou null. */
export async function buscarContato(telefoneNormalizado) {
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .eq('telefone_normalizado', telefoneNormalizado)
    .maybeSingle()

  if (error) throw error
  return data
}

// ── Escrita ─────────────────────────────────────────────────

/**
 * Salva ou atualiza contato via upsert (chave: telefone_normalizado).
 * Remove campos internos com _ antes de salvar.
 */
export async function salvarOuAtualizarContato(dados) {
  // eslint-disable-next-line no-unused-vars
  const { _statusContato, ...dadosLimpos } = dados

  const { data, error } = await supabase
    .from('contatos')
    .upsert(dadosLimpos, { onConflict: 'telefone_normalizado' })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Confirma presença: salva no Supabase e notifica n8n.
 * Retorna { contato, n8nOk, n8nErro }.
 * Nunca lança se só o n8n falhar.
 */
export async function confirmarPresenca(dadosContato, statusContato = 'existente') {
  const agora = new Date().toISOString()

  const contato = await salvarOuAtualizarContato({
    ...dadosContato,
    confirmado_evento: true,
    confirmado_em:     agora,
    origem:            dadosContato.origem || 'credenciamento_evento',
  })

  let n8nOk   = false
  let n8nErro = null

  try {
    await notificarN8n({
      tipo:                 'boas_vindas',
      evento:               dadosContato.nome_evento  || dadosContato.cidade_evento || '',
      cidade_evento:        dadosContato.cidade_evento || '',
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
 * Lança erro se falhar (capturado em confirmarPresenca).
 */
export async function notificarN8n(payload) {
  if (!WEBHOOK_BOAS_VINDAS) return

  const ctrl    = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 8000)

  try {
    const res = await fetch(WEBHOOK_BOAS_VINDAS, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  ctrl.signal,
    })
    if (!res.ok) throw new Error(`Webhook retornou HTTP ${res.status}`)
  } finally {
    clearTimeout(timeout)
  }
}

// ── Relatórios (usados pelo admin) ──────────────────────────

/** Retorna confirmados recentes, limite configurável. */
export async function listarRecentes(limit = 15) {
  const { data, error } = await supabase
    .from('contatos')
    .select('id, nome, cargo, cidade, cidade_evento, nome_evento, confirmado_em, boas_vindas_enviada, agradecimento_enviado')
    .eq('confirmado_evento', true)
    .order('confirmado_em', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/** Retorna todos os confirmados ordenados por confirmado_em desc. */
export async function listarConfirmados() {
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .eq('confirmado_evento', true)
    .order('confirmado_em', { ascending: false })

  if (error) throw error
  return data ?? []
}

/** Retorna resumo do evento via view ou contagens diretas. */
export async function obterResumoEvento() {
  const { data, error } = await supabase
    .from('v_resumo_evento')
    .select('*')
    .single()

  if (!error && data) {
    return {
      ...data,
      agradecimentos_pendentes: Math.max(
        0,
        (data.total_confirmados || 0) - (data.agradecimentos_enviados || 0)
      ),
    }
  }

  // Fallback: contagens diretas se a view não existir
  const [
    { count: total },
    { count: confirmados },
    { count: boasVindas },
    { count: agradecimentos },
  ] = await Promise.all([
    supabase.from('contatos').select('*', { count: 'exact', head: true }),
    supabase.from('contatos').select('*', { count: 'exact', head: true }).eq('confirmado_evento', true),
    supabase.from('contatos').select('*', { count: 'exact', head: true }).eq('boas_vindas_enviada', true),
    supabase.from('contatos').select('*', { count: 'exact', head: true }).eq('agradecimento_enviado', true),
  ])

  return {
    total_contatos:          total          ?? 0,
    total_confirmados:       confirmados    ?? 0,
    boas_vindas_enviadas:    boasVindas     ?? 0,
    agradecimentos_enviados: agradecimentos ?? 0,
    agradecimentos_pendentes: Math.max(0, (confirmados ?? 0) - (agradecimentos ?? 0)),
  }
}

/**
 * Busca contatos por nome/telefone com filtro opcional por cidade_evento.
 * Usado na tabela do admin.
 */
export async function buscarContatos({ busca = '', cidadeEvento = '', apenasConfirmados = false, limit = 200 } = {}) {
  let query = supabase
    .from('contatos')
    .select('id, telefone_normalizado, nome, cargo, cidade, cidade_evento, confirmado_evento, confirmado_em, boas_vindas_enviada, agradecimento_enviado')
    .order('confirmado_em', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (apenasConfirmados) query = query.eq('confirmado_evento', true)
  if (cidadeEvento)      query = query.eq('cidade_evento', cidadeEvento)
  if (busca)             query = query.or(`nome.ilike.%${busca}%,telefone_normalizado.ilike.%${busca}%`)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

/** Contador rápido de confirmados (para o banner do topo). */
export async function contarConfirmados() {
  const { count, error } = await supabase
    .from('contatos')
    .select('*', { count: 'exact', head: true })
    .eq('confirmado_evento', true)

  if (error) return null
  return count
}
