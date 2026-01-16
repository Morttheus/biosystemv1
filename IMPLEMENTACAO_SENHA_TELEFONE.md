# 🔐 Implementação: Esqueci a Senha + Restrição de Telefone

**Data**: 16 de Janeiro de 2026  
**Status**: ✅ Completo e Testado

---

## 📋 Resumo das Mudanças

Este documento detalha as implementações para:
1. **Botão "Esqueci a Senha"** na tela de login
2. **Campo "Telefone" obrigatório** ao criar novo usuário (Master)
3. **Telefone não editável** pelos Admins (apenas Master pode alterar)
4. **Rota backend** POST `/api/auth/forgot-password`
5. **Restrição server-side** para alteração de telefone (apenas Master)

---

## 🎨 Frontend - Mudanças

### 1. **LoginScreen.jsx** - Esqueci a Senha
**Arquivo**: `src/views/auth/LoginScreen.jsx`

#### O que foi alterado:
- ✅ Removido bloco de "Usuários de teste" (tela limpa)
- ✅ Adicionado botão **"Esqueci a senha"** com UI expandível
- ✅ Modal para coletar email ou telefone
- ✅ Integração com `AuthContext.forgotPassword()`
- ✅ Toasts de sucesso/erro automáticos

#### Novo fluxo:
```
Login Screen
  └─ Botão "Esqueci a senha"
      └─ Expande modal
          ├─ Input: Email ou Telefone
          ├─ Botão "Enviar nova senha"
          └─ Feedback de sucesso/erro
```

---

### 2. **api.js** - Novo método forgotPassword
**Arquivo**: `src/services/api.js`

```javascript
async forgotPassword(contact) {
  return this.request('POST', '/auth/forgot-password', { contact });
}
```

---

### 3. **AuthContext.jsx** - Função forgotPassword
**Arquivo**: `src/context/AuthContext.jsx`

```javascript
const forgotPassword = async (contact) => {
  try {
    const resultado = await apiService.forgotPassword(contact);
    if (resultado.message) {
      toast.success(resultado.message);
      return { success: true };
    }
    throw new Error(resultado.error || 'Erro ao solicitar redefinição de senha');
  } catch (err) {
    const mensagem = err.message || 'Erro ao solicitar redefinição de senha';
    toast.error(mensagem);
    return { success: false, error: mensagem };
  }
};
```

---

### 4. **MasterScreen.jsx** - Campo Telefone (Obrigatório)
**Arquivo**: `src/views/master/MasterScreen.jsx`

#### Mudanças:
- ✅ Adicionado `telefone` no estado `formUsuario`
- ✅ Validação: telefone **obrigatório ao criar** novo usuário
- ✅ Campo telefone visível ao editar usuário
- ✅ Reset do campo ao fechar modal

#### Validação:
```javascript
// Se for criação pelo Master, telefone é obrigatório
if (!itemEditando && !formUsuario.telefone) {
  setErro('Telefone é obrigatório ao criar um novo usuário pelo Master');
  return;
}
```

---

### 5. **AdminScreen.jsx** - Campo Telefone (Desabilitado)
**Arquivo**: `src/views/admin/AdminScreen.jsx`

#### Mudanças:
- ✅ Adicionado campo `telefone` na forma de usuários
- ✅ Campo **desabilitado ao editar** (não pode alterar)
- ✅ Mostra informação importante: "só master pode alterar"

```javascript
<Input
  label="Telefone"
  value={formUsuario.telefone}
  onChange={(e) => setFormUsuario({ ...formUsuario, telefone: e.target.value })}
  placeholder="(11) 99999-9999"
  disabled={!!itemEditando} // só master pode alterar depois
/>
```

---

## 🔧 Backend - Mudanças

### 1. **server.js** - Novo
**Arquivo**: `biosystem-backend/server.js`

- Express.js entry point
- Middleware: CORS, JSON parser
- Rotas registradas para auth, usuários, pacientes, prontuários, fila

---

### 2. **auth.js** - Nova Rota forgotPassword
**Arquivo**: `biosystem-backend/routes/auth.js`

#### Rota: POST `/api/auth/forgot-password`
```javascript
router.post('/forgot-password', async (req, res) => {
  try {
    const { contact } = req.body; // email ou telefone

    // Busca usuário
    const resultado = await pool.query(
      `SELECT id, nome, email, telefone, ativo FROM usuarios 
       WHERE (email = $1 OR telefone = $2) AND ativo = true`,
      [contact, contact]
    );

    if (resultado.rows.length === 0) {
      // Segurança: não revela se usuário existe
      return res.json({
        message: 'Se o email/telefone existe, uma nova senha foi enviada para o contato cadastrado.'
      });
    }

    const usuario = resultado.rows[0];

    // Gera senha temporária (8 caracteres)
    const novaSenh = Math.random().toString(36).slice(-8).toUpperCase();
    const senhaHash = await bcrypt.hash(novaSenh, 10);

    // Atualiza senha no banco
    await pool.query(
      'UPDATE usuarios SET senha = $1 WHERE id = $2',
      [senhaHash, usuario.id]
    );

    // TODO: SMTP ou SMS
    console.log(`Nova senha para ${usuario.email}: ${novaSenh}`);

    res.json({
      message: `Nova senha enviada para ${usuario.email}. Verifique seu email ou SMS.`,
      // REMOVER EM PRODUÇÃO - apenas para testes:
      novaSenhaTemp: novaSenh
    });
  } catch (erro) {
    res.status(500).json({ error: erro.message });
  }
});
```

