# 🚀 GUIA PRÁTICO: BioSystem em Produção
## Opção 2 - Backend Node.js + PostgreSQL

---

# PARTE 1: SETUP LOCAL (Desenvolvimento)

## PASSO 1️⃣: Criar Backend Node.js

### 1.1 - Criar pasta do backend (fora do projeto React)
```bash
# No Windows PowerShell, na pasta pai
cd c:\Users\Gabriel Ferreira\Biosystem
mkdir biosystem-backend
cd biosystem-backend
```

### 1.2 - Inicializar Node.js
```bash
npm init -y
```

### 1.3 - Instalar dependências
```bash
npm install express cors dotenv pg bcryptjs jsonwebtoken uuid
npm install --save-dev nodemon
```

### 1.4 - Criar arquivo `.env` (configurações)
Crie arquivo `.env` na raiz do backend com:
```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=biosystem_db
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# API
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=sua_chave_secreta_aqui_minimo_32_caracteres_aleatorios
JWT_EXPIRE=7d
```

### 1.5 - Criar arquivo `package.json` scripts
Edite o `package.json` e mude a seção `"scripts"`:
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

---

## PASSO 2️⃣: Instalar PostgreSQL

### 2.1 - Download PostgreSQL
Baixe em: https://www.postgresql.org/download/windows/

Escolha versão 14 ou 15.

### 2.2 - Instalar
- Execute o instalador
- **Importante**: Anote a senha do usuário `postgres`
- Porta padrão: 5432
- Marque "Stack Builder" ao final

### 2.3 - Verificar instalação
Abra PowerShell e teste:
```bash
psql -U postgres
```

Se funcionar, você está logado. Saia com:
```bash
\q
```

---

## PASSO 3️⃣: Criar Banco de Dados

### 3.1 - Conectar ao PostgreSQL
```bash
psql -U postgres
```

### 3.2 - Criar banco e usuário
```sql
-- Criar banco
CREATE DATABASE biosystem_db;

-- Criar usuário
CREATE USER biosystem_user WITH PASSWORD 'sua_senha_aqui';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE biosystem_db TO biosystem_user;

-- Sair
\q
```

### 3.3 - Conectar ao banco novo
```bash
psql -U biosystem_user -d biosystem_db
```

Se funcionar, saia com `\q`.

---

## PASSO 4️⃣: Criar Estrutura do Backend

Crie os seguintes arquivos na pasta `biosystem-backend`:

### 4.1 - Arquivo: `server.js`
```javascript
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://seu-site-vercel.vercel.app'],
  credentials: true
}));
app.use(express.json());

// Pool de conexão com banco
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Testar conexão
pool.on('error', (err) => {
  console.error('Erro no pool:', err);
});

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend está rodando!' });
});

// Importar rotas (você criará essas)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/prontuarios', require('./routes/prontuarios'));

// Erro 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
  console.log(`✓ Banco de dados conectado`);
});

module.exports = { pool };
```

### 4.2 - Arquivo: `utils/db.js`
```javascript
// utils/db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
```

### 4.3 - Arquivo: `utils/auth.js`
```javascript
// utils/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Gerar token JWT
const gerarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Verificar token
const verificarToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Middleware para autenticação
const autenticado = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const decoded = verificarToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  req.usuario = decoded;
  next();
};

// Hash de senha
const hashSenha = async (senha) => {
  return bcrypt.hash(senha, 10);
};

// Comparar senhas
const compararSenhas = async (senha, hash) => {
  return bcrypt.compare(senha, hash);
};

module.exports = { gerarToken, verificarToken, autenticado, hashSenha, compararSenhas };
```

---

## PASSO 5️⃣: Criar Tabelas do Banco de Dados

### 5.1 - Conectar ao banco
```bash
psql -U biosystem_user -d biosystem_db
```

