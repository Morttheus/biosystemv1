# ⚡ COMECE AQUI - 5 MINUTOS

## 🎯 O que você precisa fazer AGORA:

### 1. Abra 2 abas de PowerShell

### 2. ABA 1: Setup Banco de Dados
```powershell
cd "c:\Users\Gabriel Ferreira\Biosystem\biosystem-backend"
.\setup_db.bat
```

**Digite a senha do PostgreSQL que você anotou**
(Provavelmente: a senha que colocou na instalação)

Espere aparecer:
```
====================================
Setup concluido com sucesso!
====================================
```

### 3. ABA 1: Iniciar Backend
```powershell
npm run dev
```

Espere aparecer:
```
🚀 Backend rodando em http://localhost:5000
✓ Conectado ao banco de dados
```

✅ **Deixe rodando**

---

### 4. ABA 2: Iniciar Frontend
```powershell
cd "c:\Users\Gabriel Ferreira\Biosystem\biosystem"
npm start
```

Espere aparecer:
```
Compiled successfully!
Localhost: http://localhost:3000
```

---

## 5️⃣ Abra no navegador

Acesse: **http://localhost:3000**

---

## 🔑 Login com:

| Campo | Valor |
|-------|-------|
| Email | master@biosystem.com |
| Senha | 123456 |

---

## ✅ Teste cada funcionalidade:

- [ ] **Login** - Entrar no sistema
- [ ] **Dashboard** - Ver tela principal
- [ ] **Novo Usuário** - Criar novo usuário
- [ ] **Novo Paciente** - Cadastrar paciente
- [ ] **Prontuário** - Criar prontuário eletrônico
- [ ] **Painel** - Login como painel@biosystem.com
- [ ] **Logout** - Sair do sistema

---

## ❌ Se deu erro?

### Erro: "Conexão recusada"
```powershell
# Verificar PostgreSQL
psql -U postgres
# Se funcionar, saia com: \q
# Se não funcionar, inicie o PostgreSQL
```

### Erro: "Banco de dados não existe"
```powershell
cd "c:\Users\Gabriel Ferreira\Biosystem\biosystem-backend"
.\setup_db.bat
# Digite a senha novamente
```

### Erro: "Cannot GET /api/health"
```powershell
# Backend não está rodando
# Verifique ABA 1 (Backend)
# Se tiver erro, leia a mensagem
```

---

## 📚 Documentação Completa

Depois de testar, leia:
- `IMPLEMENTACAO_COMPLETA.md` - Visão geral
- `READY_TO_USE.md` - Guia de uso
- `GUIA_PRODUCAO_PASSO_A_PASSO.md` - Setup detalhado

---

**Tudo pronto? Vamos aos testes!**

(Se precisar de ajuda, me chama!)
