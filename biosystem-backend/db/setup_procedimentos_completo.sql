-- Setup completo das tabelas de procedimentos e relacionamentos
-- Execute este script no seu banco PostgreSQL

-- 1. Criar tabela procedimentos se não existir
CREATE TABLE IF NOT EXISTS procedimentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMP DEFAULT NOW()
);

-- 2. Criar tabela procedimentos_clinica se não existir
CREATE TABLE IF NOT EXISTS procedimentos_clinica (
  procedimento_id INTEGER NOT NULL,
  clinica_id INTEGER NOT NULL,
  valor_clinica DECIMAL(10, 2),
  data_vinculo TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (procedimento_id, clinica_id),
  FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id) ON DELETE CASCADE,
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_procedimentos_ativo ON procedimentos(ativo);
CREATE INDEX IF NOT EXISTS idx_procedimentos_clinica_procedimento_id ON procedimentos_clinica(procedimento_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_clinica_clinica_id ON procedimentos_clinica(clinica_id);

-- 4. Inserir procedimentos padrão
INSERT INTO procedimentos (nome, valor, descricao, ativo)
VALUES 
  ('Consulta Oftalmológica', 150.00, 'Avaliação oftalmológica completa', true),
  ('Teste de Refração', 80.00, 'Determinação do grau refratário', true),
  ('Tonometria', 50.00, 'Medição da pressão ocular', true),
  ('Fundoscopia', 60.00, 'Exame do fundo do olho', true),
  ('Biometria', 100.00, 'Medição das estruturas oculares', true),
  ('OCT - Retina', 200.00, 'Tomografia de coerência óptica da retina', true),
  ('OCT - Nervo Óptico', 200.00, 'Tomografia de coerência óptica do nervo óptico', true),
  ('Ceratometria', 70.00, 'Medição da curvatura da córnea', true),
  ('Exame de Fundo de Olho', 150.00, 'Exame do fundo do olho', true),
  ('Campimetria', 200.00, 'Campo visual', true),
  ('Mapeamento de Retina', 180.00, 'Mapeamento retiniano', true),
  ('Topografia Corneana', 220.00, 'Análise topográfica da córnea', true)
ON CONFLICT DO NOTHING;

-- 5. Vincular procedimentos às clínicas ativas
DO $$
DECLARE
  v_proc_id INTEGER;
  v_clinica_id INTEGER;
BEGIN
  -- Para cada procedimento ativo
  FOR v_proc_id IN SELECT id FROM procedimentos WHERE ativo = true LOOP
    -- Vincular a cada clínica ativa
    FOR v_clinica_id IN SELECT id FROM clinicas WHERE ativo = true LOOP
      INSERT INTO procedimentos_clinica (procedimento_id, clinica_id)
      VALUES (v_proc_id, v_clinica_id)
      ON CONFLICT (procedimento_id, clinica_id) DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Procedimentos criados e vinculados com sucesso!';
END $$;

-- Verificar se funcionou
SELECT COUNT(*) as total_procedimentos FROM procedimentos;
SELECT COUNT(*) as total_vinculos FROM procedimentos_clinica;