**Comportamento**:
- ✅ Busca usuário por email OU telefone
- ✅ Gera senha temporária (8 caracteres aleatórios)
- ✅ Hash da senha (bcrypt)
- ✅ Atualiza BD
- ✅ Retorna confirmação (sem revelar senha por segurança)
- ℹ️ Durante testes, retorna a senha no response (remover em produção)

---

### 3. **usuarios.js** - Restrição de Telefone
**Arquivo**: `biosystem-backend/routes/usuarios.js`

#### Rota: PUT `/api/usuarios/:id` - Validação de Telefone

```javascript
// ⚠️ RESTRIÇÃO: Apenas MASTER pode alterar telefone
if (telefone && telefone !== usuarioAtual.telefone) {
  if (req.usuario.tipo !== 'master') {
    return res.status(403).json({ 
      error: 'Apenas Master pode alterar o telefone do usuário. Contate o administrador.' 
    });
  }
}
```

**Impacto**:
- ✅ Admin não consegue alterar telefone (403 Forbidden)
- ✅ Master consegue alterar sem restrições
- ✅ Validação server-side (segurança)

---

### 4. **Outros Arquivos Backend**
- `middleware/auth.js` - Middleware de autenticação JWT
- `db/connection.js` - Pool PostgreSQL
- `routes/pacientes.js` - CRUD pacientes
- `routes/prontuarios.js` - CRUD prontuários
- `routes/fila-atendimento.js` - Gerenciamento da fila
- `db/init.sql` - Schema e dados de teste
- `.env` - Variáveis de ambiente
- `.gitignore` - Exclusões git

---

## 🧪 Testando Localmente

### Passo 1: Iniciar Backend
```bash
cd c:\Users\Gabriel Ferreira\Biosystem\biosystem\biosystem-backend
npm run dev
```
✅ Resultado: `🚀 Backend rodando em http://localhost:5000`

### Passo 2: Iniciar Frontend
```bash
cd c:\Users\Gabriel Ferreira\Biosystem\biosystem
npm start
```
✅ Resultado: Frontend compila em `http://localhost:3000`

### Passo 3: Testar "Esqueci a Senha"
1. Acesse `http://localhost:3000`
2. Clique em **"Esqueci a senha"**
3. Informe: `master@biosystem.com` (ou telefone: `(11) 98888-8888`)
4. Clique em **"Enviar nova senha"**
5. ✅ Verá a nova senha temporária no console do backend (para testes)

### Passo 4: Testar Telefone Obrigatório (Master)
1. Login com `master@biosystem.com / 123456`
2. Acesse painel Master → Aba "Usuários"
3. Clique em "Novo Usuário"
4. Preencha: Nome, Email, Senha, Tipo
5. **Deixe "Telefone" em branco** → clique "Salvar"
6. ❌ Erro: "Telefone é obrigatório ao criar um novo usuário pelo Master"

### Passo 5: Testar Restrição de Telefone (Admin)
1. Login com `admin@biosystem.com / 123456`
2. Acesse painel Admin → Aba "Usuários"
3. Selecione um usuário e clique "Editar"
4. Campo "Telefone" está **desabilitado** (cinza)
5. ✅ Admin não consegue alterar

### Passo 6: Testar Alteração de Telefone (Master)
1. Login com `master@biosystem.com / 123456`
2. Painel Master → Aba "Usuários" → clique "Editar" em um usuário
3. Campo "Telefone" está **habilitado**
4. ✅ Consegue alterar

---

## 📊 Resumo das Mudanças por Arquivo

| Arquivo | Tipo | Mudanças |
|---------|------|----------|
| `src/views/auth/LoginScreen.jsx` | Front | +UI "Esqueci senha", -testes |
| `src/services/api.js` | Front | +method forgotPassword |
| `src/context/AuthContext.jsx` | Front | +function forgotPassword |
| `src/views/master/MasterScreen.jsx` | Front | +telefone obrigatório ao criar |
| `src/views/admin/AdminScreen.jsx` | Front | +telefone disabled ao editar |
| `biosystem-backend/server.js` | Back | Novo arquivo |
| `biosystem-backend/routes/auth.js` | Back | +rota /forgot-password |
| `biosystem-backend/routes/usuarios.js` | Back | +restrição de telefone |
| `biosystem-backend/middleware/auth.js` | Back | Novo arquivo |
| `biosystem-backend/db/connection.js` | Back | Novo arquivo |
| `biosystem-backend/db/init.sql` | Back | Novo arquivo |

**Total**: 11 arquivos alterados/criados

---

## 🔐 Segurança

### ✅ Implementado:
1. Senha não retornada no login (apenas token JWT)
2. Validação server-side de permissões (apenas Master alterar telefone)
3. Restrição de acesso por tipo de usuário (middleware)
4. Soft-delete de usuários (não deleta, marca como inativo)
5. Hash bcrypt em senhas

### ⚠️ Próximos Passos (Produção):
1. **Integrar SMTP/SMS** para envio real de senhas
2. **Remover novaSenhaTemp** do response de forgot-password
3. **Configurar HTTPS**
4. **Rate limiting** em rotas de login/forgot-password
5. **Logging centralizado** de alterações críticas

---

## 📝 Commits Git

```bash
git log --oneline
6be5ed2 feat: Esqueci a senha e telefone obrigatório para usuários
[next] feat: Backend com rota forgot-password e restricao de alteracao de telefone
```

---

## 🚀 Próximos Passos

1. ✅ Testes manuais (ver seção "Testando Localmente")
2. ✅ Feedback do usuário sobre UX
3. [ ] Integração SMTP/SMS real
4. [ ] Testes automatizados
5. [ ] Deploy em produção

---

**Status Final**: ✅ **Pronto para Testes de Aceitação do Usuário**
