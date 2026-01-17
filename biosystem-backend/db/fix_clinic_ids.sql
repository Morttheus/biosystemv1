-- ============================================
-- SCRIPT DE CORREÇÃO: Remover clínicas com IDs inválidos (timestamps)
-- ============================================

-- Identifica clínicas com IDs suspeitos (timestamps = muito grandes)
SELECT id, nome, data_cadastro 
FROM clinicas 
WHERE id > 1000000 
ORDER BY id DESC;

-- ============================================
-- OPÇÃO 1: Deletar clínicas inválidas
-- ============================================
DELETE FROM clinicas 
WHERE id > 1000000;

-- ============================================
-- OPÇÃO 2: Atualizar usuários que apontam para clínicas inválidas
-- ============================================
-- Primeiro, mover usuários para clínica válida (ID 1)
UPDATE usuarios 
SET clinica_id = 1 
WHERE clinica_id > 1000000 OR clinica_id NOT IN (SELECT id FROM clinicas);

-- Depois, deletar clínicas inválidas
DELETE FROM clinicas 
WHERE id > 1000000;

-- ============================================
-- VERIFICAÇÃO: Validar após limpeza
-- ============================================
SELECT COUNT(*) as total_clinicas FROM clinicas;
SELECT COUNT(*) as usuarios_invalidos FROM usuarios WHERE clinica_id NOT IN (SELECT id FROM clinicas);
