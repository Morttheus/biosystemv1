# 🔍 ANÁLISE COMPLETA - Problema Email Duplicado

## Problema Relatado
- Usuário tenta cadastrar "anna@biosystem.com"
- Sistema diz "já está cadastrado"
- Banco de dados está vazio (sem usuários antigos)

## Raiz do Problema - ENCONTRADO! ✅

### Arquivo: `biosystem-backend/routes/auth.js` - Linha 20

**CÓDIGO ATUAL (ERRADO):**
```javascript
// Verifica se email já existe
const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
if (emailExiste.rows.length > 0) {
  return res.status(400).json({ error: 'Este email já está cadastrado' });
}
```

**PROBLEMA:**
- Verifica TODOS os usuários, inclusive soft-deleted (ativo = false)
- Se um usuário foi deletado (soft delete), o email fica "bloqueado"
- Novo usuário NÃO CONSEGUE USAR ESSE EMAIL

**SOLUÇÃO:**
```javascript
// Verifica se email já existe E está ativo
const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND ativo = true', [email]);
if (emailExiste.rows.length > 0) {
  return res.status(400).json({ error: 'Este email já está cadastrado' });
}
```

---

## Verificação de Todas as Queries de Email

### 1. ✅ auth.js - Linha 67 (LOGIN) - CORRETO
```javascript
SELECT id, nome, email, senha, tipo, clinica_id, telefone, ativo 
FROM usuarios 
WHERE email = $1 AND ativo = true
```
✅ Correto - Verifica ativo

### 2. ❌ auth.js - Linha 20 (REGISTRAR) - ERRADO
```javascript
SELECT id FROM usuarios WHERE email = $1
```
❌ ERRADO - Não verifica ativo = true
**PRECISA DE FIX**

### 3. ✅ usuarios.js - Linha 217 (POST CRIAR) - CORRETO
```javascript
SELECT id FROM usuarios WHERE email = $1 AND ativo = true
```
✅ Correto - Verifica ativo

### 4. ⚠️ usuarios.js - Linha 108 (PUT EDITAR) - PARCIAL
```javascript
SELECT id FROM usuarios WHERE email = $1 AND id != $2
```
⚠️ Não verifica ativo = true
**PRECISA DE FIX** - Deveria permitir reusá-lo se o original está inativo

---

## Impacto do Problema

### Cenário 1: User Deletado
1. João cadastrado com "joão@test.com" (ativo = true)
2. Admin deleta João (ativo = false)
3. Maria tenta usar "joão@test.com"
4. ERRO: "já está cadastrado" ❌
5. Maria NÃO CONSEGUE cadastrar ❌

### Cenário 2: Edição de Email
1. João tenta mudar email para "anna@test.com"
2. Se "anna@test.com" existe (mesmo soft-deleted)
3. Falha mesmo que deveria permitir ❌

---

## Plano de Ação

### Passo 1: Corrigir Código
- [ ] auth.js linha 20: Adicionar `AND ativo = true`
- [ ] usuarios.js linha 108: Adicionar `AND ativo = true`

### Passo 2: Limpar Banco de Dados
- [ ] Listar todos os usuários (inclusive deletados)
- [ ] Deletar TODOS os usuários exceto master
- [ ] Executar VACUUM ANALYZE

### Passo 3: Testar
- [ ] Criar novo usuário "anna@biosystem.com"
- [ ] Verificar que foi criado com sucesso
- [ ] Tentar criar novamente (deve falhar)
- [ ] Deletar usuário
- [ ] Criar novamente com mesmo email (deve funcionar)

---

## Alterações Necessárias

### auth.js - Linha 20
```diff
- const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
+ const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND ativo = true', [email]);
```

### usuarios.js - Linha 108
```diff
- const emailExiste = await pool.query(
-   'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
-   [email, id]
- );
+ const emailExiste = await pool.query(
+   'SELECT id FROM usuarios WHERE email = $1 AND id != $2 AND ativo = true',
+   [email, id]
+ );
```

---

## Scripts SQL para Limpeza

### Verificar Todos os Usuários (inclusive deletados)
```sql
SELECT id, nome, email, tipo, ativo FROM usuarios ORDER BY id;
```

### Deletar Todos Exceto Master
```sql
DELETE FROM usuarios 
WHERE tipo != 'master' 
AND email != 'master@biosystem.com';
```

### Soft-Delete (Recomendado)
```sql
UPDATE usuarios 
SET ativo = false 
WHERE tipo != 'master' 
AND email != 'master@biosystem.com';
```

### Hard-Delete (Completo)
```sql
DELETE FROM usuarios 
WHERE tipo != 'master';
```

### Vacuum para Limpar Espaço
```sql
VACUUM ANALYZE usuarios;
```

---

## Status da Análise

✅ Problema identificado: auth.js linha 20 não verifica ativo  
✅ Impacto identificado: Emails de usuários deletados ficam bloqueados  
✅ Solução proposta: Adicionar AND ativo = true  
✅ Outras vulnerabilidades encontradas em usuarios.js linha 108  

**PRONTO PARA IMPLEMENTAÇÃO**
