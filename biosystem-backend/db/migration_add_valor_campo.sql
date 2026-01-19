-- Migration: Add valor and procedimento_id fields to fila_atendimento
-- This script adds the missing fields to the fila_atendimento table

-- Check if columns exist before adding them
DO $$ 
BEGIN
  -- Add valor column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fila_atendimento' AND column_name = 'valor'
  ) THEN
    ALTER TABLE fila_atendimento ADD COLUMN valor DECIMAL(10, 2) DEFAULT 0.00;
    RAISE NOTICE 'Column valor added to fila_atendimento';
  ELSE
    RAISE NOTICE 'Column valor already exists in fila_atendimento';
  END IF;

  -- Add procedimento_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fila_atendimento' AND column_name = 'procedimento_id'
  ) THEN
    ALTER TABLE fila_atendimento ADD COLUMN procedimento_id INTEGER;
    RAISE NOTICE 'Column procedimento_id added to fila_atendimento';
  ELSE
    RAISE NOTICE 'Column procedimento_id already exists in fila_atendimento';
  END IF;
END $$;
