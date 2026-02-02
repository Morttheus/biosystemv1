// src/views/recepcao/RecepcaoScreen.jsx
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Select from '../../components/Select';
import Layout from '../layout/Layout';
import {
  Search,
  UserPlus,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  FileText,
  Loader2
} from 'lucide-react';

const RecepcaoScreen = () => {
  const { usuarioLogado } = useAuth();
  const {
    medicos,
    procedimentos,
    clinicas,
    pacientes,
    filaAtendimento,
    buscarPacientePorCPF,
    cadastrarPaciente,
    adicionarNaFila,
    atualizarFila,
  } = useData();

  // Polling para atualizar a fila em tempo real (a cada 5 segundos)
  useEffect(() => {
    const intervalo = setInterval(() => {
      atualizarFila();
    }, 5000);

    return () => clearInterval(intervalo);
  }, [atualizarFila]);

  const [abaAtiva, setAbaAtiva] = useState('cadastro');
  const [cpfBusca, setCpfBusca] = useState('');
  const [pacienteEncontrado, setPacienteEncontrado] = useState(null);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [carregando, setCarregando] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    endereco: '',
    convenio: '',
    medicoId: '',
    procedimentoId: '',
  });

  // Clínica do usuário logado (suporta ambos formatos)
  const clinicaId = usuarioLogado?.clinicaId || usuarioLogado?.clinica_id;
  const clinicaAtual = clinicas.find(c => c.id === clinicaId);

  // Médicos da clínica (suporta ambos formatos de campo)
  const medicosClinica = medicos.filter(m => {
    const medicoClinicaId = m.clinicaId || m.clinica_id;
    return medicoClinicaId === clinicaId;
  });

  // Fila da clínica (suporta ambos formatos de campo e status)
  const filaClinica = filaAtendimento.filter(a => {
    const atendClinicaId = a.clinicaId || a.clinica_id;
    return atendClinicaId === clinicaId && a.status !== 'atendido';
  });

  const formatarCPF = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return valor;
  };

  const formatarTelefone = (valor) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
      if (numeros.length > 6) {
        return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
      } else if (numeros.length > 2) {
        return numeros.replace(/(\d{2})(\d{0,5})/, '($1) $2');
      }
      return numeros;
    }
    return valor;
  };

  const handleBuscarCPF = async () => {
    if (!cpfBusca) return;

    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      // Remove formatação do CPF para busca
      const cpfLimpo = cpfBusca.replace(/\D/g, '');
      const paciente = await buscarPacientePorCPF(cpfLimpo);

      if (paciente) {
        setPacienteEncontrado(paciente);
        setMensagem({ tipo: 'sucesso', texto: 'Paciente encontrado!' });
        // Preenche o formulário com os dados do paciente
        setForm({
          ...form,
          nome: paciente.nome,
          cpf: paciente.cpf,
          dataNascimento: paciente.dataNascimento || '',
          telefone: paciente.telefone || '',
          email: paciente.email || '',
          endereco: paciente.endereco || '',
          convenio: paciente.convenio || '',
        });
      } else {
        setPacienteEncontrado(null);
        // Preenche o CPF no formulário para facilitar o cadastro
        setForm({
          ...form,
          cpf: cpfLimpo,
        });
        setMensagem({ tipo: 'info', texto: 'Paciente não encontrado. Preencha os dados para cadastrar.' });
      }
    } catch (err) {
      setPacienteEncontrado(null);
      // Preenche o CPF no formulário para facilitar o cadastro
      setForm({
        ...form,
        cpf: cpfBusca.replace(/\D/g, ''),
      });
      setMensagem({ tipo: 'info', texto: 'Paciente não encontrado. Preencha os dados para cadastrar.' });
    } finally {
      setCarregando(false);
    }
  };

  const handleCadastrar = async () => {
    if (!form.nome) {
      setMensagem({ tipo: 'erro', texto: 'Nome completo é obrigatório!' });
      return;
    }
    if (!form.cpf) {
      setMensagem({ tipo: 'erro', texto: 'CPF é obrigatório!' });
      return;
    }
    if (!form.dataNascimento) {
      setMensagem({ tipo: 'erro', texto: 'Data de nascimento é obrigatória!' });
      return;
    }

    if (!clinicaId) {
      setMensagem({ tipo: 'erro', texto: 'Usuário não está associado a uma clínica!' });
      return;
    }

    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const resultado = await cadastrarPaciente({
        nome: form.nome,
        cpf: form.cpf.replace(/\D/g, ''), // Remove formatação
        dataNascimento: form.dataNascimento,
        telefone: form.telefone.replace(/\D/g, ''), // Remove formatação
        email: form.email,
        endereco: form.endereco,
        convenio: form.convenio,
      });

      if (resultado.success) {
        setPacienteEncontrado(resultado.paciente);
        setMensagem({ tipo: 'sucesso', texto: `Paciente cadastrado com sucesso!` });
      } else {
        setMensagem({ tipo: 'aviso', texto: resultado.error });
      }
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao cadastrar paciente' });
    } finally {
      setCarregando(false);
    }
  };

  const handleAdicionarFila = async () => {
    if (!pacienteEncontrado) {
      setMensagem({ tipo: 'erro', texto: 'Busque ou cadastre um paciente primeiro!' });
      return;
    }
    if (!form.medicoId) {
      setMensagem({ tipo: 'erro', texto: 'Selecione o médico!' });
      return;
    }
    if (!clinicaId) {
      setMensagem({ tipo: 'erro', texto: 'Usuário não está associado a uma clínica!' });
      return;
    }

    setCarregando(true);
    setMensagem({ tipo: '', texto: '' });

    try {
      const atendimento = await adicionarNaFila(
        pacienteEncontrado.id,
        parseInt(form.medicoId),
        form.procedimentoId ? parseInt(form.procedimentoId) : null,
        clinicaId
      );

      if (atendimento) {
        setMensagem({ tipo: 'sucesso', texto: 'Paciente adicionado à fila de atendimento!' });
        // Limpa o formulário
        setForm({
          nome: '',
          cpf: '',
          dataNascimento: '',
          telefone: '',
          email: '',
          endereco: '',
          convenio: '',
          medicoId: '',
          procedimentoId: '',
        });
        setPacienteEncontrado(null);
        setCpfBusca('');
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao adicionar à fila. Tente novamente.' });
      }
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao adicionar à fila' });
    } finally {
      setCarregando(false);
    }
  };

  const formatarHora = (data) => {
    return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Info da Clínica */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>Clínica:</strong> {clinicaAtual?.nome || 'Não definida'}
          </p>
        </div>

        {/* Abas */}
        <div className="bg-white rounded-lg p-2 shadow flex flex-wrap gap-2">
          <button
            onClick={() => setAbaAtiva('cadastro')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              abaAtiva === 'cadastro' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <UserPlus size={20} />
            Cadastro / Atendimento
          </button>
          <button
            onClick={() => setAbaAtiva('fila')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              abaAtiva === 'fila' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Users size={20} />
            Fila de Espera ({filaClinica.length})
          </button>
          <button
            onClick={() => setAbaAtiva('pacientes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              abaAtiva === 'pacientes' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <FileText size={20} />
            Todos Pacientes
          </button>
        </div>

        {/* Mensagem */}
        {mensagem.texto && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' :
            mensagem.tipo === 'erro' ? 'bg-red-100 text-red-800' :
            mensagem.tipo === 'aviso' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {mensagem.tipo === 'sucesso' ? <CheckCircle size={20} /> :
             mensagem.tipo === 'erro' ? <AlertCircle size={20} /> :
             <AlertCircle size={20} />}
            {mensagem.texto}
            <button
              onClick={() => setMensagem({ tipo: '', texto: '' })}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
        )}

        {/* Aba Cadastro */}
        {abaAtiva === 'cadastro' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Busca por CPF */}
            <Card title="Buscar Paciente por CPF" subtitle="Consulte antes de cadastrar para evitar duplicatas">
              <div className="flex gap-3">
                <Input
                  label="CPF"
                  value={formatarCPF(cpfBusca)}
                  onChange={(e) => setCpfBusca(e.target.value)}
                  placeholder="000.000.000-00"
                  className="flex-1"
                />
                <div className="flex items-end">
                  <Button icon={carregando ? Loader2 : Search} onClick={handleBuscarCPF} disabled={carregando}>
                    {carregando ? 'Buscando...' : 'Buscar'}
                  </Button>
                </div>
              </div>

              {pacienteEncontrado && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Paciente Encontrado</h4>
                  <p><strong>Nome:</strong> {pacienteEncontrado.nome}</p>
                  <p><strong>ID:</strong> {pacienteEncontrado.id}</p>
                  <p><strong>Telefone:</strong> {pacienteEncontrado.telefone || '-'}</p>
                </div>
              )}
            </Card>

            {/* Formulário de Cadastro */}
            <Card title="Dados do Paciente">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome Completo"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                    disabled={!!pacienteEncontrado}
                  />
                  <Input
                    label="CPF"
                    value={formatarCPF(form.cpf)}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                    required
                    disabled={!!pacienteEncontrado}
                  />
                  <Input
                    label="Data de Nascimento"
                    type="date"
                    value={form.dataNascimento}
                    onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                    required
                    disabled={!!pacienteEncontrado}
                  />
                  <Input
                    label="Telefone"
                    value={formatarTelefone(form.telefone)}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    disabled={!!pacienteEncontrado}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={!!pacienteEncontrado}
                  />
                  <Input
                    label="Convênio"
                    value={form.convenio}
                    onChange={(e) => setForm({ ...form, convenio: e.target.value })}
                    placeholder="Particular ou nome do convênio"
                    disabled={!!pacienteEncontrado}
                  />
                </div>
                <Input
                  label="Endereço"
                  value={form.endereco}
                  onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  disabled={!!pacienteEncontrado}
                />

                {!pacienteEncontrado && (
                  <Button icon={carregando ? Loader2 : UserPlus} fullWidth onClick={handleCadastrar} disabled={carregando}>
                    {carregando ? 'Cadastrando...' : 'Cadastrar Paciente'}
                  </Button>
                )}
              </div>
            </Card>

            {/* Adicionar à Fila */}
            <Card title="Adicionar à Fila de Atendimento" className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Médico"
                  value={form.medicoId}
                  onChange={(e) => setForm({ ...form, medicoId: e.target.value })}
                  options={medicosClinica.map(m => ({ value: m.id.toString(), label: `Dr(a). ${m.nome}` }))}
                  required
                />
                <Select
                  label="Procedimento"
                  value={form.procedimentoId}
                  onChange={(e) => setForm({ ...form, procedimentoId: e.target.value })}
                  options={procedimentos.map(p => ({
                    value: p.id.toString(),
                    label: `${p.nome} - R$ ${parseFloat(p.valor || 0).toFixed(2)}`
                  }))}
                  required
                />
                <div className="flex items-end">
                  <Button
                    icon={carregando ? Loader2 : Clock}
                    fullWidth
                    variant="success"
                    onClick={handleAdicionarFila}
                    disabled={!pacienteEncontrado || carregando}
                  >
                    {carregando ? 'Adicionando...' : 'Adicionar à Fila'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Aba Fila de Espera */}
        {abaAtiva === 'fila' && (
          <Card title="Fila de Atendimento">
            <div className="space-y-3">
              {filaClinica.map((atendimento, index) => {
                // Suporta ambos os formatos de campo (camelCase e snake_case)
                const pacienteNome = atendimento.pacienteNome || atendimento.paciente_nome;
                const medicoNome = atendimento.medicoNome || atendimento.medico_nome;
                const status = atendimento.status;
                const horarioChegada = atendimento.horarioChegada || atendimento.horario_chegada;

                return (
                <div
                  key={atendimento.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    status === 'atendendo'
                      ? 'bg-green-50 border-green-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      status === 'atendendo'
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-semibold">{pacienteNome}</h4>
                      <p className="text-sm text-gray-500">
                        {medicoNome ? `Dr(a). ${medicoNome}` : 'Médico não atribuído'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      status === 'atendendo'
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {status === 'atendendo' ? 'Em Atendimento' : 'Aguardando'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Chegou: {formatarHora(horarioChegada)}
                    </p>
                  </div>
                </div>
              );
              })}
              {filaClinica.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhum paciente na fila de espera</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Aba Todos Pacientes */}
        {abaAtiva === 'pacientes' && (
          <Card title="Pacientes Cadastrados">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Nome</th>
                    <th className="text-left py-3 px-4">CPF</th>
                    <th className="text-left py-3 px-4">Telefone</th>
                    <th className="text-left py-3 px-4">Prontuário</th>
                    <th className="text-left py-3 px-4">Consultas</th>
                  </tr>
                </thead>
                <tbody>
                  {pacientes.map(paciente => (
                    <tr key={paciente.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{paciente.nome}</td>
                      <td className="py-3 px-4 text-gray-600">{formatarCPF(paciente.cpf)}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {paciente.telefone ? (
                          <span className="flex items-center gap-1">
                            <Phone size={14} />
                            {paciente.telefone}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {paciente.prontuarioId}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                          {paciente.historicoConsultas?.length || 0} consulta(s)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pacientes.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhum paciente cadastrado</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RecepcaoScreen;