### 5.2 - Criar tabelas
```sql
-- Tabela de Usuários
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('master', 'admin', 'medico', 'usuario', 'painel')),
  clinica_id INTEGER,
  medico_id INTEGER,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Clínicas
CREATE TABLE clinicas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco VARCHAR(255),
  telefone VARCHAR(20),
  ativa BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Médicos
CREATE TABLE medicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  crm VARCHAR(50) UNIQUE NOT NULL,
  especialidade VARCHAR(255),
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Pacientes
CREATE TABLE pacientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  data_nascimento DATE,
  endereco VARCHAR(255),
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Prontuários
CREATE TABLE prontuarios (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
  medico_id INTEGER NOT NULL REFERENCES medicos(id),
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  queixa_principal TEXT,
  diagnostico TEXT,
  prescricao TEXT,
  observacoes TEXT,
  data_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Fila de Atendimento
CREATE TABLE fila_atendimento (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER NOT NULL REFERENCES pacientes(id),
  medico_id INTEGER NOT NULL REFERENCES medicos(id),
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id),
  status VARCHAR(50) DEFAULT 'aguardando',
  horario_chegada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  horario_atendimento TIMESTAMP,
  horario_finalizacao TIMESTAMP,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX idx_pacientes_clinica ON pacientes(clinica_id);
CREATE INDEX idx_prontuarios_paciente ON prontuarios(paciente_id);
CREATE INDEX idx_fila_status ON fila_atendimento(status);

\q
```

---

## PASSO 6️⃣: Criar Rotas (APIs)

### 6.1 - Criar pasta de rotas
```bash
mkdir routes utils
```

