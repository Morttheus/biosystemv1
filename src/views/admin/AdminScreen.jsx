// src/views/admin/AdminScreen.jsx
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
  Stethoscope,
  Plus,
  Trash2,
  Edit,
  X,
  Save,
  LogOut,
  Building2,
  UserPlus,
  Shield,
  LayoutDashboard,
  FileText
} from 'lucide-react';
import DashboardScreen from '../dashboard/DashboardScreen';
import RelatoriosScreen from '../relatorios/RelatoriosScreen';

const AdminScreen = () => {
  const { logout, usuarioLogado, obterUsuarios, adicionarUsuario, editarUsuario, excluirUsuario } = useAuth();
  const { clinicas, medicos, adicionarMedico, editarMedico, excluirMedico } = useData();

  const [abaAtiva, setAbaAtiva] = useState('dashboard');
  const [modalAberto, setModalAberto] = useState(null);
  const [itemEditando, setItemEditando] = useState(null);
  const [erro, setErro] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Estados dos formulários
  const [formUsuario, setFormUsuario] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: 'usuario',
    telefone: ''
  });
  const [formMedico, setFormMedico] = useState({
    nome: '',
    crm: '',
    especialidade: ''
  });

  // Obtém a clínica do admin
  const minhaClinica = clinicas.find(c => c.id === usuarioLogado?.clinicaId);

  // Obtém usuários da clínica do admin
  const usuariosDaClinica = obterUsuarios(usuarioLogado?.clinicaId);

  // Obtém médicos da clínica do admin
  const medicosDaClinica = medicos.filter(m => m.clinicaId === usuarioLogado?.clinicaId);

  const abas = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'medicos', label: 'Médicos', icon: Stethoscope },
    { id: 'relatorios', label: 'Relatórios', icon: FileText },
  ];

  const tiposUsuario = [
    { value: 'usuario', label: 'Recepcionista' },
    { value: 'medico', label: 'Médico' },
  ];

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

    const dados = {
      ...formUsuario,
      clinicaId: usuarioLogado.clinicaId // Sempre vincula à clínica do admin
    };

    try {
      let resultado;
      if (itemEditando) {
        // Não envia senha se estiver vazia (não está alterando)
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

  // Handlers de Médicos
  const handleSalvarMedico = async () => {
    if (!formMedico.nome || !formMedico.crm) {
      setErro('Nome e CRM são obrigatórios');
      return;
    }

    try {
      if (itemEditando) {
        const resultado = await editarMedico(itemEditando.id, {
          ...formMedico,
          clinicaId: usuarioLogado.clinicaId
        });
        if (!resultado.success) {
          setErro(resultado.error);
          return;
        }
      } else {
        const resultado = await adicionarMedico({
          ...formMedico,
          clinicaId: usuarioLogado.clinicaId
        });
        if (!resultado.success) {
          setErro(resultado.error);
          return;
        }
      }

      fecharModal();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar médico');
    }
  };

  const handleEditarMedico = (medico) => {
    setItemEditando(medico);
    setFormMedico({
      nome: medico.nome,
      crm: medico.crm,
      especialidade: medico.especialidade
    });
    setModalAberto('medico');
  };

  const fecharModal = () => {
    setModalAberto(null);
    setItemEditando(null);
    setErro('');
    setFormUsuario({ nome: '', email: '', senha: '', tipo: 'usuario' });
    setFormMedico({ nome: '', crm: '', especialidade: '' });
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
      'master': 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300',
      'admin': 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
      'usuario': 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
      'medico': 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300'
    };
    return cores[tipo] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                  <p className="text-blue-200 text-sm">
                    {minhaClinica?.nome || 'Clínica não encontrada'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{usuarioLogado?.nome}</p>
                <p className="text-blue-200 text-sm">Administrador</p>
              </div>
              <Button variant="danger" size="sm" icon={LogOut} onClick={logout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Info da Clínica */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{minhaClinica?.nome}</h2>
              <p className="text-gray-600 dark:text-gray-400">{minhaClinica?.endereco}</p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">{minhaClinica?.telefone}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{usuariosDaClinica.length}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Usuários</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{medicosDaClinica.length}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Médicos</p>
            </div>
          </div>
        </Card>

        {/* Abas */}
        <div className="bg-slate-800 rounded-lg p-2 mb-6 flex flex-wrap gap-2">
          {abas.map(aba => {
            const Icon = aba.icon;
            return (
              <button
                key={aba.id}
                onClick={() => setAbaAtiva(aba.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  abaAtiva === aba.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700'
                }`}
              >
                <Icon size={20} />
                {aba.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo - Dashboard */}
        {abaAtiva === 'dashboard' && (
          <DashboardScreen />
        )}

        {/* Conteúdo - Usuários */}
        {abaAtiva === 'usuarios' && (
          <Card
            title="Gerenciar Usuários da Clínica"
            headerActions={
              <Button icon={UserPlus} size="sm" onClick={() => setModalAberto('usuario')}>
                Novo Usuário
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Nome</th>
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Email</th>
                    <th className="text-left py-3 px-4 text-gray-900 dark:text-gray-100">Tipo</th>
                    <th className="text-right py-3 px-4 text-gray-900 dark:text-gray-100">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosDaClinica.map(usuario => (
                    <tr key={usuario.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{usuario.nome}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{usuario.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-sm ${getTipoBadgeColor(usuario.tipo)}`}>
                          {getTipoLabel(usuario.tipo)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {usuario.tipo !== 'admin' && usuario.tipo !== 'master' ? (
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
                          <span className="text-gray-400 text-sm">Sem permissão</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usuariosDaClinica.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhum usuário cadastrado</p>
              )}
            </div>
          </Card>
        )}

        {/* Conteúdo - Médicos */}
        {abaAtiva === 'medicos' && (
          <Card
            title="Gerenciar Médicos da Clínica"
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
                    <th className="text-right py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {medicosDaClinica.map(medico => (
                    <tr key={medico.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{medico.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{medico.crm}</td>
                      <td className="py-3 px-4 text-gray-600">{medico.especialidade}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={Edit}
                            onClick={() => handleEditarMedico(medico)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            icon={Trash2}
                            onClick={() => excluirMedico(medico.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {medicosDaClinica.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhum médico cadastrado</p>
              )}
            </div>
          </Card>
        )}

        {/* Conteúdo - Relatórios */}
        {abaAtiva === 'relatorios' && (
          <RelatoriosScreen />
        )}
      </div>

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
                disabled={!!itemEditando} // só master pode alterar depois
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

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <strong>Clínica:</strong> {minhaClinica?.nome}
                <br />
                <span className="text-blue-500">O usuário será vinculado automaticamente à sua clínica.</span>
              </div>

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

            {erro && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {erro}
              </div>
            )}

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

              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
                <strong>Clínica:</strong> {minhaClinica?.nome}
              </div>

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

export default AdminScreen;
