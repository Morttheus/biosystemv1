# 🏥 BioSystem - Sistema de Gerenciamento de Clínicas Médicas

Plataforma completa para gerenciamento de clínicas oftalmológicas, com suporte a múltiplas clínicas, médicos, pacientes e prontuários eletrônicos.

## 🎯 Funcionalidades

### Autenticação & Autorização
- ✅ 5 tipos de usuários: Master, Admin, Médico, Usuário (Recepcionista), Painel TV
- ✅ Controle de acesso por clínica
- ✅ Login/Logout seguro
- ✅ Permissões granulares por role

### Gerenciamento de Clínicas
- ✅ Múltiplas clínicas
- ✅ Cadastro de médicos por clínica
- ✅ Isolamento de dados por clínica

### Prontuário Eletrônico
- ✅ Histórico de consultas
- ✅ Anotações médicas
- ✅ Exames oftalmológicos
- ✅ Prescrições
- ✅ Anamnese

### Consultas & Agendamentos
- ✅ Calendário de consultas
- ✅ Fila de atendimento
- ✅ Chamadas de pacientes
- ✅ Status de consulta

### Painel de TV (Sala de Espera)
- ✅ Exibição de pacientes em atendimento
- ✅ Chamadas visuais e sonoras
- ✅ Próximo paciente
- ✅ Fim de atendimento

### Administração
- ✅ Cadastro de procedimentos
- ✅ Gerenciamento de usuários
- ✅ Relatórios administrativos
- ✅ Painel master com acesso total

## 🛠️ Stack Tecnológico

### Frontend
- **React** 19.2.3 - UI Framework
- **React Router** - Roteamento (implementado em App.jsx)
- **Tailwind CSS** 3.4.19 - Estilização
- **Lucide React** 0.562.0 - Ícones
- **React Toastify** 11.0.5 - Notificações
- **React Scripts** 5.0.1 - Build & Dev Server

### Desenvolvimento
- **Node.js** 18+
- **npm** ou **yarn**
- **Vercel** - Deploy
- **Git** - Versionamento

## 📋 Requisitos

- Node.js 18+
- npm 8+ ou yarn 1.22+
- Navegador moderno (Chrome, Firefox, Safari, Edge)

## 🚀 Instalação & Execução

### Instalação

```bash
# Clonar repositório
git clone <seu-repositorio>
cd biosystem

# Instalar dependências
npm install
```

### Desenvolvimento

```bash
# Iniciar servidor dev (porta 3000)
npm start

# Ou em modo watch
npm run start
```