### 6.2 - Arquivo: `routes/auth.js`
```javascript
// routes/auth.js
const express = require('express');
const { query } = require('../utils/db');
const { gerarToken, hashSenha, compararSenhas, autenticado } = require('../utils/auth');

const router = express.Router();

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const result = await query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const senhaValida = await compararSenhas(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = gerarToken(usuario);
    const { senha: _, ...usuarioSemSenha } = usuario;

    res.json({ success: true, token, usuario: usuarioSemSenha });
  } catch (err) {
    console.error('Erro login:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// REGISTRAR NOVO USUÁRIO
router.post('/registrar', autenticado, async (req, res) => {
  try {
    const { nome, email, senha, tipo, clinica_id } = req.body;

    if (!nome || !email || !senha || !tipo) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, email, senha, tipo' });
    }

    // Verificar se email existe
    const existente = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await hashSenha(senha);

    // Inserir usuário
    const result = await query(
      `INSERT INTO usuarios (nome, email, senha, tipo, clinica_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, tipo, clinica_id`,
      [nome, email, senhaHash, tipo, clinica_id]
    );

    const novoUsuario = result.rows[0];
    res.status(201).json({ success: true, usuario: novoUsuario });
  } catch (err) {
    console.error('Erro registrar:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// VERIFICAR TOKEN
router.get('/me', autenticado, (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;
```

### 6.3 - Arquivo: `routes/usuarios.js`
```javascript
// routes/usuarios.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado, hashSenha } = require('../utils/auth');

const router = express.Router();

// LISTAR USUÁRIOS
router.get('/', autenticado, async (req, res) => {
  try {
    const { clinica_id } = req.query;
    let sql = 'SELECT id, nome, email, tipo, clinica_id, ativo FROM usuarios';
    let params = [];

    if (clinica_id) {
      sql += ' WHERE clinica_id = $1';
      params = [clinica_id];
    }

    const result = await query(sql + ' ORDER BY criado_em DESC', params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro listar usuários:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// OBTER USUÁRIO POR ID
router.get('/:id', autenticado, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, nome, email, tipo, clinica_id, ativo FROM usuarios WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro obter usuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR USUÁRIO
router.put('/:id', autenticado, async (req, res) => {
  try {
    const { nome, email, tipo, clinica_id, ativo } = req.body;
    
    const result = await query(
      `UPDATE usuarios 
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           tipo = COALESCE($3, tipo),
           clinica_id = COALESCE($4, clinica_id),
           ativo = COALESCE($5, ativo),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, nome, email, tipo, clinica_id, ativo`,
      [nome, email, tipo, clinica_id, ativo, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ success: true, usuario: result.rows[0] });
  } catch (err) {
    console.error('Erro atualizar usuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// DELETAR USUÁRIO (desativar)
router.delete('/:id', autenticado, async (req, res) => {
  try {
    const result = await query(
      'UPDATE usuarios SET ativo = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ success: true, message: 'Usuário desativado' });
  } catch (err) {
    console.error('Erro deletar usuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
```

### 6.4 - Arquivo: `routes/pacientes.js`
```javascript
// routes/pacientes.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// LISTAR PACIENTES
router.get('/', autenticado, async (req, res) => {
  try {
    const { clinica_id } = req.query;
    let sql = 'SELECT * FROM pacientes';
    let params = [];

    if (clinica_id) {
      sql += ' WHERE clinica_id = $1';
      params = [clinica_id];
    }

    const result = await query(sql + ' ORDER BY criado_em DESC', params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro listar pacientes:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// BUSCAR PACIENTE POR CPF
router.get('/cpf/:cpf', autenticado, async (req, res) => {
  try {
    const cpf = req.params.cpf.replace(/\D/g, '');
    const result = await query(
      'SELECT * FROM pacientes WHERE cpf = $1',
      [cpf]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro buscar paciente:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// CADASTRAR PACIENTE
router.post('/', autenticado, async (req, res) => {
  try {
    const { nome, cpf, email, telefone, data_nascimento, endereco, clinica_id } = req.body;

    if (!nome || !cpf || !clinica_id) {
      return res.status(400).json({ error: 'Nome, CPF e clínica são obrigatórios' });
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    
    // Verificar se já existe
    const existente = await query('SELECT id FROM pacientes WHERE cpf = $1', [cpfLimpo]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Paciente já cadastrado com este CPF' });
    }

    const result = await query(
      `INSERT INTO pacientes (nome, cpf, email, telefone, data_nascimento, endereco, clinica_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nome, cpfLimpo, email, telefone, data_nascimento, endereco, clinica_id]
    );

    res.status(201).json({ success: true, paciente: result.rows[0] });
  } catch (err) {
    console.error('Erro cadastrar paciente:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR PACIENTE
router.put('/:id', autenticado, async (req, res) => {
  try {
    const { nome, email, telefone, data_nascimento, endereco } = req.body;
    
    const result = await query(
      `UPDATE pacientes
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           telefone = COALESCE($3, telefone),
           data_nascimento = COALESCE($4, data_nascimento),
           endereco = COALESCE($5, endereco),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [nome, email, telefone, data_nascimento, endereco, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json({ success: true, paciente: result.rows[0] });
  } catch (err) {
    console.error('Erro atualizar paciente:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
```

### 6.5 - Arquivo: `routes/prontuarios.js`
```javascript
// routes/prontuarios.js
const express = require('express');
const { query } = require('../utils/db');
const { autenticado } = require('../utils/auth');

const router = express.Router();

// LISTAR PRONTUÁRIOS
router.get('/', autenticado, async (req, res) => {
  try {
    const { paciente_id, clinica_id } = req.query;
    let sql = 'SELECT * FROM prontuarios';
    let params = [];

    if (paciente_id) {
      sql += ' WHERE paciente_id = $1';
      params = [paciente_id];
    } else if (clinica_id) {
      sql += ' WHERE clinica_id = $1';
      params = [clinica_id];
    }

    const result = await query(sql + ' ORDER BY data_consulta DESC', params);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro listar prontuários:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// CRIAR PRONTUÁRIO
router.post('/', autenticado, async (req, res) => {
  try {
    const { paciente_id, medico_id, clinica_id, queixa_principal, diagnostico, prescricao, observacoes } = req.body;

    if (!paciente_id || !medico_id || !clinica_id) {
      return res.status(400).json({ error: 'Paciente, médico e clínica são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO prontuarios (paciente_id, medico_id, clinica_id, queixa_principal, diagnostico, prescricao, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [paciente_id, medico_id, clinica_id, queixa_principal, diagnostico, prescricao, observacoes]
    );

    res.status(201).json({ success: true, prontuario: result.rows[0] });
  } catch (err) {
    console.error('Erro criar prontuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// ATUALIZAR PRONTUÁRIO
router.put('/:id', autenticado, async (req, res) => {
  try {
    const { queixa_principal, diagnostico, prescricao, observacoes } = req.body;
    
    const result = await query(
      `UPDATE prontuarios
       SET queixa_principal = COALESCE($1, queixa_principal),
           diagnostico = COALESCE($2, diagnostico),
           prescricao = COALESCE($3, prescricao),
           observacoes = COALESCE($4, observacoes),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [queixa_principal, diagnostico, prescricao, observacoes, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prontuário não encontrado' });
    }

    res.json({ success: true, prontuario: result.rows[0] });
  } catch (err) {
    console.error('Erro atualizar prontuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// DELETAR PRONTUÁRIO
router.delete('/:id', autenticado, async (req, res) => {
  try {
    const result = await query('DELETE FROM prontuarios WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prontuário não encontrado' });
    }

    res.json({ success: true, message: 'Prontuário deletado' });
  } catch (err) {
    console.error('Erro deletar prontuário:', err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;
```

---

## PASSO 7️⃣: Testar Backend Localmente

### 7.1 - Iniciar backend
Na pasta `biosystem-backend`:
```bash
npm run dev
```

Você verá:
```
🚀 Backend rodando em http://localhost:5000
✓ Banco de dados conectado
```

### 7.2 - Testar API com cURL
Em outro PowerShell:
```bash
# Testar health
curl http://localhost:5000/api/health

# Deve retornar: {"status":"OK","message":"Backend está rodando!"}
```

---

# PARTE 2: INTEGRAR FRONTEND COM BACKEND

## PASSO 8️⃣: Criar Serviço de API no Frontend

Na pasta `src`, crie pasta `services` e arquivo `api.js`:

```javascript
// src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getAuthHeader() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    };
  }

  async request(method, endpoint, data = null) {
    try {
      const options = {
        method,
        headers: this.getAuthHeader(),
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_URL}${endpoint}`, options);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro na requisição');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Auth
  async login(email, senha) {
    return this.request('POST', '/auth/login', { email, senha });
  }

  // Usuários
  async listarUsuarios(clinicaId = null) {
    const query = clinicaId ? `?clinica_id=${clinicaId}` : '';
    return this.request('GET', `/usuarios${query}`);
  }

  async obterUsuario(id) {
    return this.request('GET', `/usuarios/${id}`);
  }

  async criarUsuario(dados) {
    return this.request('POST', '/auth/registrar', dados);
  }

  async atualizarUsuario(id, dados) {
    return this.request('PUT', `/usuarios/${id}`, dados);
  }

  async deletarUsuario(id) {
    return this.request('DELETE', `/usuarios/${id}`);
  }

  // Pacientes
  async listarPacientes(clinicaId = null) {
    const query = clinicaId ? `?clinica_id=${clinicaId}` : '';
    return this.request('GET', `/pacientes${query}`);
  }

  async buscarPacienteCPF(cpf) {
    return this.request('GET', `/pacientes/cpf/${cpf}`);
  }

  async criarPaciente(dados) {
    return this.request('POST', '/pacientes', dados);
  }

  async atualizarPaciente(id, dados) {
    return this.request('PUT', `/pacientes/${id}`, dados);
  }

  // Prontuários
  async listarProntuarios(pacienteId = null, clinicaId = null) {
    let query = '?';
    if (pacienteId) query += `paciente_id=${pacienteId}`;
    if (clinicaId) query += `clinica_id=${clinicaId}`;
    return this.request('GET', `/prontuarios${query === '?' ? '' : query}`);
  }

  async criarProntuario(dados) {
    return this.request('POST', '/prontuarios', dados);
  }

  async atualizarProntuario(id, dados) {
    return this.request('PUT', `/prontuarios/${id}`, dados);
  }

  async deletarProntuario(id) {
    return this.request('DELETE', `/prontuarios/${id}`);
  }
}

export default new ApiService();
```

## PASSO 9️⃣: Adicionar URL da API no .env do Frontend

Crie arquivo `.env` na raiz do projeto React:
```
REACT_APP_API_URL=http://localhost:5000/api
```

Para produção, será:
```
REACT_APP_API_URL=https://seu-backend.vercel.app/api
```

## PASSO 10️⃣: Atualizar AuthContext para usar API

Você precisará modificar `src/context/AuthContext.jsx` para:
1. Fazer login via API
2. Salvar token no localStorage
3. Carregar dados do servidor

(Continuaremos na próxima etapa...)

---

# PARTE 3: DEPLOY EM PRODUÇÃO

## PASSO 11: Deploy Backend (Render ou Railway)

### Opção A: Render.com
1. Ir em render.com e criar conta
2. Conectar repositório GitHub
3. Criar novo "Web Service"
4. Apontar para pasta `biosystem-backend`
5. Variáveis de ambiente (mesmo do .env)

### Opção B: Railway.app
1. Ir em railway.app e criar conta
2. Conectar GitHub
3. Novo projeto
4. Deploy automático

## PASSO 12: Deploy Banco de Dados

### Opção A: Render Database (Recomendado)
1. Em render.com, criar "PostgreSQL"
2. Copiar connection string
3. Usar no backend

### Opção B: Supabase.com
1. Criar conta em supabase.com
2. Novo projeto
3. Copiar URL e chave

## PASSO 13: Atualizar Frontend

Mudar `.env`:
```
REACT_APP_API_URL=https://seu-backend-render.onrender.com/api
```

---

**Próximo passo: Quer que eu ajude com alguma etapa específica?**

Digite qual passo quer iniciar:
- [ ] Passo 1-3: Setup PostgreSQL
- [ ] Passo 4-6: Criar Backend
- [ ] Passo 8-10: Integrar Frontend
- [ ] Passo 11-13: Deploy
