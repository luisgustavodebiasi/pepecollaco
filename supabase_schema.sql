-- =============================================================
-- SCHEMA — Sistema de Credenciamento de Evento
-- Execute este arquivo no SQL Editor do Supabase
-- =============================================================

-- Tabela principal de contatos
CREATE TABLE IF NOT EXISTS contatos (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telefone_normalizado  TEXT NOT NULL UNIQUE,
    telefone_original     TEXT,
    nome_original         TEXT,
    nome                  TEXT NOT NULL,
    cargo                 TEXT,
    confianca_cargo       TEXT,
    cidade                TEXT,
    partido               TEXT,
    observacoes           TEXT,
    origem                TEXT DEFAULT 'cadastro_evento',

    -- Contexto do evento presencial
    cidade_evento         TEXT,
    nome_evento           TEXT,

    -- Controle de evento
    confirmado_evento     BOOLEAN NOT NULL DEFAULT FALSE,
    confirmado_em         TIMESTAMPTZ,

    -- Controle de mensagens
    boas_vindas_enviada   BOOLEAN NOT NULL DEFAULT FALSE,
    boas_vindas_enviada_em TIMESTAMPTZ,
    agradecimento_enviado  BOOLEAN NOT NULL DEFAULT FALSE,
    agradecimento_enviado_em TIMESTAMPTZ,

    -- Auditoria
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS idx_contatos_telefone ON contatos (telefone_normalizado);
CREATE INDEX IF NOT EXISTS idx_contatos_confirmado ON contatos (confirmado_evento);
CREATE INDEX IF NOT EXISTS idx_contatos_nome ON contatos (nome);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contatos_updated_at ON contatos;
CREATE TRIGGER trg_contatos_updated_at
    BEFORE UPDATE ON contatos
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;

-- A anon key pode SELECT (busca por telefone no evento)
CREATE POLICY "Leitura pública" ON contatos
    FOR SELECT
    TO anon, authenticated
    USING (TRUE);

-- A anon key pode INSERT (novo cadastro no evento)
CREATE POLICY "Inserção pública" ON contatos
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (TRUE);

-- A anon key pode UPDATE (confirmar presença, editar dados)
CREATE POLICY "Atualização pública" ON contatos
    FOR UPDATE
    TO anon, authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- DELETE exige service_role (não exposta no frontend)
-- Sem policy de DELETE = bloqueado para anon/authenticated

-- =============================================================
-- VIEWS ÚTEIS
-- =============================================================

-- Contatos confirmados no evento (usada pelo n8n à noite)
CREATE OR REPLACE VIEW v_confirmados AS
SELECT
    id,
    telefone_normalizado,
    nome,
    cargo,
    cidade,
    partido,
    confirmado_em,
    boas_vindas_enviada,
    agradecimento_enviado
FROM contatos
WHERE confirmado_evento = TRUE
ORDER BY confirmado_em DESC;

-- Resumo do evento
CREATE OR REPLACE VIEW v_resumo_evento AS
SELECT
    COUNT(*)                                         AS total_contatos,
    COUNT(*) FILTER (WHERE confirmado_evento)        AS total_confirmados,
    COUNT(*) FILTER (WHERE boas_vindas_enviada)      AS boas_vindas_enviadas,
    COUNT(*) FILTER (WHERE agradecimento_enviado)    AS agradecimentos_enviados
FROM contatos;

-- =============================================================
-- GRANT para a anon role ver as views
-- =============================================================
GRANT SELECT ON v_confirmados TO anon, authenticated;
GRANT SELECT ON v_resumo_evento TO anon, authenticated;

-- =============================================================
-- MIGRAÇÃO — rode apenas se a tabela já existir sem as colunas
-- =============================================================
-- ALTER TABLE contatos ADD COLUMN IF NOT EXISTS cidade_evento TEXT;
-- ALTER TABLE contatos ADD COLUMN IF NOT EXISTS nome_evento   TEXT;

-- =============================================================
-- MIGRAÇÃO DE SEGURANÇA v2 — Execute no SQL Editor do Supabase
-- Substitui políticas RLS abertas por funções SECURITY DEFINER.
-- O acesso direto à tabela contatos via anon key é bloqueado.
-- Toda operação passa por RPCs com validação server-side.
-- =============================================================

-- Remoção das políticas permissivas existentes
DROP POLICY IF EXISTS "Leitura pública"    ON contatos;
DROP POLICY IF EXISTS "Inserção pública"   ON contatos;
DROP POLICY IF EXISTS "Atualização pública" ON contatos;

-- Revogar grants diretos nas views (acesso agora via rpc resumo_evento)
REVOKE SELECT ON v_confirmados    FROM anon, authenticated;
REVOKE SELECT ON v_resumo_evento  FROM anon, authenticated;

-- Sem políticas RLS = acesso direto bloqueado para anon/authenticated.
-- As funções abaixo usam SECURITY DEFINER e contornam o RLS internamente.

-- ── 1. Contador de confirmados (dado público, sem PII) ────────
CREATE OR REPLACE FUNCTION contar_confirmados()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM contatos WHERE confirmado_evento = TRUE;
$$;
GRANT EXECUTE ON FUNCTION contar_confirmados() TO anon, authenticated;

-- ── 2. Busca por telefone exato (máx 1 linha) ────────────────
CREATE OR REPLACE FUNCTION buscar_contato_por_telefone(p_telefone text)
RETURNS SETOF contatos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Aceita apenas strings de dígitos (formato normalizado 55DDNNNNNNNNN)
  IF p_telefone IS NULL OR p_telefone !~ '^\d{10,15}$' THEN
    RAISE EXCEPTION 'Formato de telefone inválido';
  END IF;
  RETURN QUERY
    SELECT * FROM contatos WHERE telefone_normalizado = p_telefone;
END;
$$;
GRANT EXECUTE ON FUNCTION buscar_contato_por_telefone(text) TO anon, authenticated;

-- ── 3. Confirmar presença (upsert com validação) ──────────────
CREATE OR REPLACE FUNCTION confirmar_presenca_evento(p_dados jsonb)
RETURNS SETOF contatos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_telefone text := trim(p_dados->>'telefone_normalizado');
  v_nome     text := trim(p_dados->>'nome');
BEGIN
  IF v_telefone IS NULL OR v_telefone !~ '^\d{10,15}$' THEN
    RAISE EXCEPTION 'Telefone inválido';
  END IF;
  IF v_nome IS NULL OR length(v_nome) < 2 OR length(v_nome) > 200 THEN
    RAISE EXCEPTION 'Nome inválido (mín 2, máx 200 caracteres)';
  END IF;

  RETURN QUERY
  INSERT INTO contatos (
    telefone_normalizado, telefone_original,
    nome, cargo, partido, cidade, observacoes,
    nome_evento, cidade_evento, origem,
    confirmado_evento, confirmado_em
  )
  VALUES (
    v_telefone,
    left(trim(p_dados->>'telefone_original'), 20),
    left(v_nome,                              200),
    left(trim(p_dados->>'cargo'),             100),
    left(trim(p_dados->>'partido'),            50),
    left(trim(p_dados->>'cidade'),            100),
    left(trim(p_dados->>'observacoes'),      1000),
    left(trim(p_dados->>'nome_evento'),       200),
    left(trim(p_dados->>'cidade_evento'),     100),
    COALESCE(NULLIF(trim(p_dados->>'origem'), ''), 'credenciamento_evento'),
    TRUE,
    NOW()
  )
  ON CONFLICT (telefone_normalizado) DO UPDATE SET
    nome          = left(EXCLUDED.nome,          200),
    cargo         = left(EXCLUDED.cargo,         100),
    partido       = left(EXCLUDED.partido,        50),
    cidade        = left(EXCLUDED.cidade,        100),
    observacoes   = left(EXCLUDED.observacoes,  1000),
    nome_evento   = left(EXCLUDED.nome_evento,   200),
    cidade_evento = left(EXCLUDED.cidade_evento, 100),
    confirmado_evento = TRUE,
    confirmado_em     = NOW()
  RETURNING *;
END;
$$;
GRANT EXECUTE ON FUNCTION confirmar_presenca_evento(jsonb) TO anon, authenticated;

-- ── 4. Resumo do evento (dashboard admin) ────────────────────
CREATE OR REPLACE FUNCTION resumo_evento()
RETURNS TABLE(
  total_contatos          bigint,
  total_confirmados       bigint,
  boas_vindas_enviadas    bigint,
  agradecimentos_enviados bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)                                       AS total_contatos,
    COUNT(*) FILTER (WHERE confirmado_evento)      AS total_confirmados,
    COUNT(*) FILTER (WHERE boas_vindas_enviada)    AS boas_vindas_enviadas,
    COUNT(*) FILTER (WHERE agradecimento_enviado)  AS agradecimentos_enviados
  FROM contatos;
$$;
GRANT EXECUTE ON FUNCTION resumo_evento() TO anon, authenticated;

-- ── 5. Recentes confirmados (dashboard admin) ─────────────────
CREATE OR REPLACE FUNCTION listar_confirmados_recentes(p_limit int DEFAULT 15)
RETURNS SETOF contatos
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM contatos
  WHERE confirmado_evento = TRUE
  ORDER BY confirmado_em DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 50);
