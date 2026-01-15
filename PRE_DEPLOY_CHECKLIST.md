# Script de Verificação Pré-Deploy

Checklist completo de verificações antes de fazer deploy.

## 📋 Verificações Automáticas

Para rodar verificações automáticas, execute:

```bash
# Verificar dependências
npm audit

# Build de teste
npm run build

# Testar build production (sem sourcemaps)
npm run build:prod

# Verificar se não há console.logs em produção
grep -r "console\." src/
```

## 🔧 Verificações Manuais

### 1. Código-Fonte
- [ ] Sem `console.log()` ou `console.error()` em produção
- [ ] Sem credenciais hardcoded (senhas, tokens, chaves)
- [ ] Sem `TODO` ou `FIXME` não resolvidos críticos
- [ ] Sem imports não utilizados

### 2. Configuração
- [ ] `package.json` tem versão correta
- [ ] `vercel.json` configurado (já está ✅)
- [ ] `.env.example` atualizado
- [ ] `.gitignore` inclui `.env*`

### 3. Arquivos Essenciais
- [ ] `public/index.html` com meta tags
- [ ] `public/manifest.json` correto
- [ ] `public/favicon.ico` presente
- [ ] `public/robots.txt` configurado

### 4. Build Otimização
- [ ] Build sem warnings
- [ ] Tamanho do bundle razoável (<500KB)
- [ ] Assets estáticos cachados corretamente
- [ ] CSS Tailwind otimizado

### 5. Segurança
- [ ] Headers de segurança no `vercel.json` ✅
- [ ] CORS configurado se necessário
- [ ] Sem dados sensíveis em localStorage sem encriptação
- [ ] SPA fallback configurado ✅

### 6. Performance
- [ ] Imagens otimizadas
- [ ] Nenhum script síncrono bloqueante
- [ ] Code splitting implementado (opcional)
- [ ] Service Worker configurado (opcional)

### 7. Testes
- [ ] Todas as rotas testadas
- [ ] Autenticação funcionando
- [ ] Formulários validados
- [ ] Erros tratados gracefully

### 8. Documentação
- [ ] README.md atualizado
- [ ] GUIA_DEPLOY_VERCEL.md presente ✅
- [ ] DEPLOY_CHECKLIST.md presente ✅
- [ ] Endpoints da API documentados (quando integrados)

## 🚨 Problemas Comuns

### Build falha
```bash
# Limpar node_modules
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erros de CORS
- Verificar se API está retornando headers CORS corretos
- Usar proxy no vercel.json se necessário

### Branco/erro ao carregar
- Verificar console (F12)
- Checar se React está carregando
- Verificar se vercel.json tem fallback para /index.html

### Performance lenta
- Analisar Network tab do DevTools
- Verificar tamanho de assets
- Implementar code splitting se necessário

## ✅ Antes de Fazer Push

```bash
# 1. Verificar status git
git status

# 2. Fazer commit final
git add .
git commit -m "Deploy final - v0.1.0"

# 3. Push para origin
git push origin main

# 4. Verificar remoto
git remote -v
```

## 🚀 Fazer Deploy

```bash
# Opção 1: Via GitHub (recomendado)
# Vercel detecta automaticamente quando push é feito em main

# Opção 2: Via CLI
npm install -g vercel
vercel --prod

# Opção 3: Via Dashboard
# Acessar https://vercel.com/new
```

## 📊 Pós-Deploy

- [ ] URL aberta no navegador funciona
- [ ] Todos os usuários de teste conseguem fazer login
- [ ] Navegação entre telas funciona
- [ ] Nenhum erro no console (F12)
- [ ] Performance aceitável (< 3 segundos para carregar)
- [ ] Layout responsivo em mobile
- [ ] HTTPS ativo (automático no Vercel ✅)

## 📞 Suporte

Se algo dar errado:

1. Verificar logs no Vercel: https://vercel.com/dashboard
2. Rodar `npm run build` localmente para replicar erro
3. Verificar console do navegador (F12)
4. Checar variáveis de ambiente no Vercel Dashboard

---

**Status**: ✅ Pronto para Deploy
**Última atualização**: 15/01/2026
