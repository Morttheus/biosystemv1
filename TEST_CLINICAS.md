# Teste de Clínicas - Guia de Validação

## Problema Relatado
Clínica é cadastrada com sucesso (mostra mensagem) mas não salva no banco de dados.

## Causa Identificada
1. **Problema Principal**: O estado das clínicas era inicializado com dados hardcoded e nunca era recarregado do backend
   - Quando você criava uma clínica, ela era adicionada apenas ao estado local
   - Se a página fosse atualizada, o estado voltava para os dados hardcoded
   - Outros usuários não veriam a clínica criada

2. **Logs de Debug**: Adicionados para rastrear a execução em 3 camadas:
   - Backend: `biosystem-backend/routes/clinicas.js` - logs do POST
   - Conexão: `biosystem-backend/db/connection.js` - logs de conexão
   - Frontend: `src/context/DataContext.jsx` - logs do fluxo de dados

3. **Solução Implementada**: 
   - Adicionado `useEffect` para carregar clínicas do backend quando usuário faz login
   - Agora clínicas são sempre sincronizadas com o banco de dados

## Passos para Validar a Correção

### 1. Deploy das Mudanças
```bash
# Frontend
npm run build

# Backend
node biosystem-backend/server.js
```

### 2. Teste Manual
1. Abra o navegador e vá para: `http://localhost:3000`
2. Faça login com qualquer conta
3. Vá para a tela de administração (Master)
4. Clique em "Clínicas"
5. Preencha o formulário de nova clínica:
   - Nome: "Clínica Teste 2024"
   - Endereço: "Rua Teste, 123"
   - Telefone: "(11) 1234-5678"
6. Clique em "Salvar"

### 3. Validações a Fazer

#### 3.1 Console do Navegador (F12)
Você deve ver logs assim:
```
📝 [DataContext] Enviando clínica para API: { nome: "Clínica Teste 2024", ... }
📡 [POST] http://localhost:5000/api/clinicas
📊 [DataContext] Resposta da API: { message: "...", clinica: { id: X, nome: "...", ... } }
✅ [DataContext] Clínica recebida, atualizando estado: { id: X, nome: "...", ... }
```

#### 3.2 Console do Backend (Terminal)
Você deve ver logs assim:
```
📝 [POST /clinicas] Recebido: { nome: "Clínica Teste 2024", ... }
✅ [POST /clinicas] Clínica criada: { id: X, nome: "Clínica Teste 2024", ... }
```

#### 3.3 Validação no Banco de Dados
Conecte ao PostgreSQL:
```sql
-- Verifique se a clínica foi inserida
SELECT * FROM clinicas WHERE nome = 'Clínica Teste 2024';

-- Deve retornar uma linha com os dados inseridos
```

#### 3.4 Teste de Persistência
1. Após criar a clínica, atualize a página (F5)
2. Faça login novamente
3. Vá para Clínicas novamente
4. A "Clínica Teste 2024" deve aparecer na lista
   - ✅ Se aparecer: Problema resolvido! Clínica persiste no banco
   - ❌ Se não aparecer: Problema ainda existe, verifique os logs

#### 3.5 Teste em Outra Aba/Janela
1. Abra uma segunda aba do navegador
2. Acesse `http://localhost:3000` e faça login
3. Vá para Clínicas
4. A "Clínica Teste 2024" deve aparecer mesmo sem ter criado nesta aba
   - ✅ Se aparecer: Dados estão sendo carregados do backend
   - ❌ Se não aparecer: useEffect não está sendo chamado

## Modificações Realizadas

### 1. `src/context/DataContext.jsx`
```javascript
// ANTES: Clínicas carregadas apenas com dados hardcoded
const [clinicas, setClinicas] = useState([...]);

// DEPOIS: Função para carregar clínicas do backend
const carregarClinicas = async () => {
  try {
    console.log('🔄 [DataContext] Carregando clínicas da API...');
    const lista = await apiService.listarClinicas();
    console.log('✅ [DataContext] Clínicas carregadas:', lista);
    setClinicas(lista);
  } catch (err) {
    console.error('❌ [DataContext] Erro ao carregar clínicas:', err);
    toast.error('Erro ao carregar clínicas');
  }
};

// ANTES: useEffect não carregava clínicas
useEffect(() => {
  if (usuarioLogado) {
    carregarPacientes();
    carregarProntuarios();
    // ... outras funções
  }
}, [usuarioLogado]);

// DEPOIS: useEffect agora chama carregarClinicas
useEffect(() => {
  if (usuarioLogado) {
    carregarClinicas();      // <- ADICIONADO
    carregarPacientes();
    carregarProntuarios();
    // ... outras funções
  }
}, [usuarioLogado]);
```

### 2. `biosystem-backend/routes/clinicas.js`
```javascript
// ADICIONADO: Log de debug ao receber POST
console.log('📝 [POST /clinicas] Recebido:', { nome, endereco, telefone, email, cnpj });

// ADICIONADO: Log ao criar clínica com sucesso
console.log('✅ [POST /clinicas] Clínica criada:', resultado.rows[0]);

// ADICIONADO: Log ao erro
console.error('❌ [POST /clinicas] Erro ao criar clínica:', erro);
```

### 3. `biosystem-backend/db/connection.js`
```javascript
// ANTES: Log simples
console.log('respondendo');

// DEPOIS: Log detalhado com informações de conexão
console.log('❌ [DB Connection] Erro:', erro.message);
console.log('Configuração: host=' + host + ', port=' + port + ', database=' + database + ', user=' + user);
```

## Próximos Passos

Se os testes passarem:
- ✅ Problema está resolvido
- ✅ Fazer commit e push
- ✅ Deploy em produção

Se os testes falharem:
- ❌ Verificar qual log não aparece
- ❌ Se backend não recebe POST: problema na requisição do frontend
- ❌ Se POST não persiste: problema na query do banco
- ❌ Se frontend não carrega: problema no useEffect
- ❌ Abrir issue ou debugar problema específico

## Checklist de Testes

- [ ] Backend rodando e respondendo
- [ ] Frontend rodando
- [ ] Login funciona
- [ ] Console mostra logs de "Carregando clínicas da API"
- [ ] Criar nova clínica com sucesso
- [ ] Console mostra todos os logs do POST
- [ ] Backend mostra logs de criação
- [ ] Clínica aparece na tabela
- [ ] Atualizar página (F5)
- [ ] Clínica ainda está lá após refresh
- [ ] Abrir em nova aba
- [ ] Clínica aparece sem criar novamente
- [ ] Banco de dados tem a clínica
