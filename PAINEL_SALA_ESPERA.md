# Painel de Sala de Espera - Guia de Uso

## 📺 Como Acessar o Painel de Sala de Espera

O painel de sala de espera é uma tela pública que deve ser exibida em um monitor ou TV na sala de espera da clínica.

### URL de Acesso:
```
http://localhost:3000/?tela=sala-espera
```

Ou em produção:
```
https://seu-dominio.com/?tela=sala-espera
```

## 🎯 Funcionalidades

### 1. **Exibição de Chamadas**
- Quando um médico chama um paciente no consultório, a chamada aparece automaticamente no painel
- A chamada exibe:
  - ✅ Nome do paciente
  - ✅ Nome do médico que está chamando
  - ✅ Animação visual com alerta sonoro
  - ✅ Countdown de 30 segundos

### 2. **Tela de Espera Padrão**
- Enquanto não há chamada, o painel exibe:
  - Mensagem "Aguardando próxima chamada"
  - Estatísticas de chamadas do dia
  - Logo da clínica

### 3. **Histórico de Chamadas**
- Mostra todos os pacientes chamados durante o dia
- Exibe hora de cada chamada
- Pacientes já atendidos aparecem com status diferente

## 🔧 Como Funciona

### No Consultório:
1. Médico clica em "Chamar Próximo" ou no botão de chamar paciente
2. Automaticamente, a chamada é registrada no sistema
3. O painel de sala de espera recebe e exibe a chamada em tempo real

### Fluxo Técnico:
```
ConsultorioScreen (médico chama)
  ↓
registrarChamada() no DataContext
  ↓
setChamadaAtual() - atualiza estado
  ↓
SalaEsperaScreen recebe a atualização
  ↓
Exibe chamada com timer de 30 segundos
  ↓
Desativa e move para histórico
```

## 💡 Personalizações

### Alterar duração da chamada:
Na função `registrarChamada()` em `src/context/DataContext.jsx`:
```javascript
setTimeout(() => {
  setChamadaAtual(null);
  setChamadas(prev => prev.map(c => c.id === novaChamada.id ? { ...c, ativa: false } : c));
}, 30000); // Altere este valor em milissegundos
```

### Alterar som:
Na função `reproduzirSom()` em `src/views/tv/SalaEsperaScreen.jsx`:
```javascript
oscillator.frequency.value = 800; // Altere para frequência desejada (Hz)
gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Volume
```

## 🖥️ Recomendações

- **Resolução**: Use um monitor em 16:9 ou 4:3
- **Navegador**: Chrome, Firefox ou Edge (recomendado)
- **Fullscreen**: Pressione F11 para modo fullscreen
- **Posicionamento**: Coloque em um local visível para todos os pacientes na sala de espera

## 📊 Dados Mostrados

- Nome completo do paciente
- Nome do médico responsável
- Hora de cada chamada
- Contador regressivo (30 segundos)
- Histórico do dia completo

## ✨ Recursos Especiais

- 🔊 Som de alerta automático
- 🎨 Design responsivo e atrativo
- 📱 Funciona em qualquer dispositivo
- 🌐 Atualizações em tempo real
- 📝 Histórico persistente durante o dia
