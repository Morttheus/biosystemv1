# 🧪 GUIA DE TESTES MANUAIS - BIOSYSTEM

## Pré-requisitos
- ✅ Backend rodando em http://localhost:5000
- ✅ Frontend rodando em http://localhost:3000
- ✅ PostgreSQL conectado
- ✅ Navegador aberto em http://localhost:3000

---

## 🔐 TESTE 1: LOGIN E AUTENTICAÇÃO

### Passos:
1. Abra http://localhost:3000 no navegador
2. Você verá a tela de login
3. Preencha:
   - **Email:** `master@biosystem.com`
   - **Senha:** `123456`
4. Clique em **"Entrar"**

### Resultado Esperado:
✅ Login bem-sucedido  
✅ Redirecionado para dashboard  
✅ Token armazenado em localStorage  
✅ Usuário exibido no menu

### O que está testando:
- Conexão com API backend
- Validação de credenciais
- Geração de JWT token
- Persistência de sessão

---

## 👥 TESTE 2: CRIAR NOVO USUÁRIO

### Passos:
1. Login com master@biosystem.com
2. Vá para **"Gerenciar Usuários"** (menu ou dashboard)
3. Clique em **"Novo Usuário"**
4. Preencha:
   - **Nome:** Seu Nome Aqui
   - **Email:** seu.email@test.com
   - **Senha:** password123
   - **Tipo:** Selecione (admin/medico/recepcionista)
5. Clique em **"Criar Usuário"**

### Resultado Esperado:
✅ Usuário criado com sucesso  
✅ Mensagem de confirmação  
✅ Novo usuário aparece na lista  
✅ Senha salva com hash no BD

### Verificar no banco:
```sql
-- Execute no pgAdmin ou psql
SELECT id, nome, email, tipo FROM usuarios WHERE email = 'seu.email@test.com';
-- Deve retornar 1 resultado
```

---

## 🏥 TESTE 3: CRIAR NOVO PACIENTE

### Passos:
1. No dashboard, vá para **"Cadastro de Pacientes"**
2. Clique em **"Novo Paciente"**
3. Preencha:
   - **Nome:** João Silva
   - **CPF:** 123.456.789-10
   - **Data de Nascimento:** 01/01/1990
4. Clique em **"Salvar"**

### Resultado Esperado:
✅ Paciente criado com sucesso  
✅ Aparece na lista de pacientes  
✅ CPF validado como único  
✅ Dados salvos no PostgreSQL

### Verificar no banco:
```sql
SELECT id, nome, cpf FROM pacientes WHERE nome = 'João Silva';
-- Deve retornar 1 resultado
```

---

## 🔍 TESTE 4: BUSCAR PACIENTE POR CPF

### Passos:
1. No painel de **"Prontuários"**
2. Clique em **"Buscar Paciente"**
3. Digite CPF: `123.456.789-10`
4. Clique em **"Buscar"**

### Resultado Esperado:
✅ Paciente encontrado  
✅ Dados exibidos (nome, CPF, data nasc.)  
✅ Histórico de prontuários carregado  
✅ Opção de "Novo Prontuário" disponível

### O que está testando:
- Índice de CPF no banco
- Performance da busca
- Integração paciente-prontuário

---

## 📝 TESTE 5: CRIAR PRONTUÁRIO

### Passos:
1. Busque paciente por CPF (Teste 4)
2. Clique em **"Novo Prontuário"**
3. Preencha:
   - **Queixa Principal:** Dor de cabeça
   - **Diagnóstico:** Enxaqueca
   - **Prescrição:** Dipirona 500mg - 1 cp a cada 6h
   - **Observações:** Paciente com sensibilidade à luz
4. Clique em **"Salvar Prontuário"**

### Resultado Esperado:
✅ Prontuário criado com sucesso  
✅ Aparece no histórico do paciente  
✅ Data e hora automaticamente preenchidas  
✅ Médico (usuário logado) registrado  
✅ Dados salvos no PostgreSQL

### Verificar no banco:
```sql
SELECT id, queixa_principal, diagnostico FROM prontuarios 
WHERE paciente_id = (SELECT id FROM pacientes WHERE nome = 'João Silva');
-- Deve retornar 1 resultado
```

---

## ✏️ TESTE 6: EDITAR PRONTUÁRIO

### Passos:
1. No histórico do paciente, clique no prontuário criado
2. Clique em **"Editar"**
3. Modifique o diagnóstico para: `Enxaqueca severa`
4. Clique em **"Atualizar"**

### Resultado Esperado:
✅ Prontuário atualizado  
✅ Alteração refletida imediatamente  
✅ Alteração persistida no BD  
✅ Data de atualização registrada

---

## 🗑️ TESTE 7: DELETAR PRONTUÁRIO

### Passos:
1. No histórico do paciente, clique no prontuário
2. Clique em **"Deletar"** ou **"Remover"**
3. Confirme a exclusão

### Resultado Esperado:
✅ Prontuário removido da lista  
✅ Soft-delete no BD (data_deletado preenchida)  
✅ Dados não desaparecem da auditoria  
✅ Não pode mais ser editado

### Verificar no banco:
```sql
SELECT id, data_deletado FROM prontuarios 
WHERE paciente_id = (SELECT id FROM pacientes WHERE nome = 'João Silva');
-- Deve ter data_deletado preenchida
```

