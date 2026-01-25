-- Migração: Adicionar campos valor e procedimento_id na tabela prontuarios
-- Execute este script no banco de dados para adicionar suporte a valores nos relatórios

-- Adiciona coluna valor se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'prontuarios' AND column_name = 'valor') THEN
        ALTER TABLE prontuarios ADD COLUMN valor DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE 'Coluna valor adicionada à tabela prontuarios';
    ELSE
        RAISE NOTICE 'Coluna valor já existe na tabela prontuarios';
    END IF;
END $$;

-- Adiciona coluna procedimento_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'prontuarios' AND column_name = 'procedimento_id') THEN
        ALTER TABLE prontuarios ADD COLUMN procedimento_id INTEGER REFERENCES procedimentos(id);
        RAISE NOTICE 'Coluna procedimento_id adicionada à tabela prontuarios';
    ELSE
        RAISE NOTICE 'Coluna procedimento_id já existe na tabela prontuarios';
    END IF;
END $$;

-- Verifica se a coluna valor existe na tabela fila_atendimento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'fila_atendimento' AND column_name = 'valor') THEN
        ALTER TABLE fila_atendimento ADD COLUMN valor DECIMAL(10, 2) DEFAULT 0;
        RAISE NOTICE 'Coluna valor adicionada à tabela fila_atendimento';
    ELSE
        RAISE NOTICE 'Coluna valor já existe na tabela fila_atendimento';
    END IF;
END $$;

-- Verifica se a coluna procedimento_id existe na tabela fila_atendimento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'fila_atendimento' AND column_name = 'procedimento_id') THEN
        ALTER TABLE fila_atendimento ADD COLUMN procedimento_id INTEGER REFERENCES procedimentos(id);
        RAISE NOTICE 'Coluna procedimento_id adicionada à tabela fila_atendimento';
    ELSE
        RAISE NOTICE 'Coluna procedimento_id já existe na tabela fila_atendimento';
    END IF;
END $$;

-- Índices para melhorar performance de relatórios
CREATE INDEX IF NOT EXISTS idx_prontuarios_valor ON prontuarios(valor);
CREATE INDEX IF NOT EXISTS idx_prontuarios_procedimento_id ON prontuarios(procedimento_id);
CREATE INDEX IF NOT EXISTS idx_fila_atendimento_valor ON fila_atendimento(valor);
CREATE INDEX IF NOT EXISTS idx_fila_atendimento_procedimento_id ON fila_atendimento(procedimento_id);

SELECT 'Migração concluída com sucesso!' as status;
