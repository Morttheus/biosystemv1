-- ============================================
-- SCRIPT DE LIMPEZA: Remover Todos os Usuários Exceto Master
-- ============================================

-- 1️⃣ VERIFICAR QUAIS USUÁRIOS EXISTEM
SELECT id, nome, email, tipo, ativo, data_criacao 
FROM usuarios 
ORDER BY id;

-- 2️⃣ SOFT DELETE - Marcar como inativo (RECOMENDADO)
UPDATE usuarios 
SET ativo = false 
WHERE tipo != 'master' 
OR email != 'master@biosystem.com';

-- OU HARD DELETE - Deletar completamente (NÃO RECOMENDADO)
-- DELETE FROM usuarios 
-- WHERE tipo != 'master' 
-- AND email != 'master@biosystem.com';

-- 3️⃣ VERIFICAR RESULTADO
SELECT id, nome, email, tipo, ativo, data_criacao 
FROM usuarios 
WHERE ativo = true 
ORDER BY id;

-- 4️⃣ LIMPAR CACHE/ÍNDICES (OPTIONAL)
VACUUM ANALYZE usuarios;

-- 5️⃣ VERIFICAR INTEGRIDADE
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT COUNT(*) as usuarios_ativos FROM usuarios WHERE ativo = true;
SELECT COUNT(*) as usuarios_inativos FROM usuarios WHERE ativo = false;

-- 6️⃣ VERIFICAR MASTER
SELECT id, nome, email, tipo, ativo FROM usuarios WHERE ativo = true;
