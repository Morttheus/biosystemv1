// src/views/agendamento/AgendamentoScreen.jsx
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

const AgendamentoScreen = () => {
  const { usuarioLogado } = useAuth();
  const { pacientes, medicos, procedimentos, clinicas } = useData();

  const clinicaId = usuarioLogado?.clinicaId || usuarioLogado?.clinica_id;
  const clinicaAtual = clinicas.find(c => c.id === clinicaId);

  // Médicos da clínica
  const medicosClinica = medicos.filter(m => {
    const medicoClinicaId = m.clinicaId || m.clinica_id;
    return medicoClinicaId === clinicaId;
  });

  // Estado do calendário
  const [dataAtual, setDataAtual] = useState(new Date());
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState('semana'); // 'dia', 'semana', 'mes'

  // Estado dos agendamentos (localStorage)
  const [agendamentos, setAgendamentos] = useState(() => {
    const saved = localStorage.getItem(`biosystem-agendamentos-${clinicaId}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Modal de novo agendamento
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  // Busca de paciente
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);

  // Form de agendamento
  const [form, setForm] = useState({
    data: '',
    hora: '',
    medicoId: '',
    procedimentoId: '',
    observacoes: ''
  });

  // Horários disponíveis
  const horariosDisponiveis = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  // Salvar agendamentos no localStorage
  useEffect(() => {
    localStorage.setItem(`biosystem-agendamentos-${clinicaId}`, JSON.stringify(agendamentos));
  }, [agendamentos, clinicaId]);

  // Filtrar pacientes pela busca
  const pacientesFiltrados = buscaPaciente.length >= 2
    ? pacientes.filter(p =>
        p.nome.toLowerCase().includes(buscaPaciente.toLowerCase()) ||
        p.cpf?.includes(buscaPaciente.replace(/\D/g, ''))
      ).slice(0, 5)
    : [];

  // Funções de navegação do calendário
  const irParaHoje = () => {
    setDataAtual(new Date());
    setDataSelecionada(new Date());
  };

  const navegarAnterior = () => {
    const novaData = new Date(dataAtual);
    if (visualizacao === 'dia') {
      novaData.setDate(novaData.getDate() - 1);
    } else if (visualizacao === 'semana') {
      novaData.setDate(novaData.getDate() - 7);
    } else {
      novaData.setMonth(novaData.getMonth() - 1);
    }
    setDataAtual(novaData);
  };

  const navegarProximo = () => {
    const novaData = new Date(dataAtual);
    if (visualizacao === 'dia') {
      novaData.setDate(novaData.getDate() + 1);
    } else if (visualizacao === 'semana') {
      novaData.setDate(novaData.getDate() + 7);
    } else {
      novaData.setMonth(novaData.getMonth() + 1);
    }
    setDataAtual(novaData);
  };

  // Obter dias da semana
  const obterDiasSemana = () => {
    const dias = [];
    const inicioSemana = new Date(dataAtual);
    inicioSemana.setDate(dataAtual.getDate() - dataAtual.getDay());

    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  // Obter agendamentos do dia
  const obterAgendamentosDia = (data) => {
    const dataStr = data.toISOString().split('T')[0];
    return agendamentos.filter(a => a.data === dataStr);
  };

  // Verificar se horário está ocupado
  const horarioOcupado = (data, hora, medicoId, excluirId = null) => {
    const dataStr = data.toISOString().split('T')[0];
    return agendamentos.some(a =>
      a.data === dataStr &&
      a.hora === hora &&
      a.medicoId === parseInt(medicoId) &&
      a.id !== excluirId
    );
  };

  // Abrir modal para novo agendamento
  const abrirNovoAgendamento = (data = null, hora = null) => {
    setPacienteSelecionado(null);
    setBuscaPaciente('');
    setForm({
      data: data ? data.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      hora: hora || '',
      medicoId: '',
      procedimentoId: '',
      observacoes: ''
    });
    setAgendamentoEditando(null);
    setModalAberto(true);
  };

  // Abrir modal para editar agendamento
  const abrirEditarAgendamento = (agendamento) => {
    const paciente = pacientes.find(p => p.id === agendamento.pacienteId);
    setPacienteSelecionado(paciente);
    setBuscaPaciente(paciente?.nome || '');
    setForm({
      data: agendamento.data,
      hora: agendamento.hora,
      medicoId: agendamento.medicoId.toString(),
      procedimentoId: agendamento.procedimentoId?.toString() || '',
      observacoes: agendamento.observacoes || ''
    });
    setAgendamentoEditando(agendamento);
    setModalAberto(true);
  };

  // Salvar agendamento
  const handleSalvar = () => {
    if (!pacienteSelecionado) {
      setMensagem({ tipo: 'erro', texto: 'Selecione um paciente!' });
      return;
    }
    if (!form.data || !form.hora) {
      setMensagem({ tipo: 'erro', texto: 'Data e hora são obrigatórios!' });
      return;
    }
    if (!form.medicoId) {
      setMensagem({ tipo: 'erro', texto: 'Selecione um médico!' });
      return;
    }

    const dataAgendamento = new Date(form.data + 'T00:00:00');
    if (horarioOcupado(dataAgendamento, form.hora, form.medicoId, agendamentoEditando?.id)) {
      setMensagem({ tipo: 'erro', texto: 'Este horário já está ocupado para este médico!' });
      return;
    }

    const medico = medicosClinica.find(m => m.id === parseInt(form.medicoId));
    const procedimento = procedimentos.find(p => p.id === parseInt(form.procedimentoId));

    const novoAgendamento = {
      id: agendamentoEditando?.id || Date.now(),
      pacienteId: pacienteSelecionado.id,
      pacienteNome: pacienteSelecionado.nome,
      medicoId: parseInt(form.medicoId),
      medicoNome: medico?.nome,
      procedimentoId: form.procedimentoId ? parseInt(form.procedimentoId) : null,
      procedimentoNome: procedimento?.nome || 'Consulta',
      data: form.data,
      hora: form.hora,
      observacoes: form.observacoes,
      status: 'agendado',
      clinicaId
    };

    if (agendamentoEditando) {
      setAgendamentos(prev => prev.map(a => a.id === agendamentoEditando.id ? novoAgendamento : a));
      setMensagem({ tipo: 'sucesso', texto: 'Agendamento atualizado com sucesso!' });
    } else {
      setAgendamentos(prev => [...prev, novoAgendamento]);
      setMensagem({ tipo: 'sucesso', texto: 'Agendamento criado com sucesso!' });
    }

    setModalAberto(false);
    setTimeout(() => setMensagem({ tipo: '', texto: '' }), 3000);
  };

  // Excluir agendamento
  const handleExcluir = (id) => {
    if (window.confirm('Deseja realmente excluir este agendamento?')) {
      setAgendamentos(prev => prev.filter(a => a.id !== id));
      setMensagem({ tipo: 'sucesso', texto: 'Agendamento excluído!' });
      setTimeout(() => setMensagem({ tipo: '', texto: '' }), 3000);
    }
  };

  // Marcar como confirmado/cancelado
  const alterarStatus = (id, novoStatus) => {
    setAgendamentos(prev => prev.map(a =>
      a.id === id ? { ...a, status: novoStatus } : a
    ));
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  };

  const diasSemana = obterDiasSemana();
  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Mensagem */}
      {mensagem.texto && (
        <div className={`p-4 rounded-lg flex items-center gap-2 transition-colors ${
          mensagem.tipo === 'sucesso'
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {mensagem.tipo === 'sucesso' ? <Check size={20} /> : <AlertCircle size={20} />}
          {mensagem.texto}
          <button onClick={() => setMensagem({ tipo: '', texto: '' })} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header do Calendário */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={irParaHoje}>
              Hoje
            </Button>
            <div className="flex items-center gap-2">
              <button
                onClick={navegarAnterior}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={navegarProximo}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {dataAtual.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric'
              })}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {['dia', 'semana', 'mes'].map((vis) => (
                <button
                  key={vis}
                  onClick={() => setVisualizacao(vis)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    visualizacao === vis
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {vis.charAt(0).toUpperCase() + vis.slice(1)}
                </button>
              ))}
            </div>
            <Button icon={Plus} onClick={() => abrirNovoAgendamento()}>
              Novo Agendamento
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendário Semanal */}
      {visualizacao === 'semana' && (
        <Card>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header dos dias */}
              <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
                <div className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  Horário
                </div>
                {diasSemana.map((dia, index) => {
                  const diaStr = dia.toISOString().split('T')[0];
                  const isHoje = diaStr === hoje;
                  return (
                    <div
                      key={index}
                      className={`p-3 text-center border-l border-gray-200 dark:border-gray-700 ${
                        isHoje ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                        {dia.toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </p>
                      <p className={`text-lg font-semibold ${
                        isHoje ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-100'
                      }`}>
                        {dia.getDate()}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Grade de horários */}
              <div className="max-h-[600px] overflow-y-auto">
                {horariosDisponiveis.map((hora) => (
                  <div key={hora} className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800">
                    <div className="p-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                      {hora}
                    </div>
                    {diasSemana.map((dia, index) => {
                      const diaStr = dia.toISOString().split('T')[0];
                      const agendamentosDia = agendamentos.filter(
                        a => a.data === diaStr && a.hora === hora
                      );
                      return (
                        <div
                          key={index}
                          className="p-1 border-l border-gray-100 dark:border-gray-800 min-h-[60px] hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                          onClick={() => agendamentosDia.length === 0 && abrirNovoAgendamento(dia, hora)}
                        >
                          {agendamentosDia.map((agend) => (
                            <div
                              key={agend.id}
                              onClick={(e) => { e.stopPropagation(); abrirEditarAgendamento(agend); }}
                              className={`p-1 rounded text-xs mb-1 cursor-pointer ${
                                agend.status === 'confirmado'
                                  ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-l-2 border-green-500'
                                  : agend.status === 'cancelado'
                                  ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-l-2 border-red-500'
                                  : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-l-2 border-blue-500'
                              }`}
                            >
                              <p className="font-medium truncate">{agend.pacienteNome}</p>
                              <p className="truncate opacity-75">{agend.medicoNome}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de agendamentos do dia */}
      {visualizacao === 'dia' && (
        <Card title={`Agendamentos - ${dataAtual.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}`}>
          <div className="space-y-3">
            {obterAgendamentosDia(dataAtual).length > 0 ? (
              obterAgendamentosDia(dataAtual)
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((agend) => (
                  <div
                    key={agend.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      agend.status === 'confirmado'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : agend.status === 'cancelado'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{agend.hora}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{agend.pacienteNome}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{agend.medicoNome}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{agend.procedimentoNome}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {agend.status === 'agendado' && (
                        <>
                          <Button size="sm" variant="success" onClick={() => alterarStatus(agend.id, 'confirmado')}>
                            <Check size={16} />
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => alterarStatus(agend.id, 'cancelado')}>
                            <X size={16} />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="secondary" onClick={() => abrirEditarAgendamento(agend)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleExcluir(agend.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                <p>Nenhum agendamento para este dia</p>
                <Button className="mt-4" onClick={() => abrirNovoAgendamento(dataAtual)}>
                  <Plus size={16} className="mr-2" />
                  Agendar Consulta
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Visão Mensal */}
      {visualizacao === 'mes' && (
        <Card>
          <div className="grid grid-cols-7 gap-1">
            {/* Header dos dias da semana */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
              <div key={dia} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {dia}
              </div>
            ))}

            {/* Dias do mês */}
            {(() => {
              const primeiroDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
              const ultimoDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
              const dias = [];

              // Dias vazios antes do primeiro dia
              for (let i = 0; i < primeiroDia.getDay(); i++) {
                dias.push(<div key={`empty-${i}`} className="p-2" />);
              }

              // Dias do mês
              for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
                const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), dia);
                const dataStr = data.toISOString().split('T')[0];
                const agendDia = agendamentos.filter(a => a.data === dataStr);
                const isHoje = dataStr === hoje;

                dias.push(
                  <div
                    key={dia}
                    onClick={() => {
                      setDataAtual(data);
                      setVisualizacao('dia');
                    }}
                    className={`p-2 min-h-[80px] border border-gray-100 dark:border-gray-700 rounded-lg cursor-pointer transition-colors ${
                      isHoje ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <p className={`text-sm font-medium ${
                      isHoje ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {dia}
                    </p>
                    {agendDia.length > 0 && (
                      <div className="mt-1">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          {agendDia.length} agend.
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              return dias;
            })()}
          </div>
        </Card>
      )}

      {/* Modal de Agendamento */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {agendamentoEditando ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Busca de Paciente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Paciente *
                </label>
                <div className="relative">
                  <Input
                    value={buscaPaciente}
                    onChange={(e) => {
                      setBuscaPaciente(e.target.value);
                      setPacienteSelecionado(null);
                    }}
                    placeholder="Buscar por nome ou CPF..."
                  />
                  {pacientesFiltrados.length > 0 && !pacienteSelecionado && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {pacientesFiltrados.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setPacienteSelecionado(p);
                            setBuscaPaciente(p.nome);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <p className="font-medium text-gray-900 dark:text-gray-100">{p.nome}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">CPF: {p.cpf}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {pacienteSelecionado && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Check size={14} /> Paciente selecionado
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Data *"
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                />
                <Select
                  label="Horário *"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  options={horariosDisponiveis.map(h => ({ value: h, label: h }))}
                />
              </div>

              <Select
                label="Médico *"
                value={form.medicoId}
                onChange={(e) => setForm({ ...form, medicoId: e.target.value })}
                options={medicosClinica.map(m => ({ value: m.id.toString(), label: m.nome }))}
              />

              <Select
                label="Procedimento"
                value={form.procedimentoId}
                onChange={(e) => setForm({ ...form, procedimentoId: e.target.value })}
                options={procedimentos.map(p => ({ value: p.id.toString(), label: p.nome }))}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observações
                </label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  rows={2}
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSalvar}>
                {agendamentoEditando ? 'Salvar Alterações' : 'Agendar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendamentoScreen;