$$;
GRANT EXECUTE ON FUNCTION listar_confirmados_recentes(int) TO anon, authenticated;

-- ── 6. Listagem para admin com busca segura ───────────────────
-- NOTA DE SEGURANÇA: esta função ainda é acessível via anon key.
-- Para isolamento total do painel admin, implemente Supabase Auth
-- e troque o GRANT para authenticated apenas.
CREATE OR REPLACE FUNCTION listar_contatos_admin(
  p_busca text DEFAULT '',
  p_limit int  DEFAULT 200
)
RETURNS SETOF contatos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_busca text := left(trim(p_busca), 100);
  v_limit int  := LEAST(GREATEST(p_limit, 1), 500);
BEGIN
  IF v_busca = '' THEN
    RETURN QUERY
      SELECT * FROM contatos
      ORDER BY confirmado_em DESC NULLS LAST
      LIMIT v_limit;
  ELSE
    RETURN QUERY
      SELECT * FROM contatos
      WHERE nome               ILIKE '%' || v_busca || '%'
         OR telefone_normalizado ILIKE '%' || v_busca || '%'
      ORDER BY confirmado_em DESC NULLS LAST
      LIMIT v_limit;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION listar_contatos_admin(text, int) TO anon, authenticated;

-- =============================================================
-- MIGRAÇÃO v3 — PAINEL com filtros avançados
-- Execute no SQL Editor do Supabase. Adiciona duas funções usadas
-- pelo dashboard (admin/index.html) para filtrar ao máximo:
--   • painel_facetas()  → opções/contagens p/ os menus de filtro
--   • painel_contatos(...) → listagem filtrada por vários critérios
-- Mantém as funções antigas intactas (compatível com o que já existe).
-- =============================================================

