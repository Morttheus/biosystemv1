// src/context/DataContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/api';
import { toast } from 'react-toastify';

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

  // Carregar clínicas da API
  const carregarClinicas = async () => {
    try {
      console.log('🔄 [DataContext] Carregando clínicas da API...');
      const lista = await apiService.listarClinicas();
      console.log('✅ [DataContext] Clínicas carregadas:', lista);
      setClinicas(lista);
    } catch (err) {
      console.error('❌ [DataContext] Erro ao carregar clínicas:', err);
      toast.error('Erro ao carregar clínicas');
    }
  };

  // Médicos
  const [medicos, setMedicos] = useState([
    { id: 1, nome: 'Carlos Silva', crm: '12345-SP', especialidade: 'Oftalmologia Geral', clinicaId: 1, ativo: true },
    { id: 2, nome: 'Maria Santos', crm: '54321-SP', especialidade: 'Retina e Vítreo', clinicaId: 1, ativo: true },
    { id: 3, nome: 'João Oliveira', crm: '11111-SP', especialidade: 'Glaucoma', clinicaId: 2, ativo: true },
  ]);

  // Carregar médicos da API
  const carregarMedicos = async () => {
    try {
      // Master carrega todos os médicos, outros usuários só da sua clínica
      const ehUsuarioMaster = usuarioLogado?.tipo === 'master';
      const clinicaId = ehUsuarioMaster ? null : (usuarioLogado?.clinicaId || usuarioLogado?.clinica_id);
      const lista = await apiService.listarMedicos(clinicaId);
      setMedicos(lista);
    } catch (err) {
      console.error('Erro ao carregar médicos:', err);
      toast.error('Erro ao carregar médicos');
    }
  };

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

  // Pacientes (agora vêm da API)
  const [pacientes, setPacientes] = useState([]);
  const [prontuarios, setProntuarios] = useState([]);

  // Carregar pacientes e prontuários
  const carregarPacientes = async () => {
    try {
      // Master carrega todos os pacientes, outros usuários só da sua clínica
      const ehUsuarioMaster = usuarioLogado?.tipo === 'master';
      const clinicaId = ehUsuarioMaster ? null : (usuarioLogado?.clinicaId || usuarioLogado?.clinica_id);
      const lista = await apiService.listarPacientes(clinicaId);
      setPacientes(lista);
    } catch (err) {
      console.error('Erro ao carregar pacientes:', err);
      toast.error('Erro ao carregar pacientes');
    }
  };

  const carregarProntuarios = async () => {
    try {
      // Master carrega todos os prontuários, outros usuários só da sua clínica
      const ehUsuarioMaster = usuarioLogado?.tipo === 'master';
      const clinicaId = ehUsuarioMaster ? null : (usuarioLogado?.clinicaId || usuarioLogado?.clinica_id);
      const lista = await apiService.listarProntuarios(null, clinicaId);
      setProntuarios(lista);
    } catch (err) {
      console.error('Erro ao carregar prontuários:', err);
      toast.error('Erro ao carregar prontuários');
    }
  };

  // Carregar dados ao montar o componente
  useEffect(() => {
    if (usuarioLogado) {
      carregarClinicas();
      carregarPacientes();
      carregarProntuarios();
      carregarFila();
      carregarMedicos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioLogado]);

  // Fila de atendimento
  const [filaAtendimento, setFilaAtendimento] = useState([]);

  // Carregar fila de atendimento
  const carregarFila = async () => {
    try {
      // Master carrega toda a fila, outros usuários só da sua clínica
      const ehUsuarioMaster = usuarioLogado?.tipo === 'master';
      const clinicaId = ehUsuarioMaster ? null : (usuarioLogado?.clinicaId || usuarioLogado?.clinica_id);
      const lista = await apiService.listarFila(clinicaId);
      setFilaAtendimento(lista);
    } catch (err) {
      console.error('Erro ao carregar fila:', err);
    }
  };

  // Chamadas de pacientes (para painel de sala de espera)
  const [chamadas, setChamadas] = useState([]);
  const [chamadaAtual, setChamadaAtual] = useState(null);

  // ============ HELPER - OBTER CLÍNICA DO USUÁRIO ============
  const getClinicaIdUsuario = () => {
    // Backend retorna clinicaId (camelCase) após mapeamento
    return usuarioLogado?.clinicaId || usuarioLogado?.clinica_id || null;
  };

  // ============ FUNÇÕES DE CLÍNICAS ============
  const adicionarClinica = async (clinica) => {
    try {
      // Remove ID se existir (deixar banco gerar)
      const { id, ...dadosClinica } = clinica;
      console.log('📝 [DataContext] Enviando clínica para API:', dadosClinica);
      
      const resultado = await apiService.criarClinica(dadosClinica);
      console.log('📊 [DataContext] Resposta da API:', resultado);
      
      if (resultado.clinica) {
        console.log('✅ [DataContext] Clínica recebida, atualizando estado:', resultado.clinica);
        setClinicas(prev => [...prev, resultado.clinica]);
        toast.success('Clínica adicionada com sucesso!');
        return { success: true, clinica: resultado.clinica };
      }
      
      console.error('❌ [DataContext] Resposta sem clínica:', resultado);
      throw new Error(resultado.error || 'Erro ao adicionar clínica');
    } catch (err) {
      const mensagem = err.message || 'Erro ao adicionar clínica';
      console.error('❌ [DataContext] Erro:', mensagem);
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  const editarClinica = (id, dados) => {
    setClinicas(prev => prev.map(c => c.id === id ? { ...c, ...dados } : c));
  };

  const excluirClinica = (id) => {
    setClinicas(prev => prev.map(c => c.id === id ? { ...c, ativa: false } : c));
  };

  // ============ FUNÇÕES DE MÉDICOS ============
  const adicionarMedico = async (medico) => {
    try {
      // Remove ID se existir (deixar banco gerar)
      const { id, ...dadosMedico } = medico;
      const resultado = await apiService.criarMedico(dadosMedico);
      
      if (resultado.medico) {
        setMedicos(prev => [...prev, resultado.medico]);
        toast.success('Médico adicionado com sucesso!');
        return { success: true, medico: resultado.medico };
      }
      
      throw new Error(resultado.error || 'Erro ao adicionar médico');
    } catch (err) {
      const mensagem = err.message || 'Erro ao adicionar médico';
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  const editarMedico = async (id, dados) => {
    try {
      const resultado = await apiService.atualizarMedico(id, dados);
      
      if (resultado.medico) {
        setMedicos(prev => prev.map(m => m.id === id ? resultado.medico : m));
        toast.success('Médico atualizado com sucesso!');
        return { success: true };
      }
      
      throw new Error(resultado.error || 'Erro ao atualizar médico');
    } catch (err) {
      const mensagem = err.message || 'Erro ao atualizar médico';
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  const excluirMedico = async (id) => {
    try {
      await apiService.deletarMedico(id);
      setMedicos(prev => prev.map(m => m.id === id ? { ...m, ativo: false } : m));
      toast.success('Médico deletado com sucesso!');
      return { success: true };
    } catch (err) {
      const mensagem = err.message || 'Erro ao deletar médico';
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  // ============ FUNÇÕES DE PROCEDIMENTOS ============
  const adicionarProcedimento = (procedimento) => {
    // Gera ID com valor seguro (não usa Date.now() que causa overflow)
    const novoProcedimento = {
      ...procedimento,
      id: Math.floor(Math.random() * 1000000) + 1,
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
  const buscarPacientePorCPF = async (cpf) => {
    try {
      const paciente = await apiService.buscarPacienteCPF(cpf);
      return paciente;
    } catch (err) {
      return null;
    }
  };

  const cadastrarPaciente = async (dadosPaciente) => {
    try {
      const clinicaId = usuarioLogado?.clinicaId || usuarioLogado?.clinica_id;

      if (!clinicaId) {
        throw new Error('Usuário não está associado a uma clínica');
      }

      const resultado = await apiService.criarPaciente({
        ...dadosPaciente,
        clinicaId: clinicaId,
      });

      if (resultado.paciente) {
        setPacientes(prev => [...prev, resultado.paciente]);
        toast.success('Paciente cadastrado com sucesso!');
        return { success: true, paciente: resultado.paciente };
      }

      throw new Error(resultado.error || 'Erro ao cadastrar paciente');
    } catch (err) {
      const mensagem = err.message || 'Erro ao cadastrar paciente';
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  const atualizarPaciente = async (id, dados) => {
    try {
      const resultado = await apiService.atualizarPaciente(id, dados);
      
      if (resultado.paciente) {
        setPacientes(prev => prev.map(p => p.id === id ? resultado.paciente : p));
        toast.success('Paciente atualizado com sucesso!');
      }
      
      return resultado;
    } catch (err) {
      toast.error('Erro ao atualizar paciente');
      throw err;
    }
  };

  // ============ FUNÇÕES DE FILA DE ATENDIMENTO ============
  const adicionarNaFila = async (pacienteId, medicoId, procedimentoId, clinicaIdParam) => {
    try {
      const paciente = pacientes.find(p => p.id === pacienteId);
      const medico = medicos.find(m => m.id === medicoId);
      const procedimento = procedimentos.find(p => p.id === procedimentoId);
      const clinicaId = clinicaIdParam || usuarioLogado?.clinicaId || usuarioLogado?.clinica_id;

      // Obtém o valor do procedimento
      const valor = procedimento?.valor || 0;

      const resultado = await apiService.adicionarFila({
        pacienteId,
        pacienteNome: paciente?.nome,
        medicoId: medicoId || null,
        medicoNome: medico?.nome || null,
        clinicaId,
        procedimentoId: procedimentoId || null,
        valor: valor,
      });

      if (resultado.filaAtendimento) {
        setFilaAtendimento(prev => [...prev, resultado.filaAtendimento]);
        toast.success('Paciente adicionado à fila!');
        return resultado.filaAtendimento;
      }

      throw new Error(resultado.error || 'Erro ao adicionar à fila');
    } catch (err) {
      toast.error(err.message || 'Erro ao adicionar à fila');
      return null;
    }
  };

  const chamarPaciente = async (atendimentoId, medicoId, medicoNome) => {
    try {
      const resultado = await apiService.atualizarFila(atendimentoId, {
        status: 'atendendo',
        medicoId,
        medicoNome,
      });

      if (resultado.filaAtendimento) {
        setFilaAtendimento(prev => prev.map(a =>
          a.id === atendimentoId ? resultado.filaAtendimento : a
        ));
      }

      return resultado;
    } catch (err) {
      toast.error('Erro ao chamar paciente');
      throw err;
    }
  };

  const obterAtendimentoAtual = (medicoId) => {
    return filaAtendimento.find(a => a.medico_id === medicoId && a.status === 'atendendo');
  };

  const finalizarAtendimento = async (atendimentoId, dadosConsulta) => {
    try {
      const atendimento = filaAtendimento.find(a => a.id === atendimentoId);
      if (!atendimento) return null;

      // Obtém IDs corretamente (suporta ambos formatos)
      const pacienteId = atendimento.pacienteId || atendimento.paciente_id;
      const atendMedicoId = atendimento.medicoId || atendimento.medico_id;
      const pacienteNome = atendimento.pacienteNome || atendimento.paciente_nome || '';
      const medicoNome = atendimento.medicoNome || atendimento.medico_nome || '';
      const procedimentoId = atendimento.procedimentoId || atendimento.procedimento_id;
      const valor = atendimento.valor || dadosConsulta?.valor || 0;

      // Cria registro no prontuário via API
      const clinicaId = usuarioLogado?.clinicaId || usuarioLogado?.clinica_id;
      const resultadoProntuario = await apiService.criarProntuario({
        pacienteId: pacienteId,
        medicoId: atendMedicoId,
        clinicaId: clinicaId,
        descricao: JSON.stringify({
          diagnostico: dadosConsulta.diagnostico || '',
          prescricao: dadosConsulta.prescricao || '',
          observacoes: dadosConsulta.observacoes || '',
          retorno: dadosConsulta.retorno || '',
          anamnese: dadosConsulta.anamnese || {},
          pacienteNome: pacienteNome,
          medicoNome: medicoNome,
          procedimento: atendimento.procedimentoNome || atendimento.procedimento_nome || 'Consulta',
          valor: valor,
        }),
      });

      if (resultadoProntuario.prontuario) {
        setProntuarios(prev => [...prev, resultadoProntuario.prontuario]);
      }

      // Atualiza status para 'atendido' ao invés de remover (para relatórios)
      // Inclui o valor na atualização para ter certeza de que será salvo
      await apiService.atualizarFila(atendimentoId, { 
        status: 'atendido',
        valor: valor,
        procedimentoId: procedimentoId
      });
      setFilaAtendimento(prev => prev.map(a =>
        a.id === atendimentoId
          ? { ...a, status: 'atendido', horario_finalizacao: new Date().toISOString(), valor: valor }
          : a
      ));

      toast.success('Atendimento finalizado!');
      return resultadoProntuario.prontuario;
    } catch (err) {
      toast.error('Erro ao finalizar atendimento');
      throw err;
    }
  };

  const removerDaFila = async (atendimentoId) => {
    try {
      await apiService.removerFila(atendimentoId);
      setFilaAtendimento(prev => prev.filter(a => a.id !== atendimentoId));
      toast.success('Paciente removido da fila');
    } catch (err) {
      toast.error('Erro ao remover da fila');
      throw err;
    }
  };

  // ============ FUNÇÕES DE PRONTUÁRIO ============
  // Helper para parsear e enriquecer prontuário
  const parsearProntuario = (p) => {
    // Obtém IDs com suporte a ambos formatos
    const pPacienteId = p.pacienteId || p.paciente_id;
    const pMedicoId = p.medicoId || p.medico_id;
    const pClinicaId = p.clinicaId || p.clinica_id;
    const pData = p.data || p.data_consulta;

    // Parseia descrição JSON
    let dadosDescricao = {};
    if (p.descricao) {
      try {
        dadosDescricao = JSON.parse(p.descricao);
      } catch (e) {
        // Se não for JSON, mantém como string simples
        dadosDescricao = { observacoes: p.descricao };
      }
    }

    // Busca nomes do paciente e médico se não estiverem na descrição
    const paciente = pacientes.find(pac => pac.id === pPacienteId);
    const medico = medicos.find(med => med.id === pMedicoId);

    return {
      ...p,
      id: p.id,
      pacienteId: pPacienteId,
      paciente_id: pPacienteId,
      medicoId: pMedicoId,
      medico_id: pMedicoId,
      clinicaId: pClinicaId,
      clinica_id: pClinicaId,
      data: pData,
      // Dados parseados da descrição
      diagnostico: dadosDescricao.diagnostico || '',
      prescricao: dadosDescricao.prescricao || '',
      observacoes: dadosDescricao.observacoes || '',
      retorno: dadosDescricao.retorno || '',
      anamnese: dadosDescricao.anamnese || {},
      procedimento: dadosDescricao.procedimento || 'Consulta',
      // Nomes (prioriza da descrição, depois busca nas listas)
      pacienteNome: dadosDescricao.pacienteNome || paciente?.nome || 'Paciente',
      pacienteCPF: paciente?.cpf || '',
      medicoNome: dadosDescricao.medicoNome || medico?.nome || 'Médico',
    };
  };

  const obterProntuarioPaciente = (pacienteId) => {
    return prontuarios
      .filter(p => {
        const pPacienteId = p.pacienteId || p.paciente_id;
        return pPacienteId === pacienteId;
      })
      .map(parsearProntuario)
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  };

  const obterTodosProntuarios = () => {
    return prontuarios
      .map(parsearProntuario)
      .sort((a, b) => new Date(b.data) - new Date(a.data));
  };

  const criarProntuario = async (dados) => {
    try {
      const clinicaId = usuarioLogado?.clinicaId || usuarioLogado?.clinica_id;
      const resultado = await apiService.criarProntuario({
        ...dados,
        clinicaId: clinicaId,
      });

      if (resultado.prontuario) {
        setProntuarios(prev => [...prev, resultado.prontuario]);
        toast.success('Prontuário criado com sucesso!');
        return { success: true, prontuario: resultado.prontuario };
      }

      throw new Error(resultado.error || 'Erro ao criar prontuário');
    } catch (err) {
      const mensagem = err.message || 'Erro ao criar prontuário';
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  const atualizarProntuario = async (id, dados) => {
    try {
      const resultado = await apiService.atualizarProntuario(id, dados);
      
      if (resultado.prontuario) {
        setProntuarios(prev => prev.map(p => p.id === id ? resultado.prontuario : p));
        toast.success('Prontuário atualizado com sucesso!');
      }
      
      return resultado;
    } catch (err) {
      toast.error('Erro ao atualizar prontuário');
      throw err;
    }
  };

  const deletarProntuario = async (id) => {
    try {
      const resultado = await apiService.deletarProntuario(id);
      
      if (resultado.message) {
        setProntuarios(prev => prev.filter(p => p.id !== id));
        toast.success('Prontuário deletado com sucesso!');
      }
      
      return resultado;
    } catch (err) {
      toast.error('Erro ao deletar prontuário');
      throw err;
    }
  };

  // ============ FUNÇÕES DE CHAMADAS DE PACIENTES ============
  const registrarChamada = (pacienteId, pacienteNome, medicoId, medicoNome, clinicaId) => {
    // Gera ID com valor seguro (não usa Date.now() que causa overflow)
    const novaChamada = {
      id: Math.floor(Math.random() * 1000000) + 1,
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

    // Salva no localStorage para sincronizar entre abas
    try {
      localStorage.setItem('biosystem_chamada_atual', JSON.stringify(novaChamada));
    } catch (e) {
      console.error('Erro ao salvar chamada no localStorage:', e);
    }

    // Desativa a chamada após 30 segundos
    setTimeout(() => {
      setChamadaAtual(null);
      setChamadas(prev => prev.map(c => c.id === novaChamada.id ? { ...c, ativa: false } : c));
      // Remove do localStorage
      try {
        localStorage.removeItem('biosystem_chamada_atual');
      } catch (e) {
        console.error('Erro ao remover chamada do localStorage:', e);
      }
    }, 30000); // 30 segundos

    return novaChamada;
  };

  // Escuta mudanças no localStorage para sincronizar chamadas entre abas
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'biosystem_chamada_atual') {
        if (event.newValue) {
          try {
            const novaChamada = JSON.parse(event.newValue);
            setChamadaAtual(novaChamada);
            setChamadas(prev => {
              // Adiciona se não existir
              if (!prev.find(c => c.id === novaChamada.id)) {
                return [novaChamada, ...prev];
              }
              return prev;
            });
          } catch (e) {
            console.error('Erro ao processar chamada do localStorage:', e);
          }
        } else {
          // Chamada foi removida/expirada
          setChamadaAtual(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verifica se há uma chamada ativa ao carregar
    try {
      const chamadaSalva = localStorage.getItem('biosystem_chamada_atual');
      if (chamadaSalva) {
        const chamada = JSON.parse(chamadaSalva);
        // Verifica se a chamada ainda é válida (menos de 30 segundos)
        const agora = new Date();
        const dataChamada = new Date(chamada.dataHora);
        const diffSegundos = (agora - dataChamada) / 1000;

        if (diffSegundos < 30) {
          setChamadaAtual(chamada);
          setChamadas(prev => {
            if (!prev.find(c => c.id === chamada.id)) {
              return [chamada, ...prev];
            }
            return prev;
          });
        } else {
          // Remove chamada expirada
          localStorage.removeItem('biosystem_chamada_atual');
        }
      }
    } catch (e) {
      console.error('Erro ao carregar chamada do localStorage:', e);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
  const clinicaIdUsuario = getClinicaIdUsuario();
  const ehMaster = isMaster();

  // Helper para comparar clinicaId (suporta ambos formatos)
  const matchClinica = (item) => {
    const itemClinicaId = item.clinicaId || item.clinica_id;
    return itemClinicaId === clinicaIdUsuario;
  };

  // Médicos filtrados por clínica
  const medicosFiltrados = ehMaster
    ? medicos.filter(m => m.ativo !== false)
    : medicos.filter(m => m.ativo !== false && matchClinica(m));

  // Pacientes filtrados por clínica
  const pacientesFiltrados = ehMaster
    ? pacientes
    : pacientes.filter(p => matchClinica(p));

  // Fila filtrada por clínica
  const filaFiltrada = ehMaster
    ? filaAtendimento
    : filaAtendimento.filter(a => matchClinica(a));

  // Prontuários filtrados por clínica
  const prontuariosFiltrados = ehMaster
    ? prontuarios
    : prontuarios.filter(p => matchClinica(p));

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
    criarProntuario,
    atualizarProntuario,
    deletarProntuario,

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
