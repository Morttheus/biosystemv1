# 🚀 Deploy em Tempo Real - Instruções de Sincronização

## Status Atual
✅ **Código Local**: Atualizado com sincronização em tempo real
⚠️ **GitHub**: Pendente de push (problema de conectividade)
⏳ **Vercel**: Será acionado automaticamente após push para GitHub
⏳ **Railway**: Será acionado automaticamente após push para GitHub

## 📋 Commit Realizado Localmente

```bash
Commit: a4190fb
Mensagem: 🔄 Sincronização em tempo real: corrigir soft delete, verificação de duplicatas e adicionar headers no-cache
Data: 16 de Janeiro de 2026
```

### Arquivos Modificados (7):
1. ✅ `biosystem-backend/routes/usuarios.js` - Headers no-cache, filtro ativo
2. ✅ `biosystem-backend/routes/clinicas.js` - Verificação CNPJ ativo, headers no-cache
3. ✅ `biosystem-backend/routes/pacientes.js` - DELETE endpoint, headers no-cache
4. ✅ `biosystem-backend/routes/prontuarios.js` - Headers no-cache
5. ✅ `biosystem-backend/routes/fila-atendimento.js` - Headers no-cache
6. ✅ `biosystem-backend/server.js` - Middleware global no-cache
7. ✅ `SINCRONIZACAO_TEMPO_REAL.md` - Documentação completa

## ⚙️ Como Fazer Push para GitHub (3 Opções)

### Opção 1: Terminal PowerShell (Recomendado)
```powershell
cd "c:\Users\Gabriel Ferreira\Biosystem\biosystem"
git push origin main
```

### Opção 2: GitHub Desktop (Se instalado)
1. Abrir GitHub Desktop
2. Selecionar repositório "biosystemv1"
3. Clicar em "Push origin"

### Opção 3: VS Code Integrado
1. Abrir VS Code Source Control (Ctrl+Shift+G)
2. Clicar em "Push" (ícone de seta para cima)

## 🔗 Fluxo de Deploy Automático

Após push para GitHub, o seguinte ocorre automaticamente:

```
GitHub (Commit Push)
    ↓
Vercel (Frontend)
    ├─ Build automático
    ├─ Deploy em production
    └─ URL: https://biosystem.vercel.app

Railway (Backend)
    ├─ Build automático (detecta mudanças em biosystem-backend/)
    ├─ Deploy em production
    └─ URL: seu-app.railway.app
```

## 📝 Variáveis de Ambiente Necessárias

### Railway (Backend)
```
DATABASE_URL=postgresql://user:pass@postgres.railway.internal:5432/railway
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://seu-dominio.vercel.app
```

### Vercel (Frontend)
```
REACT_APP_API_URL=https://seu-backend.railway.app/api
```

## ✅ Checklist de Deploy

- [x] Código atualizado localmente
- [x] Commit realizado com mensagem descritiva
- [ ] Push para GitHub (Aguardando conectividade)
- [ ] Vercel detecta mudanças (automático)
- [ ] Railway detecta mudanças (automático)
- [ ] Frontend build bem-sucedido
- [ ] Backend build bem-sucedido
- [ ] Testes em produção

## 🧪 Como Testar em Produção

### 1. Test Usuários
```bash
curl -X GET https://seu-backend.railway.app/api/usuarios \
  -H "Authorization: Bearer seu-token"
```

### 2. Criar e Deletar
```bash
# Criar usuário
curl -X POST https://seu-backend.railway.app/api/usuarios \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu-token" \
  -d '{"nome":"Test","email":"test@example.com","senha":"123456","tipo":"medico","clinicaId":1}'

# Deletar usuário
curl -X DELETE https://seu-backend.railway.app/api/usuarios/1 \
  -H "Authorization: Bearer seu-token"

# Tentar criar novamente com mesmo email
# Deve permitir após soft delete
```

## 🔍 Monitoramento

### Railway Dashboard
1. Acesse: https://railway.app/dashboard
2. Selecione projeto "biosystem"
3. Abra aba "Deploy"
4. Verifique logs de build e runtime

### Vercel Dashboard
1. Acesse: https://vercel.com/dashboard
2. Selecione projeto "biosystem"
3. Verifique "Deployments"
4. Visualize logs de build

## 📊 Métricas de Sucesso

- ✅ Usuários podem ser deletados e recadastrados
- ✅ Clínicas podem reutilizar CNPJ após deleção
- ✅ Pacientes podem reutilizar CPF após deleção
- ✅ Dados aparecem em tempo real (sem cache)
- ✅ Sem erros de "já cadastrado" desnecessários

## 🆘 Troubleshooting

### Erro: "já existe um usuário com este email"
**Solução**: Verificar se não está com dados cacheados. Limpar cache:
```javascript
// No DevTools Console
localStorage.clear();
sessionStorage.clear();
// Ou pressionar Ctrl+Shift+Del para limpar cache do navegador
```

### Erro: "Failed to fetch"
**Solução**: Verificar se Railway está em execução
```powershell
# Testar conectividade
Invoke-WebRequest -Uri "https://seu-app.railway.app/api/health"
```

### Erro ao fazer push no GitHub
**Solução 1**: Verificar conexão
```powershell
Test-Connection github.com -Count 2
```

**Solução 2**: Atualizar credenciais
```powershell
git config credential.helper wincred
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs em Railway/Vercel
2. Verifique console do navegador (DevTools)
3. Limpe cache (Ctrl+Shift+Del)
4. Recarregue a página (Ctrl+F5)

---

**Última Atualização**: 16 de Janeiro de 2026
**Status**: Aguardando push para GitHub
**Próximo Passo**: Executar `git push origin main`
