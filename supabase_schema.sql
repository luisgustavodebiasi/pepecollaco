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
