-- Migration: Add procedimentos_clinica relationship table
-- Create the many-to-many relationship table between procedimentos and clinicas

CREATE TABLE IF NOT EXISTS procedimentos_clinica (
  procedimento_id INTEGER NOT NULL,
  clinica_id INTEGER NOT NULL,
  valor_clinica DECIMAL(10, 2),
  data_vinculo TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (procedimento_id, clinica_id),
  FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id) ON DELETE CASCADE,
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_procedimentos_clinica_procedimento_id ON procedimentos_clinica(procedimento_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_clinica_clinica_id ON procedimentos_clinica(clinica_id);

-- Migrate existing data: Link all current procedures to all clinics
DO $$
DECLARE
  v_proc_id INTEGER;
  v_clinica_id INTEGER;
BEGIN
  -- Get all active procedures
  FOR v_proc_id IN SELECT id FROM procedimentos WHERE ativo = true LOOP
    -- Link each procedure to each active clinic
    FOR v_clinica_id IN SELECT id FROM clinicas WHERE ativo = true LOOP
      INSERT INTO procedimentos_clinica (procedimento_id, clinica_id)
      VALUES (v_proc_id, v_clinica_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Procedimentos vinculados às clínicas com sucesso';
END $$;
