# 🔧 INSTRUÇÕES PARA LIMPAR BANCO E CORRIGIR PROBLEMA

## ✅ O que foi corrigido no código

### 1. auth.js - Linha 20
**ANTES:**
```javascript
const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
```

**DEPOIS:**
```javascript
const emailExiste = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND ativo = true', [email]);
```

### 2. usuarios.js - Linha 108
**ANTES:**
```javascript
const emailExiste = await pool.query(
  'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
  [email, id]
);
```

**DEPOIS:**
```javascript
const emailExiste = await pool.query(
  'SELECT id FROM usuarios WHERE email = $1 AND id != $2 AND ativo = true',
  [email, id]
);
```

---

## 🗄️ Passo 1: Conectar ao Banco de Dados

```bash
# Com psql local
psql -U postgres -h localhost -d biosystem

# Ou use o arquivo de dados do Railway se estiver em produção
```

---

## 🧹 Passo 2: Executar Limpeza

### Opção A: Soft Delete (Recomendado - Preserva Dados)
```sql
-- Marcar todos os usuários não-master como inativos
UPDATE usuarios 
SET ativo = false 
WHERE tipo != 'master' 
OR email != 'master@biosystem.com';
```

### Opção B: Hard Delete (Completo - Remove Dados)
```sql
-- Deletar todos os usuários não-master
DELETE FROM usuarios 
WHERE tipo != 'master' 
AND email != 'master@biosystem.com';

-- Limpar índices
VACUUM ANALYZE usuarios;
```

---

## ✅ Passo 3: Verificar Resultado

```sql
-- Ver apenas usuários ativos
SELECT id, nome, email, tipo, ativo FROM usuarios WHERE ativo = true;

-- Deveria mostrar apenas:
-- | 1 | Master | master@biosystem.com | master | true |
```

---

## 🚀 Passo 4: Fazer Deploy

```bash
cd c:\Users\Gabriel Ferreira\Biosystem\biosystem

# Commit das correções
git add biosystem-backend/routes/auth.js
git add biosystem-backend/routes/usuarios.js
git commit -m "🐛 Fix: Verificar ativo = true ao validar email duplicado"
git push
```

Vercel e Railway farão redeploy automático.

---

## 🧪 Passo 5: Testar

### Teste 1: Criar novo usuário com email novo
```
Email: anna@biosystem.com
Senha: qualquer@123
Tipo: usuario
```
✅ Deve criar com sucesso

### Teste 2: Tentar criar novamente com mesmo email
```
Email: anna@biosystem.com
Tipo: usuario
```
❌ Deve dar erro "já está cadastrado"

### Teste 3: Deletar usuário e recriar
```
1. Deletar anna@biosystem.com
2. Criar novo usuário com anna@biosystem.com
```
✅ Deve criar com sucesso (porque antes a query não respeitava ativo = false)

---

## 📋 Checklist Completo

- [ ] Código corrigido em auth.js linha 20
- [ ] Código corrigido em usuarios.js linha 108
- [ ] Banco de dados limpo (soft delete todos exceto master)
- [ ] Commit feito e sincronizado com GitHub
- [ ] Deploy realizado (Vercel + Railway)
- [ ] Teste 1 passou (criar novo usuário)
- [ ] Teste 2 passou (duplicata bloqueada)
- [ ] Teste 3 passou (reusar email após delete)

---

## 🎯 Resumo

O problema era simples mas crítico:

1. **O Erro:** Quando deletava um usuário (soft delete), o banco mantinha o registro com `ativo = false`
2. **A Vulnerabilidade:** A query de verificação de email duplicado não checava `ativo = true`
3. **O Resultado:** Ninguém podia mais usar aquele email, mesmo tendo sido deletado
4. **A Solução:** Adicionar `AND ativo = true` nas queries de verificação de email

Agora com essa correção:
- ✅ Emails de usuários deletados (ativo = false) podem ser reutilizados
- ✅ Novos usuários podem ser criados sem problemas
- ✅ Sistema mantém soft deletes (dados não são perdidos)
- ✅ Segurança preservada (duplicatas ativas ainda são bloqueadas)
