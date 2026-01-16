# 📊 DIAGRAMA - ARQUITETURA DO BIOSYSTEM

## 🏗️ Estrutura Criada

```
C:\Users\Gabriel Ferreira\Biosystem\
├── biosystem/                    [FRONTEND - React]
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js           ✅ NOVO - Cliente API
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  ✅ ATUALIZADO
│   │   │   └── DataContext.jsx  ✅ ATUALIZADO
│   │   ├── views/
│   │   ├── components/
│   │   └── ...
│   ├── .env                      ✅ NOVO - Config API
│   ├── package.json
│   └── ...
│
└── biosystem-backend/            [BACKEND - Node.js] ✅ NOVO
    ├── server.js                 ✅ NOVO
    ├── package.json              ✅ NOVO
    ├── .env                      ✅ NOVO
    ├── utils/
    │   ├── db.js                 ✅ NOVO
    │   └── auth.js               ✅ NOVO
    ├── routes/
    │   ├── auth.js               ✅ NOVO
    │   ├── usuarios.js           ✅ NOVO
    │   ├── pacientes.js          ✅ NOVO
    │   └── prontuarios.js        ✅ NOVO
    ├── db/
    │   ├── init.sql              ✅ NOVO
    │   ├── setup_db.bat          ✅ NOVO
    │   └── setup_db.sh           ✅ NOVO
    └── node_modules/             ✅ NOVO
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR DO USUÁRIO                      │
│                   (http://localhost:3000)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React)                           │
│  ├─ Login (AuthContext)                                     │
│  ├─ Cadastro (DataContext)                                  │
│  ├─ Prontuário (DataContext)                                │
│  └─ Painel (AppContext)                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
         HTTPS/JSON (com token JWT)
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              API SERVICE (src/services/api.js)              │
│              (fetch com Authorization header)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                BACKEND (Node.js/Express)                    │
│          (http://localhost:5000/api)                        │
│                                                              │
│  Routes:                                                     │
│  ├─ POST   /auth/login        → verificar senha            │
│  ├─ POST   /auth/registrar    → criar usuário              │
│  ├─ GET    /usuarios          → listar usuários            │
│  ├─ POST   /usuarios          → novo usuário               │
│  ├─ GET    /pacientes         → listar pacientes           │
│  ├─ POST   /pacientes         → novo paciente              │
│  ├─ GET    /prontuarios       → listar prontuários         │
│  └─ POST   /prontuarios       → novo prontuário            │
│                                                              │
│  Middleware:                                                │
│  ├─ CORS (permite localhost:3000)                           │
│  ├─ autenticado (valida JWT)                               │
│  └─ validação de dados                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              BANCO DE DADOS (PostgreSQL)                    │
│           (localhost:5432/biosystem_db)                     │
│                                                              │
│  Tabelas:                                                    │
│  ├─ usuarios       (login, tipos de acesso)                │
│  ├─ clinicas       (clínicas)                              │
│  ├─ medicos        (médicos por clínica)                   │
│  ├─ pacientes      (pacientes por clínica)                 │
│  ├─ prontuarios    (histórico de consultas)                │
│  └─ fila_atendimento (fila de atendimento)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Fluxo de Autenticação

```
1. USUÁRIO DIGITA EMAIL + SENHA
          ↓
2. FRONTEND ENVIA (POST /auth/login)
          ↓
3. BACKEND VALIDA:
   ✓ Email existe?
   ✓ Senha correta? (bcrypt.compare)
          ↓
4. GERA JWT TOKEN (válido por 7 dias)
          ↓
5. FRONTEND ARMAZENA EM localStorage
          ↓
6. ENVIA TOKEN EM CADA REQUISIÇÃO:
   Header: "Authorization: Bearer <TOKEN>"
          ↓
7. BACKEND VALIDA TOKEN
          ↓
8. USUÁRIO LOGADO ✅
```

---

## 📦 Dependências Instaladas

### Backend
```json
{
  "express": "^4.18.2",        // Servidor web
  "cors": "^2.8.5",             // CORS para frontend
  "dotenv": "^16.3.1",          // Variáveis de ambiente
  "pg": "^8.11.1",              // PostgreSQL driver
  "bcryptjs": "^2.4.3",         // Hash de senhas
  "jsonwebtoken": "^9.1.0",     // JWT
  "uuid": "^9.0.0"              // IDs únicos
}
```

### Frontend (já tinha)
```json
{
  "react": "^19.2.3",           // Framework
  "react-dom": "^19.2.3",       // DOM
  "react-toastify": "^11.0.5",  // Notificações
  "tailwindcss": "^3.4.19"      // CSS
}
```

---

## 🗂️ Tabelas do Banco de Dados

### usuarios
```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  senha VARCHAR(255),        -- hash bcrypt
  tipo VARCHAR(50),          -- 'master', 'admin', 'medico', 'usuario', 'painel'
  clinica_id INTEGER,        -- null para master
  ativo BOOLEAN,
  criado_em TIMESTAMP,
  atualizado_em TIMESTAMP
);
```

### pacientes
```sql
CREATE TABLE pacientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255),
  cpf VARCHAR(14) UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  data_nascimento DATE,
  clinica_id INTEGER,        -- isolamento por clínica
  criado_em TIMESTAMP,
  atualizado_em TIMESTAMP
);
```

### prontuarios
```sql
CREATE TABLE prontuarios (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER,       -- FK pacientes
  medico_id INTEGER,         -- FK medicos
  clinica_id INTEGER,
  queixa_principal TEXT,
  diagnostico TEXT,
  prescricao TEXT,
  observacoes TEXT,
  data_consulta TIMESTAMP,
  criado_em TIMESTAMP,
  atualizado_em TIMESTAMP
);
```

---

## 🔑 Variáveis de Ambiente

### Backend (.env)
```env
# Database
DB_HOST=localhost              # seu PC
DB_PORT=5432                   # porta padrão PostgreSQL
DB_NAME=biosystem_db           # nome do banco
DB_USER=biosystem_user         # usuário do banco
DB_PASSWORD=biosystem123       # senha do banco

