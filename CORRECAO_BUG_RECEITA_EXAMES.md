# Correção do Bug - Valor de Receita nos Exames/Atendimentos

## Problema Identificado
O relatório não estava exibindo o valor dos atendimentos/exames, mostrando apenas que foi "consultado" e "atendido", mas sem a receita associada.

## Causa Raiz
A tabela `fila_atendimento` no banco de dados não possuía os campos `valor` e `procedimento_id` necessários para armazenar o valor do procedimento realizado.

## Mudanças Implementadas

### 1. **Banco de Dados** (init.sql)
- Adicionado campo `valor DECIMAL(10, 2) DEFAULT 0.00` à tabela `fila_atendimento`
- Adicionado campo `procedimento_id INTEGER` à tabela `fila_atendimento`

### 2. **Backend - Rota de Fila de Atendimento** (fila-atendimento.js)
- **GET /**: Adicionado `valor` e `procedimento_id` ao SELECT
- **POST /**: Adicionados parâmetros `valor` e `procedimentoId` ao body
- **PUT /:id**: Adicionados campos `valor` e `procedimentoId` para update

### 3. **Backend - Rota Mock** (fila-atendimento-mock.js)
- Atualizados métodos POST e PUT para suportar `valor` e `procedimentoId`

### 4. **Frontend - DataContext** (src/context/DataContext.jsx)
- **adicionarNaFila()**: 
  - Busca o procedimento selecionado
  - Extrai o valor do procedimento
  - Envia `procedimentoId` e `valor` ao backend
  
- **finalizarAtendimento()**:
  - Recupera o valor do atendimento
  - Inclui valor na atualização da fila
  - Salva valor no prontuário (em descricao JSON)

### 5. **Script de Migração** (migration_add_valor_campo.sql)
- Script de migração criado para adicionar os campos à tabela existente (case ambiente de produção)
- Verifica se os campos já existem antes de adicionar

## Fluxo de Dados Atualizado

1. **Recepção**: Ao adicionar paciente à fila, agora envia:
   - `procedimentoId`: ID do procedimento/exame selecionado
   - `valor`: Valor do procedimento obtido da tabela de procedimentos

2. **Armazenamento**: A tabela `fila_atendimento` agora guarda:
   - `valor`: Valor do atendimento
   - `procedimento_id`: Qual procedimento foi realizado

3. **Finalização**: Ao finalizar o atendimento:
   - O valor já está na fila
   - É enviado para o backend junto com status 'atendido'
   - É incluído no prontuário

4. **Relatório**: Ao gerar relatório:
   - Soma `valor` de todos os atendimentos com status 'atendido'
   - Exibe receita total, por clínica, por médico e por dia

## Validação

### Campos Suportados (Compatibilidade Dupla)
O código mantém suporte para ambos os formatos:
- `procedimentoId` ou `procedimento_id`
- `valor` ou `valor`
- `clinicaId` ou `clinica_id`

Isso garante compatibilidade com dados migrados de diferentes formatos.

## Impacto

✅ **Relatórios**: Agora mostram valores corretos de receita
✅ **Atendimentos**: Valor é capturado quando o procedimento é selecionado
✅ **Prontuários**: Incluem o valor e procedimento realizado
✅ **Backward Compatible**: Funciona com dados existentes

## Próximos Passos Recomendados

1. Executar migração no banco de produção (migration_add_valor_campo.sql)
2. Testar novo fluxo:
   - Adicionar paciente à fila com procedimento
   - Finalizar atendimento
   - Gerar relatório e verificar se valores aparecem

3. Verificar dados históricos:
   - Atendimentos antigos sem valor = R$ 0,00 no relatório (esperado)
   - Novos atendimentos mostrarão valor correto
