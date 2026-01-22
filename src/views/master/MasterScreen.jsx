// src/views/master/MasterScreen.jsx
import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import {
  Users,
  Building2,
  Stethoscope,
  ClipboardList,
  Plus,
  Trash2,
  Edit,
  X,
  Save,
  LogOut,
  FileText,
  UserPlus,
  Shield,
  BarChart3,
  Printer,
  Download,
  TrendingUp,
  DollarSign,
  Clock
} from 'lucide-react';

const MasterScreen = () => {
  const { logout, usuarioLogado, obterTodosUsuarios, adicionarUsuario, editarUsuario, excluirUsuario } = useAuth();
  const {
    clinicas,
    medicos,
    procedimentos,
    pacientes,
    adicionarClinica,
    editarClinica,
    excluirClinica,
    adicionarMedico,
    editarMedico,
    excluirMedico,
    adicionarProcedimento,
    editarProcedimento,
    excluirProcedimento,
    obterProcedimentoComClinicas,
    obterTodosProntuarios,
    todosProntuarios,
    todaFilaAtendimento,
  } = useData();

  const [abaAtiva, setAbaAtiva] = useState('clinicas');
  const [modalAberto, setModalAberto] = useState(null);
  const [itemEditando, setItemEditando] = useState(null);
  const [erro, setErro] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Estados dos formulários
  const [formClinica, setFormClinica] = useState({ nome: '', endereco: '', telefone: '' });
  const [formMedico, setFormMedico] = useState({ nome: '', crm: '', especialidade: '', clinicaId: '' });
  const [formProcedimento, setFormProcedimento] = useState({ nome: '', valor: '', duracao: '', clinicasSelecionadas: [] });
  const [formUsuario, setFormUsuario] = useState({ nome: '', email: '', senha: '', tipo: 'usuario', clinicaId: '', acessoRelatorios: false, telefone: '' });

  // Estados do Relatório
  const [filtroRelatorio, setFiltroRelatorio] = useState({
    periodo: 'diario', // diario, semanal, mensal
    clinicaId: '',
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
  });
  const [relatorioGerado, setRelatorioGerado] = useState(null);

  // Obtém todos os usuários
  const todosUsuarios = obterTodosUsuarios();

  const abas = [
    { id: 'clinicas', label: 'Clínicas', icon: Building2 },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'medicos', label: 'Médicos', icon: Stethoscope },
    { id: 'procedimentos', label: 'Procedimentos', icon: ClipboardList },
    { id: 'pacientes', label: 'Pacientes', icon: Users },
    { id: 'prontuarios', label: 'Prontuários', icon: FileText },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  const tiposUsuario = [
    { value: 'master', label: 'Master' },
    { value: 'admin', label: 'Administrador de Clínica' },
    { value: 'usuario', label: 'Recepcionista' },
    { value: 'medico', label: 'Médico' },
    { value: 'painel', label: 'Painel TV (Sala de Espera)' },
  ];

  // Handlers de Clínicas
  const handleSalvarClinica = async () => {
    if (!formClinica.nome) return alert('Nome é obrigatório');
    try {
      if (itemEditando) {
        await editarClinica(itemEditando.id, formClinica);
      } else {
        const resultado = await adicionarClinica(formClinica);
        if (!resultado.success) {
          toast.error(resultado.error);
          return;
        }
      }
      fecharModal();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar clínica');
    }
  };

  const handleEditarClinica = (clinica) => {
    setItemEditando(clinica);
    setFormClinica({ nome: clinica.nome, endereco: clinica.endereco, telefone: clinica.telefone });
    setModalAberto('clinica');
  };

  // Handlers de Médicos
  const handleSalvarMedico = async () => {
    if (!formMedico.nome || !formMedico.crm) return alert('Nome e CRM são obrigatórios');
    try {
      if (itemEditando) {
        const resultado = await editarMedico(itemEditando.id, { ...formMedico, clinicaId: parseInt(formMedico.clinicaId) });
        if (!resultado.success) {
          toast.error(resultado.error);
          return;
        }
      } else {
        const resultado = await adicionarMedico({ ...formMedico, clinicaId: parseInt(formMedico.clinicaId) });
        if (!resultado.success) {
          toast.error(resultado.error);
          return;
        }
      }
      fecharModal();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar médico');
    }
  };

  const handleEditarMedico = (medico) => {
    setItemEditando(medico);
    setFormMedico({
      nome: medico.nome,
      crm: medico.crm,
      especialidade: medico.especialidade,
      clinicaId: medico.clinicaId.toString()
    });
    setModalAberto('medico');
  };

  // Handlers de Procedimentos
  const handleSalvarProcedimento = async () => {
    if (!formProcedimento.nome || !formProcedimento.valor) return alert('Nome e Valor são obrigatórios');
    if (formProcedimento.clinicasSelecionadas.length === 0) return alert('Selecione pelo menos uma clínica');

    const dados = {
      nome: formProcedimento.nome,
      valor: parseFloat(formProcedimento.valor),
      duracao: parseInt(formProcedimento.duracao) || 30,
      clinicas: formProcedimento.clinicasSelecionadas.map(id => ({ id: parseInt(id) }))
    };

    if (itemEditando) {
      const resultado = await editarProcedimento(itemEditando.id, dados);
      if (!resultado.success) {
        return;
      }
    } else {
      const resultado = await adicionarProcedimento(dados);
      if (!resultado.success) {
        return;
      }
    }
    fecharModal();
  };

  const handleEditarProcedimento = async (proc) => {
    setItemEditando(proc);

    // Busca clínicas vinculadas ao procedimento da API
    let clinicasVinculadas = [];
    try {
      const procComClinicas = await obterProcedimentoComClinicas(proc.id);
      if (procComClinicas && procComClinicas.clinicas) {
        clinicasVinculadas = procComClinicas.clinicas.map(c => c.id?.toString());
      }
    } catch (err) {
      console.error('Erro ao buscar clínicas do procedimento:', err);
    }

    // Se não encontrou clínicas vinculadas, assume todas
    if (clinicasVinculadas.length === 0) {
      clinicasVinculadas = clinicas.map(c => c.id.toString());
    }

    setFormProcedimento({
      nome: proc.nome,
      valor: proc.valor?.toString() || '0',
      duracao: proc.duracao?.toString() || '30',
      clinicasSelecionadas: clinicasVinculadas
    });
    setModalAberto('procedimento');
  };

  const handleToggleClinicaProcedimento = (clinicaId) => {
    setFormProcedimento(prev => {
      const clinicaIdStr = clinicaId.toString();
      const selecionadas = prev.clinicasSelecionadas.includes(clinicaIdStr)
        ? prev.clinicasSelecionadas.filter(id => id !== clinicaIdStr)
        : [...prev.clinicasSelecionadas, clinicaIdStr];
      return { ...prev, clinicasSelecionadas: selecionadas };
    });
  };

  // Handlers de Usuários
  const handleSalvarUsuario = async () => {
    setErro('');

    if (!formUsuario.nome || !formUsuario.email) {
      setErro('Nome e Email são obrigatórios');
      return;
    }

    if (!itemEditando && !formUsuario.senha) {
      setErro('Senha é obrigatória para novos usuários');
      return;
    }

    // Se for criação pelo Master, telefone é obrigatório
    if (!itemEditando && !formUsuario.telefone) {
      setErro('Telefone é obrigatório ao criar um novo usuário pelo Master');
      return;
    }

    // Master ou Admin precisam de clínica, exceto Master
    if (formUsuario.tipo !== 'master' && !formUsuario.clinicaId) {
      setErro('Selecione uma clínica para o usuário');
      return;
    }

    const dados = {
      ...formUsuario,
      clinicaId: formUsuario.tipo === 'master' ? null : parseInt(formUsuario.clinicaId)
    };

    try {
      let resultado;
      if (itemEditando) {
        const dadosEdicao = { ...dados };
        if (!dadosEdicao.senha) delete dadosEdicao.senha;
        resultado = await editarUsuario(itemEditando.id, dadosEdicao);
      } else {
        resultado = await adicionarUsuario(dados);
      }

      if (!resultado.success) {
        setErro(resultado.error);
        return;
      }

      fecharModal();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar usuário');
    }
  };

  const handleEditarUsuario = (usuario) => {
    setItemEditando(usuario);
    setFormUsuario({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      tipo: usuario.tipo,
      clinicaId: usuario.clinicaId?.toString() || '',
      acessoRelatorios: usuario.acessoRelatorios || false,
      telefone: usuario.telefone || ''
    });
    setModalAberto('usuario');
  };

  const handleExcluirUsuario = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este usuário?',
      onConfirm: async () => {
        try {
          const resultado = await excluirUsuario(id);
          if (!resultado.success) {
            toast.error(resultado.error);
          } else {
            toast.success('Usuário excluído com sucesso!');
          }
        } catch (err) {
          toast.error(err.message || 'Erro ao excluir usuário');
        }
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const fecharModal = () => {
    setModalAberto(null);
    setItemEditando(null);
    setErro('');
    setFormClinica({ nome: '', endereco: '', telefone: '' });
    setFormMedico({ nome: '', crm: '', especialidade: '', clinicaId: '' });
    setFormProcedimento({ nome: '', valor: '', duracao: '', clinicasSelecionadas: clinicas.map(c => c.id.toString()) });
    setFormUsuario({ nome: '', email: '', senha: '', tipo: 'usuario', clinicaId: '', acessoRelatorios: false, telefone: '' });
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarCPF = (cpf) => {
    const cpfLimpo = cpf?.replace(/\D/g, '') || '';
    if (cpfLimpo.length !== 11) return cpf;
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getTipoLabel = (tipo) => {
    const tipos = {
      'master': 'Master',
      'admin': 'Administrador',
      'usuario': 'Recepcionista',
      'medico': 'Médico'
    };
    return tipos[tipo] || tipo;
  };

  const getTipoBadgeColor = (tipo) => {
    const cores = {
      'master': 'bg-purple-100 text-purple-800',
      'admin': 'bg-blue-100 text-blue-800',
      'usuario': 'bg-green-100 text-green-800',
      'medico': 'bg-orange-100 text-orange-800'
    };
    return cores[tipo] || 'bg-gray-100 text-gray-800';
  };

  // ============ FUNÇÕES DE RELATÓRIO ============
  const calcularDatasRelatorio = (periodo) => {
    const hoje = new Date();
    let dataInicio = new Date();
    let dataFim = new Date();

    switch (periodo) {
      case 'diario':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
        break;
      case 'semanal':
        const diaSemana = hoje.getDay();
        dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - diaSemana);
        dataInicio.setHours(0, 0, 0, 0);
        dataFim = new Date(dataInicio);
        dataFim.setDate(dataInicio.getDate() + 6);
        dataFim.setHours(23, 59, 59, 999);
        break;
      case 'mensal':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
        break;
      default:
        break;
    }

    return { dataInicio, dataFim };
  };

  const gerarRelatorio = () => {
    const { dataInicio, dataFim } = filtroRelatorio.periodo === 'personalizado'
      ? { dataInicio: new Date(filtroRelatorio.dataInicio), dataFim: new Date(filtroRelatorio.dataFim + 'T23:59:59') }
      : calcularDatasRelatorio(filtroRelatorio.periodo);

    // Filtra atendimentos pelo período e clínica (suporta ambos formatos de campo)
    let atendimentosFiltrados = todaFilaAtendimento.filter(a => {
      // Suporta ambos formatos: horarioChegada ou horario_chegada
      const horarioChegada = a.horarioChegada || a.horario_chegada;
      const dataAtendimento = new Date(horarioChegada);
      const dentroDoPerido = dataAtendimento >= dataInicio && dataAtendimento <= dataFim;
      // Suporta ambos formatos: clinicaId ou clinica_id
      const aClinicaId = a.clinicaId || a.clinica_id;
      const daClinica = !filtroRelatorio.clinicaId || aClinicaId === parseInt(filtroRelatorio.clinicaId);
      return dentroDoPerido && daClinica && a.status === 'atendido';
    });

    // Filtra prontuários pelo período e clínica (suporta ambos formatos de campo)
    let prontuariosFiltrados = todosProntuarios.filter(p => {
      // Suporta ambos formatos: data ou data_consulta
      const dataPront = p.data || p.data_consulta;
      const dataProntuario = new Date(dataPront);
      const dentroDoPerido = dataProntuario >= dataInicio && dataProntuario <= dataFim;
      // Suporta ambos formatos: clinicaId ou clinica_id
      const pClinicaId = p.clinicaId || p.clinica_id;
      const daClinica = !filtroRelatorio.clinicaId || pClinicaId === parseInt(filtroRelatorio.clinicaId);
      return dentroDoPerido && daClinica;
    });

    // Calcula métricas
    const totalAtendimentos = atendimentosFiltrados.length;
    const totalConsultas = prontuariosFiltrados.length;
    // Valor total: soma valores dos atendimentos E dos prontuários (evita duplicação pegando o maior)
    const valorAtendimentos = atendimentosFiltrados.reduce((acc, a) => acc + (parseFloat(a.valor) || 0), 0);
    const valorProntuarios = prontuariosFiltrados.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
    // Usa prontuários se não houver valor nos atendimentos (histórico)
    const valorTotal = valorAtendimentos > 0 ? valorAtendimentos : valorProntuarios;

    // Agrupa por clínica (suporta ambos formatos)
    const porClinica = clinicas.map(clinica => {
      const atendClinica = atendimentosFiltrados.filter(a => {
        const aClinicaId = a.clinicaId || a.clinica_id;
        return aClinicaId === clinica.id;
      });
      const prontClinica = prontuariosFiltrados.filter(p => {
        const pClinicaId = p.clinicaId || p.clinica_id;
        return pClinicaId === clinica.id;
      });
      const valorAtend = atendClinica.reduce((acc, a) => acc + (parseFloat(a.valor) || 0), 0);
      const valorPront = prontClinica.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
      return {
        clinica: clinica.nome,
        clinicaId: clinica.id,
        atendimentos: atendClinica.length,
        consultas: prontClinica.length,
        valor: valorAtend > 0 ? valorAtend : valorPront,
      };
    }).filter(c => c.atendimentos > 0 || c.consultas > 0);

    // Agrupa por procedimento (suporta ambos formatos)
    const porProcedimento = procedimentos.map(proc => {
      const atendProc = atendimentosFiltrados.filter(a => {
        const aProcId = a.procedimentoId || a.procedimento_id;
        return aProcId === proc.id;
      });
      return {
        procedimento: proc.nome,
        quantidade: atendProc.length,
        valorUnitario: parseFloat(proc.valor) || 0,
        valorTotal: atendProc.length * (parseFloat(proc.valor) || 0),
      };
    }).filter(p => p.quantidade > 0);

    // Agrupa por médico (suporta ambos formatos)
    const porMedico = medicos.map(med => {
      const atendMed = atendimentosFiltrados.filter(a => {
        const aMedicoId = a.medicoId || a.medico_id;
        return aMedicoId === med.id;
      });
      const prontMed = prontuariosFiltrados.filter(p => {
        const pMedicoId = p.medicoId || p.medico_id;
        return pMedicoId === med.id;
      });
      const medClinicaId = med.clinicaId || med.clinica_id;
      const valorAtend = atendMed.reduce((acc, a) => acc + (parseFloat(a.valor) || 0), 0);
      const valorPront = prontMed.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
      return {
        medico: med.nome,
        clinica: clinicas.find(c => c.id === medClinicaId)?.nome || '-',
        atendimentos: atendMed.length,
        consultas: prontMed.length,
        valor: valorAtend > 0 ? valorAtend : valorPront,
      };
    }).filter(m => m.atendimentos > 0 || m.consultas > 0);

    // Agrupa por dia (para gráfico) - usa atendimentos ou prontuários
    const porDia = {};
    // Primeiro, agrupa atendimentos
    atendimentosFiltrados.forEach(a => {
      const horarioChegada = a.horarioChegada || a.horario_chegada;
      const dia = new Date(horarioChegada).toLocaleDateString('pt-BR');
      if (!porDia[dia]) {
        porDia[dia] = { atendimentos: 0, consultas: 0, valor: 0 };
      }
      porDia[dia].atendimentos++;
      porDia[dia].valor += parseFloat(a.valor) || 0;
    });
    // Depois, agrupa prontuários (adiciona consultas e valor se não veio de atendimentos)
    prontuariosFiltrados.forEach(p => {
      const dataPront = p.data || p.data_consulta;
      const dia = new Date(dataPront).toLocaleDateString('pt-BR');
      if (!porDia[dia]) {
        porDia[dia] = { atendimentos: 0, consultas: 0, valor: 0 };
      }
      porDia[dia].consultas++;
      // Adiciona valor do prontuário se não havia valor de atendimentos nesse dia
      if (porDia[dia].valor === 0) {
        porDia[dia].valor += parseFloat(p.valor) || 0;
      }
    });

    const relatorio = {
      periodo: filtroRelatorio.periodo,
      dataInicio: dataInicio.toLocaleDateString('pt-BR'),
      dataFim: dataFim.toLocaleDateString('pt-BR'),
      clinicaFiltro: filtroRelatorio.clinicaId
        ? clinicas.find(c => c.id === parseInt(filtroRelatorio.clinicaId))?.nome
        : 'Todas as Clínicas',
      resumo: {
        totalAtendimentos,
        valorTotal,
        totalConsultas,
        // Ticket médio: usa atendimentos se houver, senão usa consultas
        ticketMedio: totalAtendimentos > 0
          ? valorTotal / totalAtendimentos
          : (totalConsultas > 0 ? valorTotal / totalConsultas : 0),
      },
      porClinica,
      porProcedimento,
      porMedico,
      porDia: Object.entries(porDia).map(([dia, dados]) => ({ dia, ...dados })),
      geradoEm: new Date().toLocaleString('pt-BR'),
    };

    setRelatorioGerado(relatorio);
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  const getPeriodoLabel = (periodo) => {
    const labels = {
      'diario': 'Diário',
      'semanal': 'Semanal',
      'mensal': 'Mensal',
      'personalizado': 'Personalizado'
    };
    return labels[periodo] || periodo;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">BioSystem - Painel Master</h1>
                <p className="text-purple-200 text-sm">
                  Bem-vindo, {usuarioLogado?.nome}
                </p>
              </div>
            </div>
            <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="text-center">
            <Building2 className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{clinicas.length}</p>
            <p className="text-gray-500 text-sm">Clínicas</p>
          </Card>
          <Card className="text-center">
            <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{todosUsuarios.length}</p>
            <p className="text-gray-500 text-sm">Usuários</p>
          </Card>
          <Card className="text-center">
            <Stethoscope className="w-8 h-8 mx-auto text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{medicos.length}</p>
            <p className="text-gray-500 text-sm">Médicos</p>
          </Card>
          <Card className="text-center">
            <Users className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-800">{pacientes.length}</p>
            <p className="text-gray-500 text-sm">Pacientes</p>
          </Card>
        </div>

        {/* Abas */}
        <div className="bg-slate-800 rounded-lg p-2 mb-6 flex flex-wrap gap-2 overflow-x-auto">
          {abas.map(aba => {
            const Icon = aba.icon;
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  abaAtiva === aba.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700'
                }`}
              >
                <Icon size={20} />
                {aba.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo das Abas */}
        {abaAtiva === 'clinicas' && (
          <Card
            title="Gerenciar Clínicas"
            headerActions={
              <Button icon={Plus} size="sm" onClick={() => setModalAberto('clinica')}>
                Nova Clínica
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">Endereço</th>
                    <th className="text-left py-3 px-4">Telefone</th>
                    <th className="text-center py-3 px-4">Usuários</th>
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clinicas.map(clinica => {
                    const usuariosClinica = todosUsuarios.filter(u => u.clinicaId === clinica.id);
                    return (
                      <tr key={clinica.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{clinica.nome}</td>
                        <td className="py-3 px-4 text-gray-600">{clinica.endereco}</td>
                        <td className="py-3 px-4 text-gray-600">{clinica.telefone}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                            {usuariosClinica.length}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="secondary" icon={Edit} onClick={() => handleEditarClinica(clinica)}>
                              Editar
                            </Button>
                            <Button size="sm" variant="danger" icon={Trash2} onClick={() => excluirClinica(clinica.id)}>
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {clinicas.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhuma clínica cadastrada</p>
              )}
            </div>
          </Card>
        )}

        {abaAtiva === 'usuarios' && (
          <Card
            title="Gerenciar Usuários do Sistema"
            headerActions={
              <Button icon={UserPlus} size="sm" onClick={() => setModalAberto('usuario')}>
                Novo Usuário
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Tipo</th>
                    <th className="text-left py-3 px-4">Clínica</th>
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {todosUsuarios.map(usuario => (
                    <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{usuario.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{usuario.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-sm ${getTipoBadgeColor(usuario.tipo)}`}>
                          {getTipoLabel(usuario.tipo)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {usuario.tipo === 'master'
                          ? <span className="text-purple-600 font-medium">Todas</span>
                          : clinicas.find(c => c.id === usuario.clinicaId)?.nome || '-'
                        }
                      </td>
                      <td className="py-3 px-4 text-right">
                        {usuario.id !== usuarioLogado.id ? (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={Edit}
                              onClick={() => handleEditarUsuario(usuario)}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              icon={Trash2}
                              onClick={() => handleExcluirUsuario(usuario.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Usuário atual</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {todosUsuarios.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhum usuário cadastrado</p>
              )}
            </div>
          </Card>
        )}

        {abaAtiva === 'medicos' && (
          <Card
            title="Gerenciar Médicos"
            headerActions={
              <Button icon={Plus} size="sm" onClick={() => setModalAberto('medico')}>
                Novo Médico
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">CRM</th>
                    <th className="text-left py-3 px-4">Especialidade</th>
                    <th className="text-left py-3 px-4">Clínica</th>
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {medicos.map(medico => (
                    <tr key={medico.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">Dr(a). {medico.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{medico.crm}</td>
                      <td className="py-3 px-4 text-gray-600">{medico.especialidade}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {clinicas.find(c => c.id === medico.clinicaId)?.nome || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="secondary" icon={Edit} onClick={() => handleEditarMedico(medico)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="danger" icon={Trash2} onClick={() => excluirMedico(medico.id)}>
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {medicos.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhum médico cadastrado</p>
              )}
            </div>
          </Card>
        )}

        {abaAtiva === 'procedimentos' && (
          <Card
            title="Gerenciar Procedimentos"
            headerActions={
              <Button icon={Plus} size="sm" onClick={() => {
                setFormProcedimento({
                  nome: '',
                  valor: '',
                  duracao: '',
                  clinicasSelecionadas: clinicas.map(c => c.id.toString())
                });
                setModalAberto('procedimento');
              }}>
                Novo Procedimento
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">Valor</th>
                    <th className="text-left py-3 px-4">Duração</th>
                    <th className="text-left py-3 px-4">Clínicas</th>
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {procedimentos.map(proc => (
                    <tr key={proc.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{proc.nome}</td>
                      <td className="py-3 px-4 text-green-600 font-medium">
                        R$ {parseFloat(proc.valor || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{proc.duracao || 30} min</td>
                      <td className="py-3 px-4">
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                          {proc.clinicas?.length || clinicas.length} clínica(s)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="secondary" icon={Edit} onClick={() => handleEditarProcedimento(proc)}>
                            Editar
                          </Button>
                          <Button size="sm" variant="danger" icon={Trash2} onClick={() => excluirProcedimento(proc.id)}>
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {procedimentos.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhum procedimento cadastrado</p>
              )}
            </div>
          </Card>
        )}

        {abaAtiva === 'pacientes' && (
          <Card title="Pacientes Cadastrados">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">CPF</th>
                    <th className="text-left py-3 px-4">Telefone</th>
                    <th className="text-left py-3 px-4">Clínica</th>
                    <th className="text-left py-3 px-4">Data Cadastro</th>
                    <th className="text-left py-3 px-4">Prontuário</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map(paciente => {
                    const pacClinicaId = paciente.clinicaId || paciente.clinica_id;
                    const dataCadastro = paciente.dataCadastro || paciente.data_cadastro;
                    const prontuarioId = paciente.prontuarioId || paciente.prontuario_id || '-';
                    return (
                      <tr key={paciente.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{paciente.nome}</td>
                        <td className="py-3 px-4 text-gray-600">{formatarCPF(paciente.cpf)}</td>
                        <td className="py-3 px-4 text-gray-600">{paciente.telefone || '-'}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {clinicas.find(c => c.id === pacClinicaId)?.nome || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{formatarData(dataCadastro)}</td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            {prontuarioId}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {pacientes.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhum paciente cadastrado</p>
              )}
            </div>
          </Card>
        )}

        {abaAtiva === 'prontuarios' && (
          <Card title="Todos os Prontuários">
            <div className="space-y-4">
              {obterTodosProntuarios().map(pront => (
                <div key={pront.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{pront.pacienteNome}</h4>
                      <p className="text-gray-500 text-sm">CPF: {formatarCPF(pront.pacienteCPF)}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      {formatarData(pront.data)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Médico:</span>
                      <span className="ml-2 font-medium">Dr(a). {pront.medicoNome}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Procedimento:</span>
                      <span className="ml-2 font-medium">{pront.procedimento}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Clínica:</span>
                      <span className="ml-2 font-medium">
                        {clinicas.find(c => c.id === (pront.clinicaId || pront.clinica_id))?.nome || '-'}
                      </span>
                    </div>
                    {pront.diagnostico && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500">Diagnóstico:</span>
                        <span className="ml-2">{pront.diagnostico}</span>
                      </div>
                    )}
                    {pront.prescricao && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500">Prescrição:</span>
                        <span className="ml-2">{pront.prescricao}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {obterTodosProntuarios().length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhum prontuário registrado</p>
              )}
            </div>
          </Card>
        )}

        {/* Aba de Relatórios */}
        {abaAtiva === 'relatorios' && (
          <div className="space-y-6">
            {/* Filtros */}
            <Card title="Gerar Relatório" headerActions={
              <div className="flex gap-2">
                {relatorioGerado && (
                  <Button variant="secondary" size="sm" icon={Printer} onClick={imprimirRelatorio}>
                    Imprimir
                  </Button>
                )}
              </div>
            }>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                  <select
                    value={filtroRelatorio.periodo}
                    onChange={(e) => setFiltroRelatorio({ ...filtroRelatorio, periodo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="diario">Diário (Hoje)</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensal">Mensal</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clínica</label>
                  <select
                    value={filtroRelatorio.clinicaId}
                    onChange={(e) => setFiltroRelatorio({ ...filtroRelatorio, clinicaId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Todas as Clínicas</option>
                    {clinicas.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                {filtroRelatorio.periodo === 'personalizado' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                      <input
                        type="date"
                        value={filtroRelatorio.dataInicio}
                        onChange={(e) => setFiltroRelatorio({ ...filtroRelatorio, dataInicio: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                      <input
                        type="date"
                        value={filtroRelatorio.dataFim}
                        onChange={(e) => setFiltroRelatorio({ ...filtroRelatorio, dataFim: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}

                <div className={`flex items-end ${filtroRelatorio.periodo === 'personalizado' ? 'md:col-span-4' : 'md:col-span-2'}`}>
                  <Button icon={BarChart3} onClick={gerarRelatorio} fullWidth>
                    Gerar Relatório
                  </Button>
                </div>
              </div>
            </Card>

            {/* Resultados do Relatório */}
            {relatorioGerado && (
              <div className="space-y-6 print:space-y-4" id="relatorio-print">
                {/* Cabeçalho do Relatório */}
                <Card>
                  <div className="text-center mb-6 print:mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Relatório {getPeriodoLabel(relatorioGerado.periodo)}</h2>
                    <p className="text-gray-600">
                      Período: {relatorioGerado.dataInicio} a {relatorioGerado.dataFim}
                    </p>
                    <p className="text-gray-500 text-sm">{relatorioGerado.clinicaFiltro}</p>
                    <p className="text-gray-400 text-xs mt-2">Gerado em: {relatorioGerado.geradoEm}</p>
                  </div>

                  {/* Cards de Resumo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
                      <Clock className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-2xl font-bold text-blue-800">{relatorioGerado.resumo.totalAtendimentos}</p>
                      <p className="text-blue-600 text-sm">Atendimentos</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
                      <DollarSign className="w-8 h-8 mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold text-green-800">R$ {parseFloat(relatorioGerado.resumo.valorTotal || 0).toFixed(2)}</p>
                      <p className="text-green-600 text-sm">Valor Total</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center">
                      <FileText className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                      <p className="text-2xl font-bold text-purple-800">{relatorioGerado.resumo.totalConsultas}</p>
                      <p className="text-purple-600 text-sm">Consultas</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg text-center">
                      <TrendingUp className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                      <p className="text-2xl font-bold text-orange-800">R$ {parseFloat(relatorioGerado.resumo.ticketMedio || 0).toFixed(2)}</p>
                      <p className="text-orange-600 text-sm">Ticket Médio</p>
                    </div>
                  </div>
                </Card>

                {/* Por Clínica */}
                {relatorioGerado.porClinica.length > 0 && (
                  <Card title="Atendimentos por Clínica">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4">Clínica</th>
                            <th className="text-center py-3 px-4">Atendimentos</th>
                            <th className="text-center py-3 px-4">Consultas</th>
                            <th className="text-right py-3 px-4">Valor Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioGerado.porClinica.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{item.clinica}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                  {item.atendimentos}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                                  {item.consultas}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-green-600 font-medium">
                                R$ {parseFloat(item.valor || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Por Procedimento */}
                {relatorioGerado.porProcedimento.length > 0 && (
                  <Card title="Procedimentos Realizados">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4">Procedimento</th>
                            <th className="text-center py-3 px-4">Quantidade</th>
                            <th className="text-right py-3 px-4">Valor Unit.</th>
                            <th className="text-right py-3 px-4">Valor Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioGerado.porProcedimento.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{item.procedimento}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                  {item.quantidade}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-gray-600">
                                R$ {parseFloat(item.valorUnitario || 0).toFixed(2)}
                              </td>
                              <td className="py-3 px-4 text-right text-green-600 font-medium">
                                R$ {parseFloat(item.valorTotal || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Por Médico */}
                {relatorioGerado.porMedico.length > 0 && (
                  <Card title="Atendimentos por Médico">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4">Médico</th>
                            <th className="text-left py-3 px-4">Clínica</th>
                            <th className="text-center py-3 px-4">Atendimentos</th>
                            <th className="text-center py-3 px-4">Consultas</th>
                            <th className="text-right py-3 px-4">Valor Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioGerado.porMedico.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">Dr(a). {item.medico}</td>
                              <td className="py-3 px-4 text-gray-600">{item.clinica}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                  {item.atendimentos}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                                  {item.consultas}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-green-600 font-medium">
                                R$ {parseFloat(item.valor || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Por Dia */}
                {relatorioGerado.porDia.length > 0 && (
                  <Card title="Atendimentos por Dia">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4">Data</th>
                            <th className="text-center py-3 px-4">Atendimentos</th>
                            <th className="text-right py-3 px-4">Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {relatorioGerado.porDia.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{item.dia}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                  {item.atendimentos}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-green-600 font-medium">
                                R$ {parseFloat(item.valor || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Mensagem quando não há dados */}
                {relatorioGerado.resumo.totalAtendimentos === 0 && relatorioGerado.resumo.totalConsultas === 0 && (
                  <Card>
                    <div className="text-center py-12">
                      <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">Nenhum dado encontrado para o período selecionado</p>
                      <p className="text-gray-400 text-sm mt-2">Tente selecionar outro período ou clínica</p>
                    </div>
                  </Card>
                )}

                {/* Botões de ação */}
                <div className="flex gap-4 justify-center print:hidden">
                  <Button variant="secondary" icon={Download} onClick={() => {
                    const dataStr = JSON.stringify(relatorioGerado, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `relatorio-${relatorioGerado.periodo}-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                  }}>
                    Exportar JSON
                  </Button>
                  <Button icon={Printer} onClick={imprimirRelatorio}>
                    Imprimir Relatório
                  </Button>
                </div>
              </div>
            )}

            {/* Controle de Permissões */}
            <Card title="Controle de Acesso aos Relatórios">
              <p className="text-gray-600 mb-4">
                Defina quais usuários podem acessar os relatórios. Apenas usuários Master têm acesso completo por padrão.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Usuário</th>
                      <th className="text-left py-3 px-4">Tipo</th>
                      <th className="text-left py-3 px-4">Clínica</th>
                      <th className="text-center py-3 px-4">Acesso Relatórios</th>
                      <th className="text-center py-3 px-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todosUsuarios.filter(u => u.tipo !== 'master').map(usuario => (
                      <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{usuario.nome}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-sm ${getTipoBadgeColor(usuario.tipo)}`}>
                            {getTipoLabel(usuario.tipo)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {clinicas.find(c => c.id === usuario.clinicaId)?.nome || '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {usuario.acessoRelatorios ? (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              Liberado
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                              Bloqueado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            size="sm"
                            variant={usuario.acessoRelatorios ? 'danger' : 'success'}
                            onClick={async () => {
                              try {
                                const resultado = await editarUsuario(usuario.id, { acessoRelatorios: !usuario.acessoRelatorios });
                                if (resultado.success) {
                                  toast.success(`Acesso ${usuario.acessoRelatorios ? 'revogado' : 'liberado'} para ${usuario.nome}`);
                                }
                              } catch (err) {
                                toast.error('Erro ao atualizar acesso');
                              }
                            }}
                          >
                            {usuario.acessoRelatorios ? 'Revogar' : 'Liberar'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {todosUsuarios.filter(u => u.tipo !== 'master').length === 0 && (
                  <p className="text-center text-gray-500 py-8">Nenhum usuário cadastrado além do Master</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Clínica */}
      {modalAberto === 'clinica' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {itemEditando ? 'Editar Clínica' : 'Nova Clínica'}
              </h3>
              <button onClick={fecharModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Nome da Clínica"
                value={formClinica.nome}
                onChange={(e) => setFormClinica({ ...formClinica, nome: e.target.value })}
                required
              />
              <Input
                label="Endereço"
                value={formClinica.endereco}
                onChange={(e) => setFormClinica({ ...formClinica, endereco: e.target.value })}
              />
              <Input
                label="Telefone"
                value={formClinica.telefone}
                onChange={(e) => setFormClinica({ ...formClinica, telefone: e.target.value })}
              />
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" fullWidth onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button icon={Save} fullWidth onClick={handleSalvarClinica}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Usuário */}
      {modalAberto === 'usuario' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {itemEditando ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={fecharModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            {erro && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {erro}
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Nome Completo"
                value={formUsuario.nome}
                onChange={(e) => setFormUsuario({ ...formUsuario, nome: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formUsuario.email}
                onChange={(e) => setFormUsuario({ ...formUsuario, email: e.target.value })}
                required
              />
              <Input
                label="Telefone"
                value={formUsuario.telefone}
                onChange={(e) => setFormUsuario({ ...formUsuario, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
                required={!itemEditando}
              />
              <Input
                label={itemEditando ? "Nova Senha (deixe vazio para manter)" : "Senha"}
                type="password"
                value={formUsuario.senha}
                onChange={(e) => setFormUsuario({ ...formUsuario, senha: e.target.value })}
                required={!itemEditando}
              />
              <Select
                label="Tipo de Usuário"
                value={formUsuario.tipo}
                onChange={(e) => setFormUsuario({ ...formUsuario, tipo: e.target.value })}
                options={tiposUsuario}
              />
              {formUsuario.tipo !== 'master' && (
                <Select
                  label="Clínica"
                  value={formUsuario.clinicaId}
                  onChange={(e) => setFormUsuario({ ...formUsuario, clinicaId: e.target.value })}
                  options={clinicas.map(c => ({ value: c.id.toString(), label: c.nome }))}
                  required
                />
              )}

              {formUsuario.tipo === 'master' && (
                <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-700">
                  <strong>Atenção:</strong> Usuários Master têm acesso total a todas as clínicas e funcionalidades do sistema.
                </div>
              )}

              {formUsuario.tipo !== 'master' && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="acessoRelatorios"
                    checked={formUsuario.acessoRelatorios}
                    onChange={(e) => setFormUsuario({ ...formUsuario, acessoRelatorios: e.target.checked })}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="acessoRelatorios" className="text-sm text-gray-700">
                    <span className="font-medium">Acesso aos Relatórios</span>
                    <p className="text-gray-500 text-xs">Permite visualizar e gerar relatórios da sua clínica</p>
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" fullWidth onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button icon={Save} fullWidth onClick={handleSalvarUsuario}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Médico */}
      {modalAberto === 'medico' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {itemEditando ? 'Editar Médico' : 'Novo Médico'}
              </h3>
              <button onClick={fecharModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Nome do Médico"
                value={formMedico.nome}
                onChange={(e) => setFormMedico({ ...formMedico, nome: e.target.value })}
                required
              />
              <Input
                label="CRM"
                value={formMedico.crm}
                onChange={(e) => setFormMedico({ ...formMedico, crm: e.target.value })}
                required
                placeholder="12345-SP"
              />
              <Input
                label="Especialidade"
                value={formMedico.especialidade}
                onChange={(e) => setFormMedico({ ...formMedico, especialidade: e.target.value })}
                placeholder="Ex: Oftalmologia Geral"
              />
              <Select
                label="Clínica"
                value={formMedico.clinicaId}
                onChange={(e) => setFormMedico({ ...formMedico, clinicaId: e.target.value })}
                options={clinicas.map(c => ({ value: c.id.toString(), label: c.nome }))}
                required
              />
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" fullWidth onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button icon={Save} fullWidth onClick={handleSalvarMedico}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Procedimento */}
      {modalAberto === 'procedimento' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {itemEditando ? 'Editar Procedimento' : 'Novo Procedimento'}
              </h3>
              <button onClick={fecharModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Nome do Procedimento"
                value={formProcedimento.nome}
                onChange={(e) => setFormProcedimento({ ...formProcedimento, nome: e.target.value })}
                required
              />
              <Input
                label="Valor (R$)"
                type="number"
                value={formProcedimento.valor}
                onChange={(e) => setFormProcedimento({ ...formProcedimento, valor: e.target.value })}
                required
              />
              <Input
                label="Duração (minutos)"
                type="number"
                value={formProcedimento.duracao}
                onChange={(e) => setFormProcedimento({ ...formProcedimento, duracao: e.target.value })}
              />

              {/* Seleção de Clínicas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clínicas Vinculadas *
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {clinicas.map(clinica => (
                    <label
                      key={clinica.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formProcedimento.clinicasSelecionadas.includes(clinica.id.toString())}
                        onChange={() => handleToggleClinicaProcedimento(clinica.id)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{clinica.nome}</span>
                    </label>
                  ))}
                </div>
                {formProcedimento.clinicasSelecionadas.length === 0 && (
                  <p className="text-red-500 text-xs mt-1">Selecione pelo menos uma clínica</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {formProcedimento.clinicasSelecionadas.length} clínica(s) selecionada(s)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" fullWidth onClick={fecharModal}>
                  Cancelar
                </Button>
                <Button icon={Save} fullWidth onClick={handleSalvarProcedimento}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};

export default MasterScreen;
