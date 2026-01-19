# 🔧 Setup do PostgreSQL - Procedimentos

## Problema
Ao tentar adicionar um paciente a um procedimento, aparece o erro:
```
relation "procedimentos" does not exist
```

Isso significa que a tabela de procedimentos não foi criada no banco de dados PostgreSQL.

## Solução

### Opção 1: Executar script via psql (Recomendado)

1. Abra o terminal/PowerShell
2. Conecte ao seu banco PostgreSQL:
```bash
psql -U seu_usuario -d seu_banco -h localhost
```

3. Execute o script:
```bash
\i 'C:\Users\Gabriel Ferreira\Biosystem\biosystem\biosystem-backend\db\setup_procedimentos_completo.sql'
```

4. Você verá mensagens de sucesso:
```
Procedimentos criados e vinculados com sucesso!
 total_procedimentos 
──────────────────
              12
(1 row)

 total_vinculos 
────────────────
              ? (depende de quantas clínicas você tem)
```

### Opção 2: Executar via DBeaver ou pgAdmin

1. Abra DBeaver/pgAdmin
2. Conecte ao seu banco PostgreSQL
3. Abra uma nova SQL Query
4. Copie todo o conteúdo do arquivo `setup_procedimentos_completo.sql`
5. Cole na query e execute (Ctrl + Enter ou botão Play)

### Opção 3: Executar via Node.js (Automático)

Se preferir executar automaticamente quando o backend inicia, o script já está configurado no `init.sql`. Se você recriou o banco, execute:

```bash
cd biosystem-backend
node -e "require('./db/connection').query(require('fs').readFileSync('./db/init.sql', 'utf8'))"
```

## O que o script faz?

✅ Cria tabela `procedimentos` com campos: id, nome, valor, descricao, ativo, data_cadastro
✅ Cria tabela `procedimentos_clinica` para relacionamento muitos-para-muitos
✅ Cria índices para melhor performance
✅ Insere 12 procedimentos padrão de oftalmologia
✅ Vincula todos os procedimentos a todas as clínicas ativas

## Após executar

1. Reinicie o backend:
```bash
npm start
```

2. Faça login no aplicativo

3. Vá para a aba "Procedimentos"

4. Agora você conseguirá:
   - ✅ Ver a lista de procedimentos
   - ✅ Criar novos procedimentos
   - ✅ Vincular procedimentos a clínicas
   - ✅ Adicionar pacientes à fila com procedimentos

## Verificar se funcionou

No terminal do backend, você deve ver:
```
🚀 Procedimentos carregados: 12
```

E ao adicionar um paciente à fila, não deve aparecer mais o erro de "relation procedimentos does not exist".

## Alternativa: Recriar o banco do zero

Se ainda tiver problemas, você pode recriar o banco do zero:

```bash
# 1. Conecte ao PostgreSQL como superuser
psql -U postgres

# 2. Dentro do psql, execute:
DROP DATABASE IF EXISTS biosystem;
CREATE DATABASE biosystem;
\c biosystem
\i 'C:\Users\Gabriel Ferreira\Biosystem\biosystem\biosystem-backend\db\init.sql'
\i 'C:\Users\Gabriel Ferreira\Biosystem\biosystem\biosystem-backend\db\setup_procedimentos_completo.sql'
```

## Problema?

Se ainda tiver problemas:
1. Verifique se PostgreSQL está rodando
2. Verifique as credenciais do banco em `biosystem-backend/db/connection.js`
3. Verifique os logs do backend para mensagens de erro
4. Abra uma issue no GitHub com o erro específico
