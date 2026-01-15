# 🚀 GUIA PASSO A PASSO: DEPLOY NO VERCEL

## Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Git instalado
- Node.js 18+ instalado
- Repositório GitHub (recomendado)

---

## Opção 1: Deploy via GitHub (RECOMENDADO)

### Passo 1: Preparar o repositório Git
```bash
# Se ainda não é um repositório git
cd c:\Users\Gabriel Ferreira\Biosystem\biosystem
git init
git add .
git commit -m "Deploy inicial - Biosystem v0.1.0"

# Se já é repositório, fazer push final
git push origin main
```

### Passo 2: Conectar ao Vercel
1. Acesse [https://vercel.com/new](https://vercel.com/new)
2. Clique em "Continue with GitHub"
3. Autentique-se com sua conta GitHub
4. Procure por seu repositório `biosystem`
5. Clique em "Import"

### Passo 3: Configurar Projeto no Vercel
**Framework**: Automatic (React - CRA)  
**Root Directory**: ./  
**Build Command**: `npm run build` (padrão)  
**Output Directory**: `build` (já configurado)  

**Environment Variables**:
```
REACT_APP_API_URL = https://api.seu-dominio.com
REACT_APP_ENV = production
```

### Passo 4: Deploy
1. Clique em "Deploy"
2. Aguarde a compilação (2-3 minutos)
3. Verá URL: `https://seu-projeto.vercel.app`

---

## Opção 2: Deploy via CLI (Alternativa)

### Passo 1: Instalar Vercel CLI
```bash
npm install -g vercel
```

### Passo 2: Login no Vercel
```bash
vercel login
# Seguir instruções no navegador
```

### Passo 3: Deploy
```bash
cd c:\Users\Gabriel Ferreira\Biosystem\biosystem

# Deploy direto
vercel

# Ou deploy em produção
vercel --prod
```

### Passo 4: Configurar variáveis de ambiente
Após deploy:
```bash
vercel env add REACT_APP_API_URL
# Digite: https://api.seu-dominio.com

vercel env add REACT_APP_ENV
# Digite: production
```

---

## Opção 3: Deploy Manual (Não Recomendado)

### Passo 1: Build local
```bash
npm run build:prod
```

### Passo 2: Fazer upload do `/build`
- Usar interface Vercel ou CLI
- Arrastar pasta `build` para Vercel dashboard

---

## ✅ PÓS-DEPLOY: TESTES ESSENCIAIS

### 1. Testar Autenticação
```
🔐 Usuários de teste:
├─ master@biosystem.com / 123456
├─ admin@biosystem.com / 123456
├─ usuario@biosystem.com / 123456
├─ carlos@biosystem.com / 123456 (médico)
└─ painel@biosystem.com / 123456 (TV)
```

**Testes**:
- [ ] Login com Master - deve ver painel master
- [ ] Login com Admin - deve ver painel administrativo
- [ ] Login com Usuário - deve ver recepcão
- [ ] Login com Médico - deve ver consultório
- [ ] Login com Painel - deve ver sala de espera (TV)

### 2. Testar Navegação
- [ ] Navegação entre telas funciona
- [ ] Sair/logout funciona
- [ ] Botões de ação funcionam
- [ ] Formulários abrem/fecham

### 3. Testar Performance
```bash
# Abrir DevTools (F12) > Network
- [ ] Verificar tempo de carregamento
- [ ] Assets estáticos estão cachados (200 ou 304)
- [ ] Nenhum erro 404
- [ ] Nenhum erro de CORS
```

### 4. Testar Responsividade
- [ ] Layout correto em desktop (1920px)
- [ ] Layout correto em tablet (768px)
- [ ] Layout correto em mobile (375px)
- [ ] Menu responsivo funciona

### 5. Verificar Console (F12 > Console)
- [ ] Nenhum erro vermelho (red)
- [ ] Nenhum warning de deprecação
- [ ] Nenhum 404 de assets

---

## 🔍 VERIFICAR SAÚDE DO DEPLOY

### Monitorar Deployments
1. Acesse [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto `biosystem`
3. Veja histórico de deployments
4. Verifique logs em "Deployments" > "Build Logs"

### Testar URL Final
```
https://seu-projeto.vercel.app/
```

### Verificar Domain
1. Ir para Project Settings > Domains
2. Adicionar domínio customizado (opcional)
3. Configurar DNS (se usar domínio próprio)

---

## 🛠️ TROUBLESHOOTING

### Erro: "Failed to build"
**Solução**:
1. Verificar Build Logs no Vercel
2. Rodar localmente: `npm run build`
3. Instalar node_modules: `npm install`
4. Verificar erros com: `npm run build:prod`

### Erro: "Module not found"
**Solução**:
1. Verificar `package.json` tem todas as dependências
2. Executar: `npm install`
3. Deletar `node_modules` e instalar novamente

### Erro: "Cannot find /index.html"
**Solução**: Verificar se `vercel.json` tem fallback correto (já configurado ✅)

### Erro: "CORS" ao chamar API
**Solução**:
1. Se API não é CORS-enabled, usar proxy
2. Adicionar ao `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://api.seu-dominio.com/$1"
    }
  ]
}
```

### Página em branco
**Solução**:
1. Abrir DevTools (F12)
2. Verificar Console para erros
3. Verificar se React carregou (check main.js)
4. Limpar cache: Ctrl+Shift+Del

---

## 🔐 SEGURANÇA PÓS-DEPLOY

### Checklist de Segurança

- [ ] Headers de segurança ativados (já no vercel.json ✅)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection`

- [ ] Environment variables configuradas (não hardcoded)
  - `REACT_APP_API_URL` configurada no Vercel
  - `.env.production` nunca commitado

- [ ] Cache headers corretos
  - Assets estáticos: 1 ano
  - HTML: sem cache (revalidate)

- [ ] HTTPS ativado (automático no Vercel ✅)

- [ ] Sem credenciais em código-fonte
  - ⚠️ Usuários de teste têm senhas hardcoded
  - Para produção real: usar API de autenticação

---

## 📊 MONITORAMENTO CONTÍNUO

### Recomendado:

1. **Sentry** (error tracking)
   ```bash
   npm install @sentry/react
   # Configurar em App.jsx
   ```

2. **Google Analytics**
   ```bash
   npm install react-ga4
   # Rastrear uso do app
   ```

3. **Uptime Monitoring**
   - UptimeRobot
   - Pingdom
   - Monitorar https://seu-projeto.vercel.app

---

## 🚦 CI/CD AUTOMÁTICO

### GitHub Actions (Automático no Vercel)
Quando fazer push para `main`:
1. Vercel detecta automáticamente
2. Executa build
3. Deploy automático se sem erros
4. URL atualizada em minutos

**Desativar auto-deploy**:
1. Project Settings > Git
2. Desativar "Automatic Deployments"

---

## 📞 SUPORTE

### Se algo der errado:

1. **Logs do Vercel**: Deployment > Build Logs
2. **Console local**: `npm run build`
3. **DevTools browser**: F12 > Console/Network
4. **Vercel docs**: https://vercel.com/docs

---

## ✨ PRÓXIMOS PASSOS

### Após Deploy Bem-Sucedido:

1. **Teste de Carga** (opcional)
   ```bash
   npm install -g artillery
   artillery quick --count 10 --num 100 https://seu-projeto.vercel.app
   ```

2. **SEO Optimization**
   - Adicionar Open Graph meta tags
   - Sitemap.xml
   - robots.txt (já presente ✅)

3. **PWA Optimization**
   - Configurar service worker completo
   - Offline support

4. **Integração de API Real**
   - Substituir contextos por chamadas HTTP
   - Implementar autenticação JWT
   - Usar library como `axios` ou `fetch` com interceptors

5. **Domínio Customizado**
   - Registrar domínio (GoDaddy, Namecheap, etc)
   - Configurar DNS no Vercel
   - Certificado SSL automático ✅

---

**Última atualização**: 15/01/2026  
**Versão**: Biosystem 0.1.0