# API
PORT=5000                      # porta do backend
NODE_ENV=development           # dev ou production

# JWT
JWT_SECRET=sua_chave_secreta_aqui_min_32_chars
JWT_EXPIRE=7d                  # expira em 7 dias
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## ✨ Fluxo de um Cadastro de Paciente

```
1. RECEPCIONISTA CLICA "NOVO PACIENTE"
                  ↓
2. FRONTEND ABRE MODAL/FORM
                  ↓
3. RECEPCIONISTA PREENCHE:
   - Nome
   - CPF
   - Email
   - Telefone
   - Clínica (automática)
                  ↓
4. FRONTEND ENVIA:
   POST /api/pacientes
   {
     "nome": "João Silva",
     "cpf": "12345678901",
     "email": "joao@email.com",
     "telefone": "11999999999",
     "clinica_id": 1
   }
   Header: "Authorization: Bearer <JWT_TOKEN>"
                  ↓
5. BACKEND VALIDA:
   ✓ Token válido?
   ✓ CPF único?
   ✓ Dados corretos?
                  ↓
6. INSERE NO BANCO:
   INSERT INTO pacientes (nome, cpf, ...) 
   VALUES (...)
                  ↓
7. RETORNA PACIENTE CRIADO
                  ↓
8. FRONTEND ATUALIZA LISTA
   setPacientes([...pacientes, novoPaciente])
                  ↓
9. MOSTRA TOAST: "Paciente criado com sucesso!"
                  ↓
10. USUARIO VÊ PACIENTE NA LISTA ✅
```

---

## 🚀 Padrão de Requisições

### Request (Frontend → Backend)
```javascript
// POST: Criar novo recurso
fetch('http://localhost:5000/api/pacientes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
  },
  body: JSON.stringify({
    nome: "João",
    cpf: "12345678901",
    clinica_id: 1
  })
})
```

### Response (Backend → Frontend)
```json
{
  "success": true,
  "paciente": {
    "id": 42,
    "nome": "João",
    "cpf": "12345678901",
    "email": null,
    "clinica_id": 1,
    "criado_em": "2026-01-16T14:30:00.000Z",
    "atualizado_em": "2026-01-16T14:30:00.000Z"
  }
}
```

---

## 🎯 Estados Gerenciados no Frontend

### AuthContext
```javascript
{
  usuarioLogado: {
    id: 1,
    nome: "Master",
    email: "master@biosystem.com",
    tipo: "master",
    clinica_id: null
  },
  usuarios: [...],        // Todos os usuários
  carregando: false,
  erro: null,
  login: async (email, senha) => {...},
  logout: async () => {...},
  adicionarUsuario: async (dados) => {...},
  editarUsuario: async (id, dados) => {...},
  excluirUsuario: async (id) => {...}
}
```

### DataContext
```javascript
{
  pacientes: [...],       // Filtrados por clínica
  prontuarios: [...],
  carregandoPacientes: false,
  carregandoProntuarios: false,
  cadastrarPaciente: async (dados) => {...},
  atualizarPaciente: async (id, dados) => {...},
  criarProntuario: async (dados) => {...},
  obterProntuarioPaciente: (pacienteId) => {...}
}
```

---

## 📈 Performance

### Índices do Banco
```sql
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX idx_pacientes_clinica ON pacientes(clinica_id);
CREATE INDEX idx_prontuarios_paciente ON prontuarios(paciente_id);
CREATE INDEX idx_fila_status ON fila_atendimento(status);
```

### Timeouts
```
JWT Expira: 7 dias
Pool conexões DB: 5 conexões
Request Timeout: 30 segundos
```

---

## 🔄 Atualizações em Tempo Real (Futuro)

Você pode adicionar:
- **WebSockets** (Socket.io) para chat entre médico/recepcionista
- **Polling** (atualizar a cada 30s) para fila
- **Server-Sent Events** para notificações

Exemplo com polling (já funciona):
```javascript
// Atualizar fila a cada 5 segundos
setInterval(() => carregarPacientes(), 5000);
```

---

**Tudo pronto! Vamos testar?** 🚀
