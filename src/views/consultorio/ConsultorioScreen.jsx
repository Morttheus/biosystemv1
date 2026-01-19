// src/views/consultorio/ConsultorioScreen.jsx
import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';

const ConsultorioScreen = () => {
  const { usuarioLogado, logout } = useAuth();
  const {
    filaAtendimento,
    pacientes,
    chamarPaciente,
    registrarChamada,
    finalizarAtendimento,
    obterProntuarioPaciente,
    getClinicaIdUsuario,
  } = useData();

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
    // Acuidade Visual
    avOlhoDireitoSC: '',
    avOlhoDireitoCC: '',
    avOlhoEsquerdoSC: '',
    avOlhoEsquerdoCC: '',
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

  // Médico logado (suporta ambos formatos)
  const medicoId = usuarioLogado?.medicoId || usuarioLogado?.medico_id;

  // Helper para comparar medicoId (suporta ambos formatos)
  const matchMedico = (a) => {
    const atendMedicoId = a.medicoId || a.medico_id;
    return atendMedicoId === medicoId;
  };

  // Fila do médico (suporta ambos formatos de campo)
  const filaMedico = filaAtendimento.filter(
    a => matchMedico(a) && a.status !== 'atendido'
  );

  // Pacientes aguardando atendimento
  const aguardando = filaMedico.filter(a => a.status === 'aguardando');

  // Pacientes atendidos no dia (suporta ambos formatos)
  const atendidos = filaAtendimento.filter(a => {
    const horarioFinal = a.horarioFinalizacao || a.horario_finalizacao;
    return matchMedico(a) && a.status === 'atendido' &&
      horarioFinal && new Date(horarioFinal).toDateString() === new Date().toDateString();
  });

  // Atendimento em andamento (status 'atendendo' no backend)
  const emAtendimento = filaAtendimento.find(
    a => matchMedico(a) && a.status === 'atendendo'
  );

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

      // Registra a chamada no painel de sala de espera
      registrarChamada(
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

  const handleFinalizarAtendimento = () => {
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
    };

    const resultado = finalizarAtendimento(atendimentoAtual.id, dadosConsulta);

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
        avOlhoDireitoSC: '',
        avOlhoDireitoCC: '',
        avOlhoEsquerdoSC: '',
        avOlhoEsquerdoCC: '',
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Stethoscope size={28} />
                Consultório Médico
              </h1>
              <p className="text-teal-100 text-sm">
                Dr(a). {usuarioLogado?.nome}
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
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' :
            mensagem.tipo === 'erro' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {mensagem.texto}
            <button onClick={() => setMensagem({ tipo: '', texto: '' })} className="ml-auto">
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
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{pacienteNome}</p>
                          <p className="text-xs text-gray-500">{procedimentoNome}</p>
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
                  <p className="text-center text-gray-500 py-4 text-sm">Nenhum paciente aguardando</p>
                )}
              </div>
            </Card>

            {/* Pacientes Atendidos */}
            <Card title="Atendidos Hoje" className="mt-4">
              <button
                onClick={() => setExpandirAtendidos(!expandirAtendidos)}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded"
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
                        className="p-2 bg-green-50 rounded-lg text-sm border-l-4 border-green-600"
                      >
                        <p className="font-medium text-green-900">{pacienteNome}</p>
                        <p className="text-xs text-green-700">
                          {horarioFinal ? new Date(horarioFinal).toLocaleTimeString('pt-BR') : '-'}
                        </p>
                      </div>
                    );
                  })}
                  {atendidos.length === 0 && (
                    <p className="text-center text-gray-500 py-4 text-sm">Nenhum paciente atendido ainda</p>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-3">
            {!pacienteAtual && !emAtendimento ? (
              <Card>
                <div className="text-center py-12 text-gray-500">
                  <Eye size={64} className="mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">Nenhum paciente em atendimento</h3>
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
                        <h3 className="text-xl font-bold">{pacienteAtual?.nome}</h3>
                        <p className="text-gray-500">
                          CPF: {formatarCPF(pacienteAtual?.cpf)} | Prontuário: {pacienteAtual?.prontuarioId}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          {pacienteAtual?.telefone && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Phone size={14} /> {pacienteAtual.telefone}
                            </span>
                          )}
                          {pacienteAtual?.dataNascimento && (
                            <span className="flex items-center gap-1 text-gray-600">
                              <Calendar size={14} /> {formatarData(pacienteAtual.dataNascimento)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Em Atendimento
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        {atendimentoAtual?.procedimentoNome}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Abas */}
                <div className="bg-white rounded-lg p-2 shadow mb-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => setAbaAtiva('anamnese')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      abaAtiva === 'anamnese' ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <FileText size={20} />
                    Anamnese
                  </button>
                  <button
                    onClick={() => setAbaAtiva('exame')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      abaAtiva === 'exame' ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Eye size={20} />
                    Exame Oftalmológico
                  </button>
                  <button
                    onClick={() => setAbaAtiva('diagnostico')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      abaAtiva === 'diagnostico' ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <Stethoscope size={20} />
                    Diagnóstico e Prescrição
                  </button>
                  <button
                    onClick={() => setAbaAtiva('historico')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      abaAtiva === 'historico' ? 'bg-teal-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Queixa Principal *
                        </label>
                        <textarea
                          value={anamnese.queixaPrincipal}
                          onChange={(e) => setAnamnese({ ...anamnese, queixaPrincipal: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          rows={3}
                          placeholder="Descreva a queixa principal do paciente..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          História da Doença Atual
                        </label>
                        <textarea
                          value={anamnese.historiaDoencaAtual}
                          onChange={(e) => setAnamnese({ ...anamnese, historiaDoencaAtual: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          rows={3}
                          placeholder="Evolução dos sintomas, tratamentos anteriores..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Histórico Ocular
                          </label>
                          <textarea
                            value={anamnese.historicoOcular}
                            onChange={(e) => setAnamnese({ ...anamnese, historicoOcular: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            rows={2}
                            placeholder="Doenças oculares anteriores..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Histórico Familiar
                          </label>
                          <textarea
                            value={anamnese.historicoFamiliar}
                            onChange={(e) => setAnamnese({ ...anamnese, historicoFamiliar: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                    </div>
                  </Card>
                )}

                {abaAtiva === 'exame' && (
                  <div className="space-y-6">
                    {/* Acuidade Visual */}
                    <Card title="Acuidade Visual">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            <Eye size={20} /> Olho Direito (OD)
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Sem Correção (SC)"
                              value={anamnese.avOlhoDireitoSC}
                              onChange={(e) => setAnamnese({ ...anamnese, avOlhoDireitoSC: e.target.value })}
                              placeholder="20/20"
                            />
                            <Input
                              label="Com Correção (CC)"
                              value={anamnese.avOlhoDireitoCC}
                              onChange={(e) => setAnamnese({ ...anamnese, avOlhoDireitoCC: e.target.value })}
                              placeholder="20/20"
                            />
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                            <Eye size={20} /> Olho Esquerdo (OE)
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              label="Sem Correção (SC)"
                              value={anamnese.avOlhoEsquerdoSC}
                              onChange={(e) => setAnamnese({ ...anamnese, avOlhoEsquerdoSC: e.target.value })}
                              placeholder="20/20"
                            />
                            <Input
                              label="Com Correção (CC)"
                              value={anamnese.avOlhoEsquerdoCC}
                              onChange={(e) => setAnamnese({ ...anamnese, avOlhoEsquerdoCC: e.target.value })}
                              placeholder="20/20"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Tonometria */}
                    <Card title="Tonometria (Pressão Intraocular)">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Olho Direito (OD) - mmHg"
                          value={anamnese.pressaoOlhoDireito}
                          onChange={(e) => setAnamnese({ ...anamnese, pressaoOlhoDireito: e.target.value })}
                          placeholder="Ex: 14"
                        />
                        <Input
                          label="Olho Esquerdo (OE) - mmHg"
                          value={anamnese.pressaoOlhoEsquerdo}
                          onChange={(e) => setAnamnese({ ...anamnese, pressaoOlhoEsquerdo: e.target.value })}
                          placeholder="Ex: 15"
                        />
                      </div>
                    </Card>

                    {/* Biomicroscopia */}
                    <Card title="Biomicroscopia">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Olho Direito (OD)
                          </label>
                          <textarea
                            value={anamnese.biomicroscopiaOD}
                            onChange={(e) => setAnamnese({ ...anamnese, biomicroscopiaOD: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            rows={3}
                            placeholder="Córnea, conjuntiva, câmara anterior, íris, cristalino..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Olho Esquerdo (OE)
                          </label>
                          <textarea
                            value={anamnese.biomicroscopiaOE}
                            onChange={(e) => setAnamnese({ ...anamnese, biomicroscopiaOE: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            rows={3}
                            placeholder="Córnea, conjuntiva, câmara anterior, íris, cristalino..."
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Fundoscopia */}
                    <Card title="Fundoscopia">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Olho Direito (OD)
                          </label>
                          <textarea
                            value={anamnese.fundoscopiaOD}
                            onChange={(e) => setAnamnese({ ...anamnese, fundoscopiaOD: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            rows={3}
                            placeholder="Papila, mácula, vasos, retina periférica..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Olho Esquerdo (OE)
                          </label>
                          <textarea
                            value={anamnese.fundoscopiaOE}
                            onChange={(e) => setAnamnese({ ...anamnese, fundoscopiaOE: e.target.value })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            rows={3}
                            placeholder="Papila, mácula, vasos, retina periférica..."
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {abaAtiva === 'diagnostico' && (
                  <Card title="Diagnóstico e Prescrição">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Diagnóstico *
                        </label>
                        <textarea
                          value={consulta.diagnostico}
                          onChange={(e) => setConsulta({ ...consulta, diagnostico: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          rows={3}
                          placeholder="Diagnóstico do paciente..."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prescrição / Conduta
                        </label>
                        <textarea
                          value={consulta.prescricao}
                          onChange={(e) => setConsulta({ ...consulta, prescricao: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          rows={4}
                          placeholder="Medicamentos, colírios, procedimentos recomendados..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Observações
                        </label>
                        <textarea
                          value={consulta.observacoes}
                          onChange={(e) => setConsulta({ ...consulta, observacoes: e.target.value })}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          rows={2}
                          placeholder="Observações adicionais..."
                        />
                      </div>

                      <Input
                        label="Data de Retorno"
                        type="date"
                        value={consulta.retorno}
                        onChange={(e) => setConsulta({ ...consulta, retorno: e.target.value })}
                      />

                      <div className="pt-4 border-t">
                        <Button
                          icon={Save}
                          variant="success"
                          fullWidth
                          size="lg"
                          onClick={handleFinalizarAtendimento}
                        >
                          Finalizar Atendimento e Salvar no Prontuário
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
                                  Dr(a). {registro.medicoNome}
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
