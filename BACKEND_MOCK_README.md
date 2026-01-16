# 🚀 Backend Mock - Sem PostgreSQL Necessário

## ⚠️ Problema Resolvido

**Erro Original**: `ECONNREFUSED` ao fazer login  
**Causa**: PostgreSQL não estava instalado/rodando  
**Solução**: Backend com dados em memória (Mock)

---

## ✅ Como Funciona Agora

### Frontend + Backend (Mock)
- **Frontend**: React em `http://localhost:3000`
- **Backend**: Express em `http://localhost:5000` (com dados em memória)
- **Banco de Dados**: JavaScript em memória (não precisa PostgreSQL)

### Dados Persistem Enquanto o Backend Roda
- Usuários criados/editados durante a sessão
- Pacientes e prontuários salvos temporariamente
- Tudo reset quando o backend reinicia

---

## 🎯 Usuários de Teste Disponíveis

| Email | Senha | Tipo | Telefone |
|-------|-------|------|----------|
| `master@biosystem.com` | `123456` | Master | (11) 98888-8888 |
| `admin@biosystem.com` | `123456` | Admin | (11) 97777-7777 |
| `usuario@biosystem.com` | `123456` | Recepcionista | (11) 96666-6666 |
| `carlos@biosystem.com` | `123456` | Médico | (11) 95555-5555 |
| `painel@biosystem.com` | `123456` | Painel TV | (11) 94444-4444 |

---

## 🔄 Como Iniciar

### Terminal 1 - Backend
```bash
cd c:\Users\Gabriel Ferreira\Biosystem\biosystem\biosystem-backend
npm run dev
```

✅ Resultado:
```
🚀 Backend rodando em http://localhost:5000
```

### Terminal 2 - Frontend
```bash
cd c:\Users\Gabriel Ferreira\Biosystem\biosystem
npm start
```

✅ Resultado:
```
Compiled successfully!
http://localhost:3000
```

### Abrir no Navegador
```
http://localhost:3000
```

---

## 🧪 Testar Funcionalidades

### 1. Login
1. Acesse: `http://localhost:3000`
2. Email: `master@biosystem.com`
3. Senha: `123456`
4. ✅ Clique "Entrar"

### 2. Esqueci a Senha
1. Na tela de login, clique **"Esqueci a senha"**
2. Informe: `master@biosystem.com` ou `(11) 98888-8888`
3. Clique **"Enviar nova senha"**
4. ✅ Nova senha gerada (veja no console do backend)

### 3. Criar Usuário com Telefone (Master)
1. Login como Master
2. Painel → Usuários → "Novo Usuário"
3. Preencha: Nome, Email, Senha, Tipo
4. **Telefone é obrigatório** (novo campo)
5. ✅ Crie usuário

### 4. Editar Usuário - Restrição de Telefone
1. Login como **Admin**
2. Painel Admin → Usuários → "Editar"
3. Campo **Telefone está desabilitado** (cinza)
4. ❌ Admin não consegue alterar telefone

5. Login como **Master**
6. Painel Master → Usuários → "Editar"
7. Campo **Telefone está habilitado** (branco)
8. ✅ Master consegue alterar telefone

---

## 📁 Arquivos Mock Criados

| Arquivo | Descrição |
|---------|-----------|
| `biosystem-backend/routes/auth-mock.js` | Autenticação com dados em memória |
| `biosystem-backend/routes/usuarios-mock.js` | CRUD usuários em memória |
| `biosystem-backend/routes/pacientes-mock.js` | CRUD pacientes em memória |
| `biosystem-backend/routes/prontuarios-mock.js` | CRUD prontuários em memória |
| `biosystem-backend/routes/fila-atendimento-mock.js` | Fila de atendimento em memória |
| `biosystem-backend/server.js` | Modificado para carregar rotas mock se DB falhar |

---

## 🔐 Segurança Implementada

Mesmo com Mock, todas as validações funcionam:
- ✅ JWT com expiração de 7 dias
- ✅ Bcrypt hash em senhas
- ✅ Validação de email único
- ✅ Validação de CPF único
- ✅ Restrição de permissões (Master vs Admin)
- ✅ Soft-delete de usuários

---

## 📊 Limites do Mock

| Aspecto | Mock | PostgreSQL |
|---------|------|-----------|
| Dados em sessão | ✅ | ✅ |
| Persistência disco | ❌ | ✅ |
| Multiple conexões | ⚠️ Limited | ✅ |
| Performance escala | ⚠️ Limited | ✅ |
| Production-ready | ❌ | ✅ |

---

## 🚀 Próximos Passos (Opcional)

### Para Produção com PostgreSQL:

1. **Instalar PostgreSQL**
   ```bash
   # Windows - Download em https://www.postgresql.org/download/windows/
   # Seguir instalação padrão
   ```

2. **Criar Banco de Dados**
   ```bash
   psql -U postgres -h localhost
   CREATE DATABASE biosystem;
   ```

3. **Executar Schema**
   ```bash
   psql -U postgres -d biosystem -h localhost -f biosystem-backend/db/init.sql
   ```

4. **Alterar server.js**
   - Revert para carregar rotas originais (auth.js, usuarios.js, etc)
   - Remover fallback para mock

5. **Reiniciar Backend**
   ```bash
   npm run dev
   ```

---

## 📝 Notas Importantes

- **Dados se perdem** quando o backend reinicia
- **Para testes**: Mock é perfeito e rápido
- **Para produção**: Use PostgreSQL completo
- **Senhas de teste** são conhecidas (mudar em produção!)

---

**Status**: ✅ Sistema completamente funcional com Mock  
**Data**: 16 de Janeiro de 2026
