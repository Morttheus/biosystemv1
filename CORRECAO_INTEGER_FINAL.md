# 🔧 CORREÇÃO COMPLETA - INTEGER Overflow em Registros

## Problema Identificado
Quando usuários tentavam registrar médicos, recebia erro:
```
value "1768617648957" is out of range for type integer
```

## Raiz Causa
1. **adicionarClinica()** estava gerando IDs com `Date.now()` (13 dígitos)
2. Esses IDs eram salvos apenas no estado local, não na API
3. Quando criava um médico, passava clinicaId com valor timestamp
4. PostgreSQL INTEGER tem limite de ~2.1 bilhões (10 dígitos)
5. Timestamps (1768617648957) causam overflow

## Soluções Implementadas

### 1. ✅ DataContext.jsx - adicionarClinica
**ANTES:** Gerava ID local com Date.now()
```javascript
const adicionarClinica = (clinica) => {
  const novaClinica = {
    ...clinica,
    id: Date.now(),  // ❌ PROBLEMA
    ativa: true,
  };
  setClinicas(prev => [...prev, novaClinica]);
  return novaClinica;
};
```

**DEPOIS:** Chama API para gerar ID no banco
```javascript
const adicionarClinica = async (clinica) => {
  try {
    const { id, ...dadosClinica } = clinica;
    const resultado = await apiService.criarClinica(dadosClinica);
    
    if (resultado && resultado.id) {
      setClinicas(prev => [...prev, resultado]);
      toast.success('Clínica adicionada com sucesso!');
      return { success: true, clinica: resultado };
    }
    throw new Error('Erro ao adicionar clínica');
  } catch (err) {
    // ... tratamento de erro
  }
};
```

### 2. ✅ DataContext.jsx - adicionarProcedimento
**ANTES:** `id: Date.now()`
**DEPOIS:** `id: Math.floor(Math.random() * 1000000) + 1`
- Procedimentos são locais, não precisam de API
- ID seguro (máximo 1.000.000)

### 3. ✅ DataContext.jsx - registrarChamada
**ANTES:** `id: Date.now()`
**DEPOIS:** `id: Math.floor(Math.random() * 1000000) + 1`
- Chamadas são locais (painel sala de espera)
- ID seguro

### 4. ✅ DataContext.jsx - adicionarMedico
**STATUS:** Já estava correto
- Já usa API: `apiService.criarMedico()`
- Deixa o banco gerar o ID (BIGSERIAL)

### 5. ✅ MasterScreen.jsx - handleSalvarClinica
Atualizado para chamar async/await:
```javascript
const handleSalvarClinica = async () => {
  if (!formClinica.nome) return alert('Nome é obrigatório');
  if (itemEditando) {
    editarClinica(itemEditando.id, formClinica);
  } else {
    const resultado = await adicionarClinica(formClinica);
    if (!resultado.success) {
      toast.error(resultado.error);
      return;
    }
  }
  fecharModal();
};
```

## Dados Inválidos no Banco

Se houver registros com IDs timestamp no banco, executar:
```sql
-- Mover usuários para clínica válida
UPDATE usuarios 
SET clinica_id = 1 
WHERE clinica_id > 1000000;

-- Deletar clínicas inválidas
DELETE FROM clinicas 
WHERE id > 1000000;
```

Ver arquivo: `biosystem-backend/db/fix_clinic_ids.sql`

## Fluxo Correto Agora

1. **Usuário cria clínica via Master**
   - Frontend: `handleSalvarClinica()` (async)
   - API: POST `/api/clinicas`
   - Backend: SERIAL gera ID (ex: 1, 2, 3...)
   - Frontend: Estado atualizado com ID correto do banco

2. **Admin usa clinicaId para criar médico**
   - clinicaId vem do banco (INTEGER seguro)
   - POST `/api/medicos` com clinicaId válido
   - Sem overflow ✅

3. **Procedimentos e Chamadas**
   - IDs locais com `Math.random()` (seguro)
   - Nunca vão para banco como INTEGER
   - Sem risco de overflow ✅

## Testes Recomendados

1. [ ] Criar nova clínica e verificar ID no banco
2. [ ] Registrar médico nessa clínica
3. [ ] Registrar recepcionista nessa clínica
4. [ ] Adicionar paciente
5. [ ] Fazer atendimento completo (fila → consulta → prontuário)
6. [ ] Verificar painel de sala de espera (chamadas)

## Commits Necessários

```bash
git add src/context/DataContext.jsx
git add src/views/master/MasterScreen.jsx
git add biosystem-backend/db/fix_clinic_ids.sql
git commit -m "🐛 Fix: Remover Date.now() de geração de IDs, usar API para clínicas"
git push
```

## Deploy

Após push:
1. Vercel redeploy automático
2. Railway backend atualizado
3. Testar fluxo completo
