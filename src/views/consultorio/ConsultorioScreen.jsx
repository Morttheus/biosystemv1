// src/views/consultorio/ConsultorioScreen.jsx
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import {
  User,
  Phone,
  Calendar,
  FileText,
  Stethoscope,
  Eye,
  Save,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  History,
  LogOut,
  Volume2,
  Printer
} from 'lucide-react';

const ConsultorioScreen = () => {
  const { usuarioLogado, logout } = useAuth();
  const {
    filaAtendimento,
    pacientes,
    medicos,
    chamarPaciente,
    registrarChamada,
    finalizarAtendimento,
    obterProntuarioPaciente,
    getClinicaIdUsuario,
    atualizarFila,
  } = useData();

  // Polling para atualizar a fila em tempo real (a cada 3 segundos)
  useEffect(() => {
    // Atualiza imediatamente ao montar
    atualizarFila();

    // Configura polling a cada 3 segundos
    const intervalo = setInterval(() => {
      atualizarFila();
    }, 3000);

    // Limpa o intervalo ao desmontar
    return () => clearInterval(intervalo);
  }, [atualizarFila]);

  const [pacienteAtual, setPacienteAtual] = useState(null);
  const [atendimentoAtual, setAtendimentoAtual] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('anamnese');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [expandirAtendidos, setExpandirAtendidos] = useState(false);

  // Formulário de Anamnese Oftalmológica
  const [anamnese, setAnamnese] = useState({
    queixaPrincipal: '',
    historiaDoencaAtual: '',
    historicoOcular: '',
    historicoFamiliar: '',
    medicamentosUso: '',
    alergias: '',
    cirurgiasAnteriores: '',
    usaOculos: false,
    usaLentesContato: false,
    // Óculos
    oculosOdEsf: '',
    oculosOdCil: '',
    oculosOdEixo: '',
    oculosOeEsf: '',
    oculosOeCil: '',
    oculosOeEixo: '',
    oculosAdicao: '',
    // Tonometria
    pressaoOlhoDireito: '',
    pressaoOlhoEsquerdo: '',
    // Biomicroscopia
    biomicroscopiaOD: '',
    biomicroscopiaOE: '',
    // Fundoscopia
    fundoscopiaOD: '',
    fundoscopiaOE: '',
  });

  const [consulta, setConsulta] = useState({
    diagnostico: '',
    prescricao: '',
    observacoes: '',
    retorno: '',
  });

  // Médico logado - tenta encontrar o registro de médico vinculado ao usuário
  const clinicaId = getClinicaIdUsuario();

  // Primeiro tenta medicoId do usuário, depois busca na tabela de médicos pelo nome
  let medicoId = usuarioLogado?.medicoId || usuarioLogado?.medico_id;
  if (!medicoId && usuarioLogado?.tipo === 'medico' && medicos.length > 0) {
    // Busca o médico na tabela medicos que tem o mesmo nome (ou parte do nome)
    const medicoVinculado = medicos.find(m => {
      const medicoClinica = m.clinicaId || m.clinica_id;
      // eslint-disable-next-line eqeqeq
      return medicoClinica == clinicaId && (
        m.nome === usuarioLogado.nome ||
        usuarioLogado.nome?.includes(m.nome) ||
        m.nome?.includes(usuarioLogado.nome)
      );
    });
    if (medicoVinculado) {
      medicoId = medicoVinculado.id;
    }
  }

  // Helper para comparar medicoId (suporta ambos formatos e tipos)
  const matchMedico = (a) => {
    const atendMedicoId = a.medicoId || a.medico_id;
    const atendClinicaId = a.clinicaId || a.clinica_id;

    // Se o usuário não tem clínica, mostra tudo (fallback)
    if (!clinicaId) return true;

    // Se o usuário logado não tem medicoId, mostra todos da clínica
    if (!medicoId) {
      // eslint-disable-next-line eqeqeq
      return atendClinicaId == clinicaId;
    }

    // Se o paciente na fila não tem médico atribuído, mostra para todos os médicos da clínica
    if (!atendMedicoId) {
      // eslint-disable-next-line eqeqeq
      return atendClinicaId == clinicaId;
    }

    // Se tem médico atribuído, mostra apenas para o médico correto
    // eslint-disable-next-line eqeqeq
    return atendMedicoId == medicoId;
  };

  // Fila do médico (suporta ambos formatos de campo)
  const filaMedico = filaAtendimento.filter(
    a => matchMedico(a) && a.status !== 'atendido'
  );

  // Pacientes aguardando atendimento
  const aguardando = filaMedico.filter(a => a.status === 'aguardando');

  // Pacientes atendidos no dia (suporta ambos formatos)
  const atendidos = filaAtendimento.filter(a => {
    if (!matchMedico(a) || a.status !== 'atendido') return false;
    // Usa horário de atendimento ou chegada para filtrar por data
    const horario = a.horarioFinalizacao || a.horario_finalizacao || a.horarioAtendimento || a.horario_atendimento || a.horarioChegada || a.horario_chegada;
    if (!horario) return true; // Se não tem horário, mostra mesmo assim (foi atendido hoje)
    return new Date(horario).toDateString() === new Date().toDateString();
  });

  // Atendimento em andamento (status 'atendendo' no backend)
  const emAtendimento = filaAtendimento.find(
    a => matchMedico(a) && a.status === 'atendendo'
  );

  // Restaura o atendimento em andamento ao recarregar a página
  useEffect(() => {
    if (emAtendimento && !pacienteAtual) {
      const pacienteId = emAtendimento.pacienteId || emAtendimento.paciente_id;
      const paciente = pacientes.find(p => p.id === pacienteId);

      if (paciente) {
        setPacienteAtual(paciente);
        setAtendimentoAtual(emAtendimento);
        setAbaAtiva('anamnese');
      }
    }
  }, [emAtendimento, pacientes, pacienteAtual]);

  const handleChamarPaciente = async (atendimento) => {
    // Obtém IDs corretamente (suporta ambos formatos)
    const pacienteId = atendimento.pacienteId || atendimento.paciente_id;
    const pacienteNome = atendimento.pacienteNome || atendimento.paciente_nome || 'Paciente';
    const atendMedicoId = atendimento.medicoId || atendimento.medico_id;
    const medicoNome = atendimento.medicoNome || atendimento.medico_nome || usuarioLogado?.nome;

    try {
      // Chama API para atualizar status para 'atendendo'
      await chamarPaciente(atendimento.id, atendMedicoId || medicoId, medicoNome);

      // Busca paciente pelo ID correto
      const paciente = pacientes.find(p => p.id === pacienteId);

      // Registra a chamada no painel de sala de espera (agora usa API)
      await registrarChamada(
        pacienteId,
        pacienteNome,
        medicoId,
        usuarioLogado?.nome,
        getClinicaIdUsuario()
      );

      setPacienteAtual(paciente);
      setAtendimentoAtual(atendimento);
      setAbaAtiva('anamnese'); // Abre automaticamente a aba de anamnese
      setMensagem({ tipo: 'sucesso', texto: `Paciente ${pacienteNome} chamado para atendimento.` });
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao chamar paciente' });
    }
  };

  // Chama o próximo paciente na fila
  const handleChamarProximo = async () => {
    if (aguardando.length > 0) {
      await handleChamarPaciente(aguardando[0]);
    }
  };

  // Chamar novamente o paciente atual (quando ele não viu a chamada)
  const handleChamarNovamente = async () => {
    if (!pacienteAtual || !atendimentoAtual) return;

    const pacienteNome = atendimentoAtual.pacienteNome || atendimentoAtual.paciente_nome || pacienteAtual.nome;
    const pacienteId = atendimentoAtual.pacienteId || atendimentoAtual.paciente_id || pacienteAtual.id;

    // Registra nova chamada no painel (agora usa API)
    await registrarChamada(
      pacienteId,
      pacienteNome,
      medicoId,
      usuarioLogado?.nome,
      getClinicaIdUsuario()
    );

    setMensagem({ tipo: 'sucesso', texto: `Paciente ${pacienteNome} chamado novamente!` });
  };

  const handleFinalizarAtendimento = async () => {
    if (!atendimentoAtual) return;

    if (!consulta.diagnostico) {
      setMensagem({ tipo: 'erro', texto: 'Por favor, preencha o diagnóstico.' });
      return;
    }

    const dadosConsulta = {
      anamnese,
      diagnostico: consulta.diagnostico,
      prescricao: consulta.prescricao,
      observacoes: consulta.observacoes,
      retorno: consulta.retorno,
      medicoId: medicoId,
      medicoNome: usuarioLogado?.nome,
      clinicaId: clinicaId,
    };

    try {
      const resultado = await finalizarAtendimento(atendimentoAtual.id, dadosConsulta);

      if (resultado) {
      setMensagem({ tipo: 'sucesso', texto: 'Consulta finalizada e salva no prontuário!' });
      // Limpa os formulários
      setPacienteAtual(null);
      setAtendimentoAtual(null);
      setAnamnese({
        queixaPrincipal: '',
        historiaDoencaAtual: '',
        historicoOcular: '',
        historicoFamiliar: '',
        medicamentosUso: '',
        alergias: '',
        cirurgiasAnteriores: '',
        usaOculos: false,
        usaLentesContato: false,
        oculosOdEsf: '',
        oculosOdCil: '',
        oculosOdEixo: '',
        oculosOeEsf: '',
        oculosOeCil: '',
        oculosOeEixo: '',
        oculosAdicao: '',
        pressaoOlhoDireito: '',
        pressaoOlhoEsquerdo: '',
        biomicroscopiaOD: '',
        biomicroscopiaOE: '',
        fundoscopiaOD: '',
        fundoscopiaOE: '',
      });
      setConsulta({
        diagnostico: '',
        prescricao: '',
        observacoes: '',
        retorno: '',
      });
      }
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao finalizar atendimento' });
    }
  };

  const formatarCPF = (cpf) => {
    const cpfLimpo = cpf?.replace(/\D/g, '') || '';
    if (cpfLimpo.length !== 11) return cpf;
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const historicoConsultas = pacienteAtual ? obterProntuarioPaciente(pacienteAtual.id) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-700 dark:from-gray-800 dark:to-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Stethoscope size={28} />
                Consultório Médico
              </h1>
              <p className="text-teal-100 text-sm">
                {usuarioLogado?.nome}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm opacity-75">Fila do Dia</div>
                <div className="text-3xl font-bold">{aguardando.length}</div>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={LogOut}
                onClick={logout}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Mensagem */}
        {mensagem.texto && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 transition-colors ${
            mensagem.tipo === 'sucesso' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
            mensagem.tipo === 'erro' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
            'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {mensagem.texto}
            <button onClick={() => setMensagem({ tipo: '', texto: '' })} className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              &times;
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Fila de Espera */}
          <div className="lg:col-span-1">
            {/* Estatísticas */}
            <div className="space-y-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="text-center">
                  <p className="text-blue-600 text-sm font-medium mb-1">AGUARDANDO</p>
                  <p className="text-4xl font-bold text-blue-700">{aguardando.length}</p>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="text-center">
                  <p className="text-green-600 text-sm font-medium mb-1">ATENDIDOS HOJE</p>
                  <p className="text-4xl font-bold text-green-700">{atendidos.length}</p>
                </div>
              </Card>
            </div>

            {/* Botão Chamar Próximo */}
            {aguardando.length > 0 && !emAtendimento && (
              <Button
                fullWidth
                variant="success"
                size="lg"
                onClick={handleChamarProximo}
                className="mb-6 text-lg h-14"
                icon={ChevronRight}
              >
                Chamar Próximo
              </Button>
            )}

            <Card title="Fila de Espera">
              <div className="space-y-2">
                {aguardando.map((atendimento, index) => {
                  const pacienteNome = atendimento.pacienteNome || atendimento.paciente_nome || 'Paciente';
                  const procedimentoNome = atendimento.procedimentoNome || atendimento.procedimento_nome || '';
                  return (
                    <div
                      key={atendimento.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{pacienteNome}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{procedimentoNome}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleChamarPaciente(atendimento)}
                        disabled={!!emAtendimento}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  );
                })}
                {aguardando.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">Nenhum paciente aguardando</p>
                )}
              </div>
            </Card>

            {/* Pacientes Atendidos */}
            <Card title="Atendidos Hoje" className="mt-4">
              <button
                onClick={() => setExpandirAtendidos(!expandirAtendidos)}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 transition-colors"
              >
                <span className="text-sm font-medium">Ver histórico ({atendidos.length})</span>
                {expandirAtendidos ? <ChevronDown size={18} /> : <ChevronDown size={18} className="transform rotate-180" />}
              </button>
              {expandirAtendidos && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {atendidos.map((atendimento) => {
                    const pacienteNome = atendimento.pacienteNome || atendimento.paciente_nome || 'Paciente';
                    const horarioFinal = atendimento.horarioFinalizacao || atendimento.horario_finalizacao;
                    return (
                      <div
                        key={atendimento.id}
                        className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-sm border-l-4 border-green-600"
                      >
                        <p className="font-medium text-green-900 dark:text-green-300">{pacienteNome}</p>
                        <p className="text-xs text-green-700 dark:text-green-400">
                          {horarioFinal ? new Date(horarioFinal).toLocaleTimeString('pt-BR') : '-'}
                        </p>
                      </div>
                    );
                  })}
                  {atendidos.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">Nenhum paciente atendido ainda</p>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-3">
            {!pacienteAtual && !emAtendimento ? (
              <Card>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Eye size={64} className="mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Nenhum paciente em atendimento</h3>
                  <p>Selecione um paciente da fila para iniciar o atendimento</p>
                </div>
              </Card>
            ) : (
              <>
                {/* Ficha do Paciente */}
                <Card className="mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                        <User size={32} className="text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{pacienteAtual?.nome}</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          CPF: {formatarCPF(pacienteAtual?.cpf)} | Prontuário Nº: {pacienteAtual?.numeroProntuario || '-'}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          {pacienteAtual?.telefone && (
                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Phone size={14} /> {pacienteAtual.telefone}
                            </span>
                          )}
                          {pacienteAtual?.dataNascimento && (
                            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                              <Calendar size={14} /> {formatarData(pacienteAtual.dataNascimento)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                        Em Atendimento
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {atendimentoAtual?.procedimentoNome}
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Volume2}
                        onClick={handleChamarNovamente}
                      >
                        Chamar Novamente
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Abas */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow mb-6 flex flex-wrap gap-2 transition-colors">
                  <button
                    onClick={() => setAbaAtiva('anamnese')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      abaAtiva === 'anamnese' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <FileText size={20} />
                    Anamnese
                  </button>
                  <button
                    onClick={() => setAbaAtiva('exame')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      abaAtiva === 'exame' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Eye size={20} />
                    Óculos
                  </button>
                  <button
                    onClick={() => setAbaAtiva('prescricao')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      abaAtiva === 'prescricao' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Stethoscope size={20} />
                    Prescrição
                  </button>
                  <button
                    onClick={() => setAbaAtiva('historico')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      abaAtiva === 'historico' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <History size={20} />
                    Histórico ({historicoConsultas.length})
                  </button>
                </div>

                {/* Conteúdo das Abas */}
                {abaAtiva === 'anamnese' && (
                  <Card title="Anamnese">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Queixa Principal *
                        </label>
                        <textarea
                          value={anamnese.queixaPrincipal}
                          onChange={(e) => setAnamnese({ ...anamnese, queixaPrincipal: e.target.value })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                          rows={3}
                          placeholder="Descreva a queixa principal do paciente..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          História da Doença Atual
                        </label>
                        <textarea
                          value={anamnese.historiaDoencaAtual}
                          onChange={(e) => setAnamnese({ ...anamnese, historiaDoencaAtual: e.target.value })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                          rows={3}
                          placeholder="Evolução dos sintomas, tratamentos anteriores..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Histórico Ocular
                          </label>
                          <textarea
                            value={anamnese.historicoOcular}
                            onChange={(e) => setAnamnese({ ...anamnese, historicoOcular: e.target.value })}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                            rows={2}
                            placeholder="Doenças oculares anteriores..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Histórico Familiar
                          </label>
                          <textarea
                            value={anamnese.historicoFamiliar}
                            onChange={(e) => setAnamnese({ ...anamnese, historicoFamiliar: e.target.value })}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                            rows={2}
                            placeholder="Glaucoma, catarata, etc na família..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="Medicamentos em Uso"
                          value={anamnese.medicamentosUso}
                          onChange={(e) => setAnamnese({ ...anamnese, medicamentosUso: e.target.value })}
                        />
                        <Input
                          label="Alergias"
                          value={anamnese.alergias}
                          onChange={(e) => setAnamnese({ ...anamnese, alergias: e.target.value })}
                        />
                        <Input
                          label="Cirurgias Anteriores"
                          value={anamnese.cirurgiasAnteriores}
                          onChange={(e) => setAnamnese({ ...anamnese, cirurgiasAnteriores: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={anamnese.usaOculos}
                            onChange={(e) => setAnamnese({ ...anamnese, usaOculos: e.target.checked })}
                            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                          />
                          <span className="text-sm">Usa óculos</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={anamnese.usaLentesContato}
                            onChange={(e) => setAnamnese({ ...anamnese, usaLentesContato: e.target.checked })}
                            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                          />
                          <span className="text-sm">Usa lentes de contato</span>
                        </label>
                      </div>

                      <div className="pt-4 border-t">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Diagnóstico *
                        </label>
                        <textarea
                          value={consulta.diagnostico}
                          onChange={(e) => setConsulta({ ...consulta, diagnostico: e.target.value })}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                          rows={3}
                          placeholder="Diagnóstico do paciente..."
                          required
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {abaAtiva === 'exame' && (
                  <Card title="Prescrição de Óculos">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                          <Eye size={20} /> Olho Direito (OD)
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <span className="block text-xs font-semibold text-blue-700 mb-1">ESF</span>
                            <Input
                              value={anamnese.oculosOdEsf}
                              onChange={(e) => setAnamnese({ ...anamnese, oculosOdEsf: e.target.value })}
                              placeholder="+0.00"
                            />
                          </div>
                          <div className="text-center">
                            <span className="block text-xs font-semibold text-blue-700 mb-1">CIL</span>
                            <Input
                              value={anamnese.oculosOdCil}
                              onChange={(e) => setAnamnese({ ...anamnese, oculosOdCil: e.target.value })}
                              placeholder="-0.00"
                            />
                          </div>
                          <div className="text-center">
                            <span className="block text-xs font-semibold text-blue-700 mb-1">EIXO</span>
                            <Input
                              value={anamnese.oculosOdEixo}
                              onChange={(e) => setAnamnese({ ...anamnese, oculosOdEixo: e.target.value })}
                              placeholder="0°"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <Eye size={20} /> Olho Esquerdo (OE)
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <span className="block text-xs font-semibold text-green-700 mb-1">ESF</span>
                            <Input
                              value={anamnese.oculosOeEsf}
                              onChange={(e) => setAnamnese({ ...anamnese, oculosOeEsf: e.target.value })}
                              placeholder="+0.00"
                            />
                          </div>
                          <div className="text-center">
                            <span className="block text-xs font-semibold text-green-700 mb-1">CIL</span>
                            <Input
                              value={anamnese.oculosOeCil}
                              onChange={(e) => setAnamnese({ ...anamnese, oculosOeCil: e.target.value })}
                              placeholder="-0.00"
                            />
                          </div>
                          <div className="text-center">
                            <span className="block text-xs font-semibold text-green-700 mb-1">EIXO</span>
                            <Input
                              value={anamnese.oculosOeEixo}
                              onChange={(e) => setAnamnese({ ...anamnese, oculosOeEixo: e.target.value })}
                              placeholder="0°"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-orange-800">Adição</span>
                        <div className="w-32">
                          <Input
                            value={anamnese.oculosAdicao}
                            onChange={(e) => setAnamnese({ ...anamnese, oculosAdicao: e.target.value })}
                            placeholder="+0.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botão Imprimir Receita de Óculos */}
                    <div className="mt-6 pt-4 border-t">
                      <Button
                        icon={Printer}
                        variant="primary"
                        fullWidth
                        size="lg"
                        onClick={() => {
                          const medicoInfo = medicos.find(m => m.id === medicoId);
                          const logoUrl = window.location.origin + '/logo-biovisao.png';
                          const conteudoImpressao = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>Receita de Óculos</title>
                              <style>
                                @page { size: A4; margin: 15mm; }
                                body { font-family: Arial, sans-serif; padding: 20px; position: relative; }
                                .watermark {
                                  position: fixed;
                                  top: 50%;
                                  left: 50%;
                                  transform: translate(-50%, -50%);
                                  opacity: 0.08;
                                  z-index: 0;
                                  width: 400px;
                                  height: auto;
                                  pointer-events: none;
                                }
                                .content { position: relative; z-index: 1; }
                                .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0d9488; padding-bottom: 15px; }
                                .header h1 { font-size: 22px; color: #0d9488; margin-bottom: 5px; }
                                .header .data { font-size: 12px; color: #666; }
                                .paciente { background: rgba(240, 253, 250, 0.8); padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #0d9488; }
                                .paciente h3 { margin: 0 0 10px 0; font-size: 14px; color: #0d9488; }
                                .paciente-info { font-size: 13px; }
                                .paciente-info span { display: inline-block; margin-right: 25px; margin-bottom: 4px; }
                                .receita-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
                                .receita-table th { background: #0d9488; color: white; padding: 12px; text-align: center; font-size: 13px; }
                                .receita-table td { border: 1px solid #ddd; padding: 12px; text-align: center; font-size: 14px; }
                                .receita-table .olho { background: #f0fdfa; font-weight: bold; color: #0d9488; }
                                .adicao { background: #fff7ed; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #f97316; }
                                .adicao span { font-size: 14px; color: #c2410c; }
                                .adicao strong { font-size: 18px; color: #ea580c; }
                                .observacoes { font-size: 13px; color: #555; margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px; }
                                .medico { text-align: center; margin-top: 50px; }
                                .medico .assinatura { border-top: 2px solid #333; display: inline-block; padding-top: 10px; min-width: 280px; }
                                .medico .nome { font-weight: bold; font-size: 14px; }
                                .medico .crm { font-size: 12px; color: #666; }
                                .validade { text-align: center; font-size: 11px; color: #888; margin-top: 30px; }
                                @media print {
                                  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                                  .watermark { position: fixed; opacity: 0.08; display: block !important; }
                                }
                              </style>
                            </head>
                            <body>
                              <img src="${logoUrl}" alt="" class="watermark" />
                              <div class="content">
                              <div class="header">
                                <h1>RECEITA DE ÓCULOS</h1>
                                <p class="data">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div class="paciente">
                                <h3>Dados do Paciente</h3>
                                <div class="paciente-info">
                                  <span><strong>Prontuário:</strong> ${pacienteAtual?.numeroProntuario || '-'}</span>
                                  <span><strong>Nome Completo:</strong> ${pacienteAtual?.nome || '-'}</span>
                                  <span><strong>CPF:</strong> ${formatarCPF(pacienteAtual?.cpf) || '-'}</span>
                                  <span><strong>Data Nasc.:</strong> ${formatarData(pacienteAtual?.dataNascimento) || '-'}</span>
                                </div>
                              </div>
                              <table class="receita-table">
                                <thead>
                                  <tr>
                                    <th></th>
                                    <th>ESFÉRICO (ESF)</th>
                                    <th>CILÍNDRICO (CIL)</th>
                                    <th>EIXO</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td class="olho">OD (Olho Direito)</td>
                                    <td>${anamnese.oculosOdEsf || '-'}</td>
                                    <td>${anamnese.oculosOdCil || '-'}</td>
                                    <td>${anamnese.oculosOdEixo || '-'}</td>
                                  </tr>
                                  <tr>
                                    <td class="olho">OE (Olho Esquerdo)</td>
                                    <td>${anamnese.oculosOeEsf || '-'}</td>
                                    <td>${anamnese.oculosOeCil || '-'}</td>
                                    <td>${anamnese.oculosOeEixo || '-'}</td>
                                  </tr>
                                </tbody>
                              </table>
                              ${anamnese.oculosAdicao ? `
                              <div class="adicao">
                                <span>ADIÇÃO (para perto): </span>
                                <strong>${anamnese.oculosAdicao}</strong>
                              </div>
                              ` : ''}
                              <div class="medico">
                                <div class="assinatura">
                                  <p class="nome">${usuarioLogado?.nome}</p>
                                  <p class="crm">CRM: ${medicoInfo?.crm || usuarioLogado?.crm || '-'}</p>
                                </div>
                              </div>
                              <p class="validade">Esta receita é válida por 6 meses a partir da data de emissão.</p>
                              </div>
                            </body>
                            </html>
                          `;
                          const janelaImpressao = window.open('', '_blank');
                          janelaImpressao.document.write(conteudoImpressao);
                          janelaImpressao.document.close();
                          janelaImpressao.focus();
                          setTimeout(() => janelaImpressao.print(), 300);
                        }}
                      >
                        Imprimir Receita de Óculos
                      </Button>
                    </div>
                  </Card>
                )}

                {abaAtiva === 'prescricao' && (
                  <Card title="Prescrição / Receituário">
                    <div className="space-y-4">
                      {/* Prévia do Receituário */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-white relative overflow-hidden">
                        {/* Marca d'água */}
                        <div
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          style={{ zIndex: 0 }}
                        >
                          <img
                            src="/logo-biovisao.png"
                            alt=""
                            className="w-80 h-auto opacity-[0.06]"
                          />
                        </div>
                        <div className="relative" style={{ zIndex: 1 }}>
                        <div className="text-center mb-6">
                          <h2 className="text-2xl font-bold text-gray-800">PRESCRIÇÃO</h2>
                          <p className="text-sm text-gray-500 mt-1">Data: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>

                        {/* Dados do Paciente */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <h3 className="font-semibold text-gray-700 mb-2">Paciente</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                            <p><strong>Prontuário:</strong> {pacienteAtual?.numeroProntuario || '-'}</p>
                            <p><strong>Nome Completo:</strong> {pacienteAtual?.nome || '-'}</p>
                            <p><strong>CPF:</strong> {formatarCPF(pacienteAtual?.cpf) || '-'}</p>
                            <p><strong>Data Nasc.:</strong> {formatarData(pacienteAtual?.dataNascimento) || '-'}</p>
                          </div>
                        </div>

                        {/* Área de Prescrição */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prescrição Médica
                          </label>
                          <textarea
                            value={consulta.prescricao}
                            onChange={(e) => setConsulta({ ...consulta, prescricao: e.target.value })}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[200px]"
                            rows={8}
                            placeholder="Digite a prescrição médica aqui...

Exemplo:
1. Colírio X - 1 gota em cada olho, 3x ao dia, por 7 dias
2. Pomada Y - Aplicar à noite, por 14 dias
3. Retorno em 30 dias para reavaliação"
                          />
                        </div>

                        {/* Observações */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observações
                          </label>
                          <textarea
                            value={consulta.observacoes}
                            onChange={(e) => setConsulta({ ...consulta, observacoes: e.target.value })}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                            rows={2}
                            placeholder="Observações adicionais..."
                          />
                        </div>

                        {/* Dados do Médico */}
                        <div className="mt-8 pt-4 border-t border-gray-300 text-center">
                          <div className="inline-block border-t-2 border-gray-400 pt-2 px-8">
                            <p className="font-semibold text-gray-800">
                              {usuarioLogado?.nome}
                            </p>
                            <p className="text-sm text-gray-600">
                              CRM: {medicos.find(m => m.id === medicoId)?.crm || usuarioLogado?.crm || '-'}
                            </p>
                          </div>
                        </div>
                        </div>
                      </div>

                      {/* Data de Retorno */}
                      <Input
                        label="Data de Retorno"
                        type="date"
                        value={consulta.retorno}
                        onChange={(e) => setConsulta({ ...consulta, retorno: e.target.value })}
                      />

                      {/* Botões de Ação */}
                      <div className="pt-4 border-t flex gap-4">
                        <Button
                          icon={Printer}
                          variant="primary"
                          size="lg"
                          onClick={() => {
                            const medicoInfo = medicos.find(m => m.id === medicoId);
                            const logoUrl = window.location.origin + '/logo-biovisao.png';
                            const conteudoImpressao = `
                              <!DOCTYPE html>
                              <html>
                              <head>
                                <title>Prescrição Médica</title>
                                <style>
                                  @page { size: A4; margin: 20mm; }
                                  body { font-family: Arial, sans-serif; padding: 20px; position: relative; }
                                  .watermark {
                                    position: fixed;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%);
                                    opacity: 0.08;
                                    z-index: 0;
                                    width: 400px;
                                    height: auto;
                                    pointer-events: none;
                                  }
                                  .content { position: relative; z-index: 1; }
                                  .header { text-align: center; margin-bottom: 30px; }
                                  .header h1 { font-size: 24px; margin-bottom: 5px; }
                                  .header .data { font-size: 12px; color: #666; }
                                  .paciente { background: rgba(245, 245, 245, 0.8); padding: 15px; border-radius: 8px; margin-bottom: 30px; }
                                  .paciente h3 { margin: 0 0 10px 0; font-size: 14px; }
                                  .paciente-info { display: flex; flex-wrap: wrap; gap: 20px; font-size: 13px; }
                                  .paciente-info span { margin-bottom: 4px; }
                                  .prescricao { min-height: 300px; white-space: pre-wrap; line-height: 1.8; font-size: 14px; margin-bottom: 30px; }
                                  .observacoes { font-size: 13px; color: #555; margin-bottom: 40px; font-style: italic; }
                                  .medico { text-align: center; margin-top: 60px; }
                                  .medico .assinatura { border-top: 2px solid #333; display: inline-block; padding-top: 10px; min-width: 250px; }
                                  .medico .nome { font-weight: bold; font-size: 14px; }
                                  .medico .crm { font-size: 12px; color: #666; }
                                  @media print {
                                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                                    .watermark { position: fixed; opacity: 0.08; display: block !important; }
                                  }
                                </style>
                              </head>
                              <body>
                                <img src="${logoUrl}" alt="" class="watermark" />
                                <div class="content">
                                <div class="header">
                                  <h1>PRESCRIÇÃO</h1>
                                  <p class="data">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div class="paciente">
                                  <h3>Paciente</h3>
                                  <div class="paciente-info">
                                    <span><strong>Prontuário:</strong> ${pacienteAtual?.numeroProntuario || '-'}</span>
                                    <span><strong>Nome Completo:</strong> ${pacienteAtual?.nome || '-'}</span>
                                    <span><strong>CPF:</strong> ${formatarCPF(pacienteAtual?.cpf) || '-'}</span>
                                    <span><strong>Data Nasc.:</strong> ${formatarData(pacienteAtual?.dataNascimento) || '-'}</span>
                                  </div>
                                </div>
                                <div class="prescricao">${consulta.prescricao || 'Nenhuma prescrição informada.'}</div>
                                ${consulta.observacoes ? `<div class="observacoes"><strong>Observações:</strong> ${consulta.observacoes}</div>` : ''}
                                <div class="medico">
                                  <div class="assinatura">
                                    <p class="nome">${usuarioLogado?.nome}</p>
                                    <p class="crm">CRM: ${medicoInfo?.crm || usuarioLogado?.crm || '-'}</p>
                                  </div>
                                </div>
                                </div>
                              </body>
                              </html>
                            `;
                            const janelaImpressao = window.open('', '_blank');
                            janelaImpressao.document.write(conteudoImpressao);
                            janelaImpressao.document.close();
                            janelaImpressao.focus();
                            setTimeout(() => janelaImpressao.print(), 300);
                          }}
                          className="flex-1"
                        >
                          Imprimir Receituário
                        </Button>
                        <Button
                          icon={Save}
                          variant="success"
                          size="lg"
                          onClick={handleFinalizarAtendimento}
                          className="flex-1"
                        >
                          Finalizar Atendimento
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {abaAtiva === 'historico' && (
                  <Card title="Histórico de Consultas">
                    {historicoConsultas.length > 0 ? (
                      <div className="space-y-4">
                        {historicoConsultas.map((registro) => (
                          <div key={registro.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="bg-teal-100 text-teal-800 px-2 py-1 rounded text-sm font-medium">
                                  {formatarData(registro.data)}
                                </span>
                                <span className="ml-2 text-gray-600">
                                  {registro.medicoNome}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {registro.procedimento}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              {registro.diagnostico && (
                                <p><strong>Diagnóstico:</strong> {registro.diagnostico}</p>
                              )}
                              {registro.prescricao && (
                                <p><strong>Prescrição:</strong> {registro.prescricao}</p>
                              )}
                              {registro.observacoes && (
                                <p><strong>Observações:</strong> {registro.observacoes}</p>
                              )}
                              {registro.anamnese?.queixaPrincipal && (
                                <p><strong>Queixa:</strong> {registro.anamnese.queixaPrincipal}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <History size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Nenhuma consulta anterior registrada</p>
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultorioScreen;