-- ── 7. Facetas (opções e contagens para os filtros) ──────────
CREATE OR REPLACE FUNCTION painel_facetas()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total',        (SELECT count(*) FROM contatos),
    'confirmados',  (SELECT count(*) FROM contatos WHERE confirmado_evento),
    'boas_vindas',  (SELECT count(*) FROM contatos WHERE boas_vindas_enviada),
    'agradecimentos',(SELECT count(*) FROM contatos WHERE agradecimento_enviado),
    'cidades', (SELECT COALESCE(jsonb_agg(t), '[]') FROM (
        SELECT cidade AS v, count(*) AS n FROM contatos
        WHERE cidade IS NOT NULL AND cidade <> ''
        GROUP BY cidade ORDER BY count(*) DESC, cidade LIMIT 300) t),
    'origens', (SELECT COALESCE(jsonb_agg(t), '[]') FROM (
        SELECT origem AS v, count(*) AS n FROM contatos
        WHERE origem IS NOT NULL AND origem <> ''
        GROUP BY origem ORDER BY count(*) DESC) t),
    'eventos', (SELECT COALESCE(jsonb_agg(t), '[]') FROM (
        SELECT nome_evento AS v, count(*) AS n FROM contatos
        WHERE nome_evento IS NOT NULL AND nome_evento <> ''
        GROUP BY nome_evento ORDER BY count(*) DESC) t),
    'partidos', (SELECT COALESCE(jsonb_agg(t), '[]') FROM (
        SELECT partido AS v, count(*) AS n FROM contatos
        WHERE partido IS NOT NULL AND partido <> ''
        GROUP BY partido ORDER BY count(*) DESC) t)
  );
$$;
GRANT EXECUTE ON FUNCTION painel_facetas() TO anon, authenticated;

-- ── 8. Listagem do painel com filtros combinados ─────────────
-- Todos os parâmetros são opcionais; string vazia = "sem filtro".
--   p_status:      ''(todos) | 'confirmados' | 'nao_confirmados'
--   p_boas_vindas: ''(todos) | 'enviadas'    | 'pendentes'
CREATE OR REPLACE FUNCTION painel_contatos(
  p_busca       text DEFAULT '',
  p_cidade      text DEFAULT '',
  p_origem      text DEFAULT '',
  p_evento      text DEFAULT '',
  p_partido     text DEFAULT '',
  p_status      text DEFAULT '',
  p_boas_vindas text DEFAULT '',
  p_limit       int  DEFAULT 200
)
RETURNS SETOF contatos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_busca text := left(trim(p_busca), 100);
  v_limit int  := LEAST(GREATEST(p_limit, 1), 2000);
BEGIN
  RETURN QUERY
    SELECT * FROM contatos
    WHERE (v_busca = '' OR nome ILIKE '%' || v_busca || '%'
                        OR telefone_normalizado ILIKE '%' || v_busca || '%')
      AND (p_cidade  = '' OR cidade      = p_cidade)
      AND (p_origem  = '' OR origem      = p_origem)
      AND (p_evento  = '' OR nome_evento = p_evento)
      AND (p_partido = '' OR partido     = p_partido)
      AND (p_status  = '' OR (p_status = 'confirmados'     AND confirmado_evento)
                          OR (p_status = 'nao_confirmados' AND NOT confirmado_evento))
      AND (p_boas_vindas = '' OR (p_boas_vindas = 'enviadas'  AND boas_vindas_enviada)
                              OR (p_boas_vindas = 'pendentes' AND NOT boas_vindas_enviada))
    ORDER BY confirmado_em DESC NULLS LAST, nome
    LIMIT v_limit;
END;
$$;
GRANT EXECUTE ON FUNCTION painel_contatos(text, text, text, text, text, text, text, int)
  TO anon, authenticated;