Acessar: [http://localhost:3000](http://localhost:3000)

### Build para Produção

```bash
# Build padrão
npm run build

# Build otimizado (sem sourcemaps)
npm run build:prod
```

Output em: `/build`

### Executar Build Localmente

```bash
npm run serve
# Acessa http://localhost:3000 com conteúdo de /build
```

### Testes

```bash
npm test
```

## 📝 Usuários de Teste

| Email | Senha | Tipo | Clínica | Acesso |
|-------|-------|------|---------|--------|
| `master@biosystem.com` | `123456` | Master | N/A | Tudo |
| `admin@biosystem.com` | `123456` | Admin | Centro | Painel Administrativo |
| `adminsul@biosystem.com` | `123456` | Admin | Sul | Painel Administrativo |
| `usuario@biosystem.com` | `123456` | Usuário | Centro | Recepcão/Prontuário |
| `paula@biosystem.com` | `123456` | Usuário | Sul | Recepcão/Prontuário |
| `carlos@biosystem.com` | `123456` | Médico | Centro | Consultório |
| `maria@biosystem.com` | `123456` | Médico | Centro | Consultório |
| `painel@biosystem.com` | `123456` | Painel | Centro | TV Sala de Espera |
| `painelsul@biosystem.com` | `123456` | Painel | Sul | TV Sala de Espera |

## 📂 Estrutura do Projeto

```
biosystem/
├── public/                 # Assets estáticos
│   ├── index.html         # HTML template
│   ├── favicon.ico        # Ícone do app
│   └── manifest.json      # PWA manifest
│
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   ├── Loading.jsx
│   │   ├── Modal.jsx
│   │   └── Select.jsx
│   │
│   ├── context/           # React Context (estado global)
│   │   ├── AuthContext.jsx      # Autenticação
│   │   ├── DataContext.jsx      # Dados da aplicação
│   │   └── AppContext.jsx       # Estado da navegação
│   │
│   ├── views/             # Telas/Páginas
│   │   ├── admin/         # Painel administrativo
│   │   ├── atendimento/   # Telas de atendimento
│   │   ├── auth/          # Login
│   │   ├── consultorio/   # Consultório médico
│   │   ├── layout/        # Componentes de layout
│   │   ├── master/        # Painel master
│   │   ├── prontuario/    # Prontuário eletrônico
│   │   ├── recepcao/      # Recepcão
│   │   ├── relatorios/    # Relatórios
│   │   └── tv/            # Painel de TV
│   │
│   ├── utils/             # Funções utilitárias
│   │   ├── constants.js   # Constantes
│   │   ├── formatters.js  # Formatadores
│   │   └── validators.js  # Validadores
│   │
│   ├── services/          # Chamadas à API (pronto para integração)
│   ├── App.jsx            # Componente raiz
│   └── index.js           # Ponto de entrada
│
├── build/                 # Build otimizado (produção)
├── .env.example           # Variáveis de ambiente (exemplo)
├── vercel.json            # Configuração Vercel
├── tailwind.config.js     # Configuração Tailwind
├── package.json           # Dependências & scripts
└── README.md              # Este arquivo
```

## 🔐 Segurança

### Implementado
- ✅ Headers de segurança (X-Content-Type-Options, X-Frame-Options, XSS-Protection)
- ✅ Cache control para assets estáticos
- ✅ HTTPS ativado (Vercel)
- ✅ SPA fallback configurado
- ✅ Isolamento de dados por clínica/usuário

### A Implementar (Produção Real)
- ⚠️ Substituir autenticação hardcoded por API real
- ⚠️ Implementar JWT com tokens HTTP-only
- ⚠️ Encriptação de dados sensíveis
- ⚠️ Rate limiting
- ⚠️ CORS rigoroso

## 🚀 Deploy

### Deploy no Vercel (Recomendado)

```bash
# Opção 1: Via GitHub (automático)
# Push para main e Vercel detecta automaticamente

# Opção 2: Via CLI
npm install -g vercel
vercel --prod

# Opção 3: Via Dashboard
# https://vercel.com/new
```

### Configurar Variáveis de Ambiente

No Vercel Dashboard, adicionar:
```
REACT_APP_API_URL=https://api.seu-dominio.com
REACT_APP_ENV=production
```

Veja [GUIA_DEPLOY_VERCEL.md](./GUIA_DEPLOY_VERCEL.md) para instruções detalhadas.

## 📊 Status de Deploy

- **Configuração**: ✅ Pronta
- **Build**: ✅ Otimizado
- **Segurança**: ✅ Headers configurados
- **Performance**: ✅ Bom
- **Responsividade**: ✅ Mobile-first com Tailwind
- **Acessibilidade**: ⏳ Em desenvolvimento

**Score de Prontidão**: 82% ✅

Veja [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) para análise completa.

## 🔄 Fluxo de Trabalho

### Desenvolvimento
```bash
npm start
# Servidor dev em http://localhost:3000
# Hot reload automático
```

### Build Local
```bash
npm run build
# Gera /build para testar localmente
npm run serve
```

### Deploy
```bash
git add .
git commit -m "sua mensagem"
git push origin main
# Vercel detecta e faz deploy automaticamente
```

## 📱 Responsividade

- ✅ Desktop (1920px+)
- ✅ Tablet (768px-1024px)
- ✅ Mobile (320px-767px)

Tailwind CSS responsivo em todas as telas.

## ♿ Acessibilidade

- ⏳ ARIA labels (em desenvolvimento)
- ⏳ Navegação por teclado (em desenvolvimento)
- ⏳ Contraste adequado (✅ Tailwind defaults)
- ⏳ Mobile accessible (✅ viewport meta tag)

## 🎨 Estilo & Tema

**Cores**: Verde (Tailwind green-500 para tema médico/saúde)
**Font**: Sistema (sans-serif padrão)
**Layout**: Sidebar + Main content (desktop), Drawer (mobile)

Customizável em `tailwind.config.js`

## 🐛 Debug & Troubleshooting

### Console com Erros
```bash
# Abrir DevTools (F12) > Console
# Procurar por erros em vermelho
# Verificar Network tab para erros de API
```

### Build Falha
```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Componentes Não Carregam
```bash
# Verificar imports em App.jsx
# Checar se contextos estão wrappando componentes
# Verificar console para "useXyz deve ser usado dentro de Provider"
```

## 📚 Recursos & Documentação

- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel Docs](https://vercel.com/docs)
- [Create React App Docs](https://create-react-app.dev)

## 📞 Suporte & Contribuição

Para issues, bugs, ou sugestões:
1. Abrir issue no GitHub
2. Descrever o problema
3. Incluir steps para reproduzir
4. Fornecer screenshots se possível

## 📄 Licença

Proprietary - Biosystem (2026)

## ✅ Checklist Pré-Deploy

- [x] Código compilando sem erros
- [x] Autenticação funcionando
- [x] Navegação entre telas OK
- [x] Build otimizado pronto
- [x] Vercel.json configurado
- [x] Headers de segurança
- [x] Variáveis de ambiente exemplo
- [ ] Testar em produção
- [ ] Remover console.logs
- [ ] Domínio customizado (opcional)

---

**Versão**: 0.1.0  
**Última atualização**: 15/01/2026  
**Status**: ✅ Pronto para Deploy
