# 🎯 PRÓXIMOS PASSOS - TUDO JÁ ESTÁ PRONTO!

## ✅ O QUE FOI CRIADO AUTOMATICAMENTE:

### Backend (Node.js + Express)
```
✓ Pasta: c:\Users\Gabriel Ferreira\Biosystem\biosystem-backend
✓ Arquivo: server.js
✓ Arquivo: utils/db.js
✓ Arquivo: utils/auth.js
✓ Arquivo: routes/auth.js (Login, Registrar)
✓ Arquivo: routes/usuarios.js (CRUD de usuários)
✓ Arquivo: routes/pacientes.js (CRUD de pacientes)
✓ Arquivo: routes/prontuarios.js (CRUD de prontuários)
✓ Arquivo: .env (configurações)
✓ Arquivo: package.json (dependências)
```

### Frontend (React)
```
✓ Arquivo: src/services/api.js (Integração com API)
✓ Arquivo: .env (URL da API)
✓ Arquivo: src/context/AuthContext.jsx (Atualizado para API)
✓ Arquivo: src/context/DataContext.jsx (Atualizado para API)
```

### Script SQL
```
✓ Arquivo: db/init.sql (Criar tabelas PostgreSQL)
✓ Arquivo: setup_db.bat (Setup automático para Windows)
✓ Arquivo: setup_db.sh (Setup automático para Linux/Mac)
```

---

## 🚀 COMO USAR:

### PASSO 1: Instalar PostgreSQL (se ainda não tiver)
Baixe em: https://www.postgresql.org/download/windows/
- Versão recomendada: 14 ou 15
- Anote a senha do usuário 'postgres'
- Porta padrão: 5432

### PASSO 2: Criar Banco de Dados
Abra PowerShell e execute (na pasta do backend):
```bash
cd "c:\Users\Gabriel Ferreira\Biosystem\biosystem-backend"
.\setup_db.bat
```

Quando pedir a senha, digite a senha do 'postgres' que você anotou.

### PASSO 3: Iniciar Backend
Em uma aba de PowerShell:
```bash
cd "c:\Users\Gabriel Ferreira\Biosystem\biosystem-backend"
npm run dev
```

Você verá:
```
🚀 Backend rodando em http://localhost:5000
✓ Conectado ao banco de dados
```

### PASSO 4: Iniciar Frontend
Em outra aba de PowerShell:
```bash
cd "c:\Users\Gabriel Ferreira\Biosystem\biosystem"
npm start
```

Você verá:
```
Compiled successfully!
On Your Network: http://localhost:3000
```

### PASSO 5: Testar Login
Abra http://localhost:3000 e teste com:
- **Email**: master@biosystem.com
- **Senha**: 123456

---

## ⚠️ IMPORTANTE: SENHAS DO BANCO

No arquivo `.env` do backend está:
```
DB_PASSWORD=biosystem123
DB_USER=biosystem_user
```

Se precisar mudar a senha, abra PostgreSQL e execute:
```sql
ALTER USER biosystem_user WITH PASSWORD 'nova_senha';
```

E atualize o `.env`.

---

## 🧪 TESTAR FUNCIONALIDADES

### ✓ Login/Logout
- [ ] Login com master@biosystem.com
- [ ] Verificar se redirecionou para tela correta
- [ ] Clicar Logout
- [ ] Verificar se voltou para login

### ✓ Cadastrar Novo Usuário
- [ ] Como Admin ou Master
- [ ] Preencher: Nome, Email, Senha, Tipo
- [ ] Verificar se foi salvo no banco
- [ ] Tentar login com novo usuário

### ✓ Cadastrar Paciente
- [ ] Como Recepcionista
- [ ] Preencher: Nome, CPF, Email, Telefone
- [ ] Verificar se foi salvo
- [ ] Tentar buscar por CPF

### ✓ Criar Prontuário
- [ ] Como Médico, abrir ConsultorioScreen
- [ ] Buscar paciente
- [ ] Preencher queixa principal
- [ ] Salvar prontuário
- [ ] Verificar se aparece no histórico

### ✓ Painel Sala de Espera
- [ ] Login como painel@biosystem.com
- [ ] Verificar tela de sala de espera
- [ ] Testar som de chamada

---

## 🛠️ TROUBLESHOOTING

### Erro: "Conexão recusada em localhost:5000"
**Solução**: Verifique se o backend está rodando com `npm run dev`

### Erro: "Database connection error"
**Solução**: 
```bash
# Verificar se PostgreSQL está rodando
psql -U postgres
# Se funcionar, saia com \q
# Se não funcionar, reinicie o PostgreSQL
```

### Erro: "Token inválido"
**Solução**: Limpe cookies/localStorage do navegador
```javascript
// No console do navegador:
localStorage.clear()
```

### Erro: "Não consegue inserir usuário"
**Solução**: Verifique se o email não existe já
```sql
SELECT * FROM usuarios WHERE email = 'email@teste.com';
```

---

## 📊 BANCO DE DADOS

### Verificar dados no banco
```bash
psql -U biosystem_user -d biosystem_db
```

Comandos úteis:
```sql
-- Ver todas as tabelas
\dt

-- Ver usuários
SELECT id, nome, email, tipo FROM usuarios;

-- Ver pacientes
SELECT id, nome, cpf FROM pacientes;

-- Ver prontuários
SELECT * FROM prontuarios;

-- Sair
\q
```

---

## 🚢 PRÓXIMAS ETAPAS (Deploy)

Depois que tudo funcionar localmente, você pode fazer deploy em:

### Backend (escolha uma):
- **Railway** (https://railway.app)
- **Render** (https://render.com)
- **Heroku** (https://heroku.com)

### Banco de Dados (escolha uma):
- **Render Database** (PostgreSQL gerenciado)
- **AWS RDS** (mais robusto)
- **Supabase** (alternativa Firebase)

---

## 📝 CHECKLIST FINAL

- [ ] PostgreSQL instalado
- [ ] Banco criado com setup_db.bat
- [ ] Backend rodando (npm run dev)
- [ ] Frontend rodando (npm start)
- [ ] Login funcionando
- [ ] Cadastro de usuários funcionando
- [ ] Cadastro de pacientes funcionando
- [ ] Criação de prontuários funcionando
- [ ] Painel sala de espera funcionando
- [ ] Todos os testes passaram

---

**Dúvidas? Me avise!**
