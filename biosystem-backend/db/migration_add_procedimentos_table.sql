-- Migration: Create procedimentos table and add foreign key to fila_atendimento
-- This script adds the missing procedimentos table and foreign key constraint

-- Create procedimentos table if it doesn't exist
CREATE TABLE IF NOT EXISTS procedimentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  data_cadastro TIMESTAMP DEFAULT NOW()
);

-- Add some default procedures for testing/use
INSERT INTO procedimentos (nome, valor, descricao, ativo)
VALUES 
  ('Consulta Oftalmológica', 150.00, 'Avaliação oftalmológica completa', true),
  ('Teste de Refração', 80.00, 'Determinação do grau refratário', true),
  ('Tonometria', 50.00, 'Medição da pressão ocular', true),
  ('Fundoscopia', 60.00, 'Exame do fundo do olho', true),
  ('Biometria', 100.00, 'Medição das estruturas oculares', true),
  ('OCT - Retina', 200.00, 'Tomografia de coerência óptica da retina', true),
  ('OCT - Nervo Óptico', 200.00, 'Tomografia de coerência óptica do nervo óptico', true),
  ('Ceratometria', 70.00, 'Medição da curvatura da córnea', true)
ON CONFLICT DO NOTHING;

-- Add foreign key to fila_atendimento if it doesn't exist
DO $$
BEGIN
  -- Check if the foreign key already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'fila_atendimento' AND constraint_name = 'fila_atendimento_procedimento_id_fkey'
  ) THEN
    ALTER TABLE fila_atendimento
    ADD CONSTRAINT fila_atendimento_procedimento_id_fkey
    FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id);
    RAISE NOTICE 'Foreign key constraint added to fila_atendimento';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists for procedimento_id';
  END IF;
END $$;
