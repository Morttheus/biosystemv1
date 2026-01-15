// src/context/DataContext.jsx
import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData deve ser usado dentro de um DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const { usuarioLogado, isMaster } = useAuth();

  // Clínicas
  const [clinicas, setClinicas] = useState([
    { id: 1, nome: 'BioSystem Oftalmologia Centro', endereco: 'Rua Principal, 100', telefone: '(11) 3333-3333', ativa: true },
    { id: 2, nome: 'BioSystem Oftalmologia Sul', endereco: 'Av. Sul, 500', telefone: '(11) 4444-4444', ativa: true },
  ]);

  // Médicos
  const [medicos, setMedicos] = useState([
    { id: 1, nome: 'Carlos Silva', crm: '12345-SP', especialidade: 'Oftalmologia Geral', clinicaId: 1, ativo: true },
    { id: 2, nome: 'Maria Santos', crm: '54321-SP', especialidade: 'Retina e Vítreo', clinicaId: 1, ativo: true },
    { id: 3, nome: 'João Oliveira', crm: '11111-SP', especialidade: 'Glaucoma', clinicaId: 2, ativo: true },
  ]);

  // Procedimentos (globais - todas as clínicas usam os mesmos)
  const [procedimentos, setProcedimentos] = useState([
    { id: 1, nome: 'Consulta Oftalmológica', valor: 250.00, duracao: 30, ativo: true },
    { id: 2, nome: 'Exame de Fundo de Olho', valor: 150.00, duracao: 20, ativo: true },
    { id: 3, nome: 'Tonometria', valor: 80.00, duracao: 15, ativo: true },
    { id: 4, nome: 'Campimetria', valor: 200.00, duracao: 45, ativo: true },
    { id: 5, nome: 'Mapeamento de Retina', valor: 180.00, duracao: 30, ativo: true },
    { id: 6, nome: 'Topografia Corneana', valor: 220.00, duracao: 25, ativo: true },
    { id: 7, nome: 'OCT - Tomografia de Coerência Óptica', valor: 350.00, duracao: 20, ativo: true },
  ]);

  // Pacientes (com prontuário eletrônico integrado)
  const [pacientes, setPacientes] = useState([]);

  // Prontuários (histórico de consultas)
  const [prontuarios, setProntuarios] = useState([]);

  // Fila de atendimento
  const [filaAtendimento, setFilaAtendimento] = useState([]);

  // Chamadas de pacientes (para painel de sala de espera)
  const [chamadas, setChamadas] = useState([]);
  const [chamadaAtual, setChamadaAtual] = useState(null);

  // ============ HELPER - OBTER CLÍNICA DO USUÁRIO ============
  const getClinicaIdUsuario = () => {
    return usuarioLogado?.clinicaId || null;
  };

  // ============ FUNÇÕES DE CLÍNICAS ============
  const adicionarClinica = (clinica) => {
    const novaClinica = {
      ...clinica,
      id: Date.now(),
      ativa: true,
    };
    setClinicas(prev => [...prev, novaClinica]);
    return novaClinica;
  };

  const editarClinica = (id, dados) => {
    setClinicas(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c));
  };

  const excluirClinica = (id) => {
    setClinicas(prev => prev.map(c => c.id === id ? { ...c, ativa: false } : c));
  };

  // ============ FUNÇÕES DE MÉDICOS ============
  const adicionarMedico = (medico) => {
    const novoMedico = {
      ...medico,
      id: Date.now(),
      ativo: true,
    };
    setMedicos(prev => [...prev, novoMedico]);
    return novoMedico;
  };

  const editarMedico = (id, dados) => {
    setMedicos(prev => prev.map(m => m.id === id ? { ...m, ...dados } : m));
  };

  const excluirMedico = (id) => {
    setMedicos(prev => prev.map(m => m.id === id ? { ...m, ativo: false } : m));
  };

  // ============ FUNÇÕES DE PROCEDIMENTOS ============
  const adicionarProcedimento = (procedimento) => {
    const novoProcedimento = {
      ...procedimento,
      id: Date.now(),
      ativo: true,
    };
    setProcedimentos(prev => [...prev, novoProcedimento]);
    return novoProcedimento;
  };

  const editarProcedimento = (id, dados) => {
    setProcedimentos(prev => prev.map(p => p.id === id ? { ...p, ...dados } : p));
  };

  const excluirProcedimento = (id) => {
    setProcedimentos(prev => prev.map(p => p.id === id ? { ...p, ativo: false } : p));
  };

  // ============ FUNÇÕES DE PACIENTES ============
  const buscarPacientePorCPF = (cpf) => {
    const cpfLimpo = cpf.replace(/\D/g, '');
    return pacientes.find(p => p.cpf.replace(/\D/g, '') === cpfLimpo);
  };

  const cadastrarPaciente = (dadosPaciente) => {
    const cpfLimpo = dadosPaciente.cpf.replace(/\D/g, '');

    // Verifica se já existe paciente com esse CPF
    const pacienteExistente = buscarPacientePorCPF(cpfLimpo);
    if (pacienteExistente) {
      return { success: false, error: 'Paciente já cadastrado com este CPF', paciente: pacienteExistente };
    }

    const novoPaciente = {
      ...dadosPaciente,
      id: Date.now(),
      cpf: cpfLimpo,
      clinicaId: getClinicaIdUsuario(), // Vincula paciente à clínica do usuário
      dataCadastro: new Date().toISOString(),
      prontuarioId: `PRONT-${Date.now()}`,
      historicoConsultas: [],
    };

    setPacientes(prev => [...prev, novoPaciente]);
    return { success: true, paciente: novoPaciente };
  };

  const atualizarPaciente = (id, dados) => {
    setPacientes(prev => prev.map(p => p.id === id ? { ...p, ...dados } : p));
  };

  // ============ FUNÇÕES DE FILA DE ATENDIMENTO ============
  const adicionarNaFila = (pacienteId, medicoId, procedimentoId, clinicaId) => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    const medico = medicos.find(m => m.id === medicoId);
    const procedimento = procedimentos.find(p => p.id === procedimentoId);

    const novoAtendimento = {
      id: Date.now(),
      pacienteId,
      pacienteNome: paciente?.nome,
      pacienteCPF: paciente?.cpf,
      medicoId,
      medicoNome: medico?.nome,
      procedimentoId,
      procedimentoNome: procedimento?.nome,
      clinicaId,
      valor: procedimento?.valor || 0,
      status: 'aguardando', // aguardando, em_atendimento, atendido
      horarioChegada: new Date().toISOString(),
      horarioAtendimento: null,
      horarioFinalizacao: null,
    };

    setFilaAtendimento(prev => [...prev, novoAtendimento]);
    return novoAtendimento;
  };

  const chamarPaciente = (atendimentoId) => {
    setFilaAtendimento(prev => prev.map(a =>
      a.id === atendimentoId
        ? { ...a, status: 'em_atendimento', horarioAtendimento: new Date().toISOString() }
        : a
    ));
  };

  const obterAtendimentoAtual = (medicoId) => {
    return filaAtendimento.find(a => a.medicoId === medicoId && a.status === 'em_atendimento');
  };

  const finalizarAtendimento = (atendimentoId, dadosConsulta) => {
    const atendimento = filaAtendimento.find(a => a.id === atendimentoId);
    if (!atendimento) return null;

    // Cria registro no prontuário
    const registroProntuario = {
      id: Date.now(),
      atendimentoId,
      pacienteId: atendimento.pacienteId,
      medicoId: atendimento.medicoId,
      medicoNome: atendimento.medicoNome,
      clinicaId: atendimento.clinicaId,
      procedimento: atendimento.procedimentoNome,
      data: new Date().toISOString(),
      anamnese: dadosConsulta.anamnese || {},
      diagnostico: dadosConsulta.diagnostico || '',
      prescricao: dadosConsulta.prescricao || '',
      observacoes: dadosConsulta.observacoes || '',
      retorno: dadosConsulta.retorno || null,
    };

    setProntuarios(prev => [...prev, registroProntuario]);

    // Atualiza histórico do paciente
    setPacientes(prev => prev.map(p => {
      if (p.id === atendimento.pacienteId) {
        return {
          ...p,
          historicoConsultas: [...(p.historicoConsultas || []), registroProntuario.id],
        };
      }
      return p;
    }));

    // Marca atendimento como finalizado
    setFilaAtendimento(prev => prev.map(a =>
      a.id === atendimentoId
        ? { ...a, status: 'atendido', horarioFinalizacao: new Date().toISOString() }
        : a
    ));

    return registroProntuario;
  };

  const removerDaFila = (atendimentoId) => {
    setFilaAtendimento(prev => prev.filter(a => a.id !== atendimentoId));
  };

  // ============ FUNÇÕES DE PRONTUÁRIO ============
  const obterProntuarioPaciente = (pacienteId) => {
    return prontuarios.filter(p => p.pacienteId === pacienteId).sort((a, b) =>
      new Date(b.data) - new Date(a.data)
    );
  };

  const obterTodosProntuarios = () => {
    return prontuarios.map(p => {
      const paciente = pacientes.find(pac => pac.id === p.pacienteId);
      return {
        ...p,
        pacienteNome: paciente?.nome,
        pacienteCPF: paciente?.cpf,
      };
    }).sort((a, b) => new Date(b.data) - new Date(a.data));
  };

  // ============ FUNÇÕES DE CHAMADAS DE PACIENTES ============
  const registrarChamada = (pacienteId, pacienteNome, medicoId, medicoNome, clinicaId) => {
    const novaChamada = {
      id: Date.now(),
      pacienteId,
      pacienteNome,
      medicoId,
      medicoNome,
      clinicaId,
      dataHora: new Date().toISOString(),
      ativa: true,
    };

    setChamadas(prev => [novaChamada, ...prev]);
    setChamadaAtual(novaChamada);

    // Desativa a chamada após 30 segundos
    setTimeout(() => {
      setChamadaAtual(null);
      setChamadas(prev => prev.map(c => c.id === novaChamada.id ? { ...c, ativa: false } : c));
    }, 30000); // 30 segundos

    return novaChamada;
  };

  const obterChamadasDia = () => {
    const hoje = new Date().toDateString();
    return chamadas.filter(c => new Date(c.dataHora).toDateString() === hoje);
  };

  const obterChamadasClinica = () => {
    const clinicaIdUsuario = getClinicaIdUsuario();
    const ehMaster = isMaster();
    
    if (ehMaster) {
      return chamadas;
    }
    
    return chamadas.filter(c => c.clinicaId === clinicaIdUsuario);
  };

  // ============ DADOS FILTRADOS POR CLÍNICA ============
  // Master vê tudo, outros usuários só veem dados da sua clínica
  const clinicaId = getClinicaIdUsuario();
  const ehMaster = isMaster();

  // Médicos filtrados por clínica
  const medicosFiltrados = ehMaster
    ? medicos.filter(m => m.ativo)
    : medicos.filter(m => m.ativo && m.clinicaId === clinicaId);

  // Pacientes filtrados por clínica
  const pacientesFiltrados = ehMaster
    ? pacientes
    : pacientes.filter(p => p.clinicaId === clinicaId);

  // Fila filtrada por clínica
  const filaFiltrada = ehMaster
    ? filaAtendimento
    : filaAtendimento.filter(a => a.clinicaId === clinicaId);

  // Prontuários filtrados por clínica
  const prontuariosFiltrados = ehMaster
    ? prontuarios
    : prontuarios.filter(p => p.clinicaId === clinicaId);

  const value = {
    // Dados (filtrados por clínica automaticamente)
    clinicas: clinicas.filter(c => c.ativa),
    todasClinicas: clinicas,
    medicos: medicosFiltrados,
    todosMedicos: medicos,
    procedimentos: procedimentos.filter(p => p.ativo),
    todosProcedimentos: procedimentos,
    pacientes: pacientesFiltrados,
    todosPacientes: pacientes, // Para master ver todos
    prontuarios: prontuariosFiltrados,
    todosProntuarios: prontuarios, // Para master ver todos
    filaAtendimento: filaFiltrada,
    todaFilaAtendimento: filaAtendimento, // Para master ver toda

    // Funções de Clínicas (somente master)
    adicionarClinica,
    editarClinica,
    excluirClinica,

    // Funções de Médicos
    adicionarMedico,
    editarMedico,
    excluirMedico,

    // Funções de Procedimentos (somente master)
    adicionarProcedimento,
    editarProcedimento,
    excluirProcedimento,

    // Funções de Pacientes
    buscarPacientePorCPF,
    cadastrarPaciente,
    atualizarPaciente,

    // Funções de Fila
    adicionarNaFila,
    chamarPaciente,
    obterAtendimentoAtual,
    finalizarAtendimento,
    removerDaFila,

    // Funções de Prontuário
    obterProntuarioPaciente,
    obterTodosProntuarios,

    // Funções de Chamadas
    registrarChamada,
    obterChamadasDia,
    obterChamadasClinica,
    chamadaAtual,
    chamadas,

    // Helper
    getClinicaIdUsuario,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