---

## 👤 TESTE 8: EDITAR USUÁRIO

### Passos:
1. Vá para **"Gerenciar Usuários"**
2. Clique no usuário criado no Teste 2
3. Clique em **"Editar"**
4. Modifique o nome para: `Nome Atualizado`
5. Clique em **"Atualizar"**

### Resultado Esperado:
✅ Usuário atualizado com sucesso  
✅ Novo nome exibido na lista  
✅ Alteração persistida no BD

---

## 🗑️ TESTE 9: DELETAR USUÁRIO

### Passos:
1. Vá para **"Gerenciar Usuários"**
2. Clique no usuário criado no Teste 2
3. Clique em **"Deletar"** ou **"Remover"**
4. Confirme a exclusão

### Resultado Esperado:
✅ Usuário removido da lista ativa  
✅ Campo `ativo` = false no BD  
✅ Usuário não pode mais fazer login  
✅ Dados preservados para auditoria

### Verificar no banco:
```sql
SELECT id, nome, ativo FROM usuarios WHERE email = 'seu.email@test.com';
-- Deve retornar ativo = false
```

---

## 📺 TESTE 10: PAINEL DE SALA DE ESPERA

### Passos:
1. Clique em **"Painel"** no menu
2. Você verá a tela de **"Sala de Espera"**
3. Observe a fila de atendimento
4. Veja pacientes em fila

### Resultado Esperado:
✅ Painel carrega corretamente  
✅ Fila de atendimento exibida  
✅ Status dos pacientes visível  
✅ Integração com dados do BD

### O que está testando:
- Integração painel ↔ database
- Display em tempo real
- Dados corretos por clínica

---

## 💾 TESTE 11: PERSISTÊNCIA DE DADOS

### Passos:
1. Crie um paciente (Teste 3)
2. Crie um prontuário (Teste 5)
3. Feche o navegador completamente
4. Reabre http://localhost:3000
5. Faça login novamente
6. Vá para "Prontuários"
7. Busque o paciente criado

### Resultado Esperado:
✅ Paciente ainda existe  
✅ Prontuário ainda existe  
✅ Todos os dados intactos  
✅ Nada foi perdido

### O que está testando:
- Persistência no PostgreSQL
- Carregamento ao login
- Dados não armazenados em memória

---

## 🔄 TESTE 12: MÚLTIPLOS USUÁRIOS

### Passos:
1. Crie 2 usuários (Teste 2) com emails diferentes
2. Logout do usuário master
3. Faça login com primeiro usuário criado
4. Crie um paciente
5. Logout
6. Faça login com segundo usuário
7. Verifique que vê o paciente criado

### Resultado Esperado:
✅ Cada usuário tem sessão separada  
✅ Dados compartilhados por clínica  
✅ Sem conflito de permissões  
✅ Múltiplos usuários podem usar simultaneamente

---

## 🐛 TESTE 13: VALIDAÇÕES E ERROS

### Teste 13a: Email Duplicado
1. Tente criar usuário com email já existente
2. Resultado esperado: ❌ Erro "Email já existe"

### Teste 13b: CPF Duplicado
1. Tente criar paciente com CPF já existente
2. Resultado esperado: ❌ Erro "CPF já cadastrado"

### Teste 13c: Login com senha errada
1. Tente fazer login com senha incorreta
2. Resultado esperado: ❌ Erro "Email ou senha inválidos"

### Teste 13d: Campo vazio
1. Tente criar usuário sem preencher nome
2. Resultado esperado: ❌ Aviso "Campo obrigatório"

---

## 🌐 TESTE 14: VERIFICAÇÃO DE REDE

### Passos:
1. Abra Developer Tools (F12)
2. Vá para aba **"Network"**
3. Faça um login
4. Observe requisições

### Resultado Esperado:
✅ Requisição POST para `/api/auth/login`  
✅ Status 200 OK  
✅ Response com token JWT  
✅ Token armazenado em localStorage

### Verificar Token:
1. Console (F12)
2. Digite: `localStorage.getItem('token')`
3. Deve retornar token JWT (eyJ...)

---

## ✅ CHECKLIST DE TESTES COMPLETO

- [ ] Teste 1: Login funciona
- [ ] Teste 2: Criar usuário funciona
- [ ] Teste 3: Criar paciente funciona
- [ ] Teste 4: Buscar por CPF funciona
- [ ] Teste 5: Criar prontuário funciona
- [ ] Teste 6: Editar prontuário funciona
- [ ] Teste 7: Deletar prontuário funciona
- [ ] Teste 8: Editar usuário funciona
- [ ] Teste 9: Deletar usuário funciona
- [ ] Teste 10: Painel de sala de espera funciona
- [ ] Teste 11: Persistência de dados funciona
- [ ] Teste 12: Múltiplos usuários funcionam
- [ ] Teste 13: Validações funcionam
- [ ] Teste 14: Rede está correta

---

## 🎉 RESULTADO FINAL

Se todos os testes passarem:

### ✅ SISTEMA ESTÁ PRONTO PARA PRODUÇÃO!

**Próximos passos:**
1. Backup do banco de dados
2. Deploy em servidor de produção
3. Configurar HTTPS
4. Implementar logs centralizados
5. Configurar monitoramento

---

**Última atualização:** 16 de Janeiro de 2026
