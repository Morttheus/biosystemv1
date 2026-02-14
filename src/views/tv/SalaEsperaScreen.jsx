// src/views/tv/SalaEsperaScreen.jsx
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { Volume2, Clock, User, Stethoscope, LogOut } from 'lucide-react';

const SalaEsperaScreen = () => {
  const { chamadaAtual, getClinicaIdUsuario } = useData();
  const { logout } = useAuth();
  const [tempoRestante, setTempoRestante] = useState(30);
  const [exibirChamada, setExibirChamada] = useState(false);
  const [chamadaAPI, setChamadaAPI] = useState(null);
  const [historicoChamadas, setHistoricoChamadas] = useState([]);

  // Obtém a clínica do usuário painel
  const clinicaIdPainel = getClinicaIdUsuario();

  // Polling para verificar chamadas na API (funciona entre dispositivos diferentes)
  useEffect(() => {
    const verificarChamadaAPI = async () => {
      try {
        // Busca chamada ativa na API
        const chamada = await apiService.obterChamadaAtiva(clinicaIdPainel);
        if (chamada && chamada.ativa) {
          setChamadaAPI(chamada);
        } else {
          setChamadaAPI(null);
        }
      } catch (e) {
        // Se API falhar, tenta localStorage como fallback
        try {
          const chamadaSalva = localStorage.getItem('biosystem_chamada_atual');
          if (chamadaSalva) {
            const chamada = JSON.parse(chamadaSalva);
            const agora = new Date();
            const dataChamada = new Date(chamada.dataHora);
            const diffSegundos = (agora - dataChamada) / 1000;
            // eslint-disable-next-line eqeqeq
            if (diffSegundos < 30 && (chamada.clinicaId || chamada.clinica_id) == clinicaIdPainel) {
              setChamadaAPI(chamada);
            } else {
              setChamadaAPI(null);
            }
          }
        } catch (localErr) {
          console.error('Erro ao verificar chamada local:', localErr);
        }
      }
    };

    // Busca histórico de chamadas
    const carregarHistorico = async () => {
      try {
        const historico = await apiService.obterHistoricoChamadas(clinicaIdPainel);
        if (Array.isArray(historico)) {
          setHistoricoChamadas(historico);
        }
      } catch (e) {
        // Silencia erro de histórico
      }
    };

    // Verifica imediatamente
    verificarChamadaAPI();
    carregarHistorico();

    // Polling a cada 1 segundo para capturar chamadas da API
    const interval = setInterval(verificarChamadaAPI, 1000);
    // Atualiza histórico a cada 5 segundos
    const historicoInterval = setInterval(carregarHistorico, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(historicoInterval);
    };
  }, [clinicaIdPainel]);

  // Usa chamadaAPI da API OU chamadaAtual do context
  const chamadaAtiva = chamadaAPI || chamadaAtual;

  // Filtra a chamada atual para mostrar apenas da mesma clínica
  // eslint-disable-next-line eqeqeq
  const chamadaAtualFiltrada = chamadaAtiva && (chamadaAtiva.clinicaId || chamadaAtiva.clinica_id) == clinicaIdPainel ? chamadaAtiva : null;

  // Timer para a chamada
  useEffect(() => {
    if (chamadaAtualFiltrada && chamadaAtualFiltrada.ativa) {
      setExibirChamada(true);
      setTempoRestante(30);

      const interval = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setExibirChamada(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setExibirChamada(false);
    }
  }, [chamadaAtualFiltrada]);

  // Som de chamada (opcional - usar Web Audio API)
  useEffect(() => {
    if (exibirChamada && chamadaAtualFiltrada) {
      reproduzirSom();
    }
  }, [exibirChamada, chamadaAtualFiltrada]);

  const reproduzirSom = () => {
    // Som simples usando Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Frequência em Hz para um som mais alto e notável
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Som não disponível');
    }
  };

  // Usa histórico de chamadas da API (já filtrado por clínica)
  const chamadasDia = historicoChamadas;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-cyan-900 to-teal-900 flex flex-col items-center justify-center p-4">
      {/* Logo/Cabeçalho */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-2">BioSystem</h1>
        <p className="text-2xl text-teal-200">Oftalmologia</p>
      </div>

      {/* Painel de Chamada Atual */}
      {exibirChamada && chamadaAtualFiltrada ? (
        <div className="w-full max-w-4xl">
          {/* Animação de alerta */}
          <div className="mb-8 animate-pulse">
            <div className="bg-gradient-to-r from-yellow-400 via-red-400 to-yellow-400 rounded-lg p-1">
              <div className="bg-teal-900 rounded-lg p-8 border-4 border-yellow-400">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Volume2 size={64} className="text-yellow-400 animate-bounce" />
                </div>

                <div className="text-center mb-8">
                  <p className="text-white text-2xl mb-2">Próximo Paciente!</p>
                  <div className="h-1 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full"></div>
                </div>

                {/* Nome do Paciente */}
                <div className="bg-white bg-opacity-10 rounded-2xl p-8 mb-6 border-2 border-yellow-400">
                  <p className="text-yellow-200 text-lg mb-2">PACIENTE</p>
                  <p className="text-white text-6xl font-bold mb-2">
                    {chamadaAtualFiltrada.pacienteNome}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-yellow-300">
                    <User size={20} />
                    <span className="text-lg">Direção para o Consultório</span>
                  </div>
                </div>

                {/* Informações do Médico */}
                <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3">
                    <Stethoscope size={32} className="text-white" />
                    <div>
                      <p className="text-cyan-100 text-sm">Consultório com</p>
                      <p className="text-white text-2xl font-bold">
                        {chamadaAtualFiltrada.medicoNome}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Countdown */}
                <div className="text-center">
                  <div className="bg-red-500 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-6xl font-bold">
                      {tempoRestante}
                    </span>
                  </div>
                  <p className="text-gray-300 text-lg">segundos restantes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Tela de espera padrão
        <div className="w-full max-w-2xl text-center">
          <div className="bg-white bg-opacity-5 backdrop-blur rounded-3xl p-12 border border-white border-opacity-10">
            <div className="mb-8">
              <div className="inline-block bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full p-8">
                <Clock size={80} className="text-teal-900" />
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white mb-4">Sala de Espera</h2>
            <p className="text-2xl text-teal-200 mb-8">
              Aguardando próxima chamada...
            </p>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-teal-600 bg-opacity-50 rounded-xl p-6">
                <p className="text-teal-200 text-sm mb-2">CHAMADAS HOJE</p>
                <p className="text-white text-4xl font-bold">{chamadasDia.length}</p>
              </div>
              <div className="bg-cyan-600 bg-opacity-50 rounded-xl p-6">
                <p className="text-cyan-200 text-sm mb-2">PACIENTES CHAMADOS</p>
                <p className="text-white text-4xl font-bold">
                  {chamadasDia.filter(c => !c.ativa).length}
                </p>
              </div>
            </div>

            <p className="text-gray-300 text-lg">
              Fique atento à sua chamada
            </p>
          </div>
        </div>
      )}

      {/* Histórico de Chamadas */}
      {chamadasDia.length > 0 && (
        <div className="w-full max-w-4xl mt-12">
          <h3 className="text-2xl font-bold text-white mb-4">
            Histórico de Chamadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
            {chamadasDia.map((chamada) => (
              <div
                key={chamada.id}
                className={`p-4 rounded-lg border-l-4 transition-all ${
                  chamada.ativa
                    ? 'bg-yellow-600 bg-opacity-30 border-yellow-400'
                    : 'bg-gray-700 bg-opacity-50 border-green-400'
                }`}
              >
                <p className="text-white font-semibold">
                  {chamada.pacienteNome}
                </p>
                <p className="text-gray-300 text-sm">
                  {chamada.medicoNome}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(chamada.dataHora).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-4 left-4 right-4 flex justify-between items-end">
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
        >
          <LogOut size={20} />
          Sair do Painel
        </button>
        <div className="text-gray-400 text-sm text-right">
          <p>BioSystem - Painel de Sala de Espera</p>
          <p>{new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
};

export default SalaEsperaScreen;
