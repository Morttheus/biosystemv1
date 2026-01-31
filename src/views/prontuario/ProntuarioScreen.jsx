// src/views/prontuario/ProntuarioScreen.jsx
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Layout from '../layout/Layout';
import {
  Search,
  FileText,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Eye,
  Stethoscope,
  History,
  ChevronDown,
  ChevronUp,
  Printer
} from 'lucide-react';

const ProntuarioScreen = () => {
  const {
    pacientes,
    buscarPacientePorCPF,
    obterProntuarioPaciente,
  } = useData();

  const [cpfBusca, setCpfBusca] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [consultaExpandida, setConsultaExpandida] = useState(null);

  const formatarCPF = (valor) => {
    const numeros = valor?.replace(/\D/g, '') || '';
    if (numeros.length <= 11) {
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return valor;
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatarDataHora = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBuscar = async () => {
    if (!cpfBusca) return;
    try {
      const paciente = await buscarPacientePorCPF(cpfBusca);
      if (paciente) {
        setPacienteSelecionado(paciente);
        setConsultaExpandida(null);
      } else {
        // Se não encontrou na API, tenta na lista local
        const cpfLimpo = cpfBusca.replace(/\D/g, '');
        const pacienteLocal = pacientes.find(p => p.cpf?.replace(/\D/g, '') === cpfLimpo);
        setPacienteSelecionado(pacienteLocal || null);
      }
    } catch (err) {
      // Se erro na API, tenta na lista local
      const cpfLimpo = cpfBusca.replace(/\D/g, '');
      const pacienteLocal = pacientes.find(p => p.cpf?.replace(/\D/g, '') === cpfLimpo);
      setPacienteSelecionado(pacienteLocal || null);
    }
  };

  const handleSelecionarPaciente = (paciente) => {
    setPacienteSelecionado(paciente);
    setConsultaExpandida(null);
  };

  const historicoConsultas = pacienteSelecionado
    ? obterProntuarioPaciente(pacienteSelecionado.id)
    : [];

  const handleImprimir = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Busca */}
        <Card title="Buscar Prontuário">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Buscar por CPF"
                value={formatarCPF(cpfBusca)}
                onChange={(e) => setCpfBusca(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="flex items-end">
              <Button icon={Search} onClick={handleBuscar}>
                Buscar
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Pacientes */}
          <div className="lg:col-span-1">
            <Card title="Pacientes Recentes">
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {pacientes.map((paciente) => (
                  <button
                    key={paciente.id}
                    onClick={() => handleSelecionarPaciente(paciente)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      pacienteSelecionado?.id === paciente.id
                        ? 'bg-blue-100 border-blue-500 border'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                        <User size={20} className="text-blue-700" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{paciente.nome}</p>
                        <p className="text-xs text-gray-500">
                          CPF: {formatarCPF(paciente.cpf)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
                {pacientes.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Nenhum paciente cadastrado
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Prontuário do Paciente */}
          <div className="lg:col-span-2">
            {pacienteSelecionado ? (
              <div className="space-y-6">
                {/* Dados do Paciente */}
                <Card
                  title="Prontuário Eletrônico"
                  headerActions={
                    <Button icon={Printer} variant="secondary" size="sm" onClick={handleImprimir}>
                      Imprimir
                    </Button>
                  }
                >
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center">
                        <User size={40} className="text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                              {pacienteSelecionado.nome}
                            </h2>
                            <p className="text-blue-600 font-medium">
                              {pacienteSelecionado.prontuarioId}
                            </p>
                          </div>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            Ativo
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText size={16} />
                            <span className="text-sm">CPF: {formatarCPF(pacienteSelecionado.cpf)}</span>
                          </div>
                          {pacienteSelecionado.dataNascimento && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar size={16} />
                              <span className="text-sm">{formatarData(pacienteSelecionado.dataNascimento)}</span>
                            </div>
                          )}
                          {pacienteSelecionado.telefone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone size={16} />
                              <span className="text-sm">{pacienteSelecionado.telefone}</span>
                            </div>
                          )}
                          {pacienteSelecionado.email && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail size={16} />
                              <span className="text-sm">{pacienteSelecionado.email}</span>
                            </div>
                          )}
                          {pacienteSelecionado.endereco && (
                            <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                              <MapPin size={16} />
                              <span className="text-sm">{pacienteSelecionado.endereco}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          Cadastrado em: {formatarDataHora(pacienteSelecionado.dataCadastro)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Histórico de Consultas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <History size={20} />
                      Histórico de Consultas ({historicoConsultas.length})
                    </h3>

                    {historicoConsultas.length > 0 ? (
                      <div className="space-y-4">
                        {historicoConsultas.map((consulta) => (
                          <div
                            key={consulta.id}
                            className="border border-gray-200 rounded-lg overflow-hidden"
                          >
                            {/* Header da Consulta */}
                            <button
                              onClick={() => setConsultaExpandida(
                                consultaExpandida === consulta.id ? null : consulta.id
                              )}
                              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                  <Stethoscope size={24} className="text-teal-600" />
                                </div>
                                <div className="text-left">
                                  <p className="font-semibold text-gray-800">
                                    {consulta.procedimento}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Dr(a). {consulta.medicoNome} - {formatarDataHora(consulta.data)}
                                  </p>
                                </div>
                              </div>
                              {consultaExpandida === consulta.id ? (
                                <ChevronUp size={24} className="text-gray-500" />
                              ) : (
                                <ChevronDown size={24} className="text-gray-500" />
                              )}
                            </button>

                            {/* Detalhes da Consulta */}
                            {consultaExpandida === consulta.id && (
                              <div className="p-4 bg-white border-t">
                                {/* Diagnóstico */}
                                {consulta.diagnostico && (
                                  <div className="mb-4 p-3 bg-red-50 rounded-lg">
                                    <h4 className="font-semibold text-red-800 mb-1">Diagnóstico</h4>
                                    <p className="text-gray-700">{consulta.diagnostico}</p>
                                  </div>
                                )}

                                {/* Prescrição */}
                                {consulta.prescricao && (
                                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                                    <h4 className="font-semibold text-green-800 mb-1">Prescrição / Conduta</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap">{consulta.prescricao}</p>
                                  </div>
                                )}

                                {/* Anamnese */}
                                {consulta.anamnese && (
                                  <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                      <FileText size={16} /> Anamnese
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      {consulta.anamnese.queixaPrincipal && (
                                        <div className="p-2 bg-gray-50 rounded">
                                          <span className="text-gray-500">Queixa Principal:</span>
                                          <p className="text-gray-800">{consulta.anamnese.queixaPrincipal}</p>
                                        </div>
                                      )}
                                      {consulta.anamnese.historiaDoencaAtual && (
                                        <div className="p-2 bg-gray-50 rounded">
                                          <span className="text-gray-500">História da Doença:</span>
                                          <p className="text-gray-800">{consulta.anamnese.historiaDoencaAtual}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Exame Oftalmológico */}
                                {consulta.anamnese && (consulta.anamnese.oculosOdEsf || consulta.anamnese.pressaoOlhoDireito) && (
                                  <div className="mb-4">
                                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                      <Eye size={16} /> Exame Oftalmológico
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Óculos */}
                                      <div className="p-3 bg-blue-50 rounded-lg">
                                        <h5 className="font-medium text-blue-800 mb-2">Óculos</h5>
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="text-gray-600 font-medium">OD:</span>
                                            <span className="ml-2">ESF: {consulta.anamnese.oculosOdEsf || '-'}</span>
                                            <span className="ml-2">CIL: {consulta.anamnese.oculosOdCil || '-'}</span>
                                            <span className="ml-2">EIXO: {consulta.anamnese.oculosOdEixo || '-'}</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-600 font-medium">OE:</span>
                                            <span className="ml-2">ESF: {consulta.anamnese.oculosOeEsf || '-'}</span>
                                            <span className="ml-2">CIL: {consulta.anamnese.oculosOeCil || '-'}</span>
                                            <span className="ml-2">EIXO: {consulta.anamnese.oculosOeEixo || '-'}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Tonometria */}
                                      <div className="p-3 bg-purple-50 rounded-lg">
                                        <h5 className="font-medium text-purple-800 mb-2">Tonometria</h5>
                                        <div className="text-sm">
                                          <div>
                                            <span className="text-gray-500">OD:</span>
                                            <span className="ml-1">{consulta.anamnese.pressaoOlhoDireito || '-'} mmHg</span>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">OE:</span>
                                            <span className="ml-1">{consulta.anamnese.pressaoOlhoEsquerdo || '-'} mmHg</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Biomicroscopia e Fundoscopia */}
                                    {(consulta.anamnese.biomicroscopiaOD || consulta.anamnese.fundoscopiaOD) && (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        {consulta.anamnese.biomicroscopiaOD && (
                                          <div className="p-3 bg-gray-50 rounded-lg">
                                            <h5 className="font-medium text-gray-700 mb-1">Biomicroscopia OD</h5>
                                            <p className="text-sm">{consulta.anamnese.biomicroscopiaOD}</p>
                                          </div>
                                        )}
                                        {consulta.anamnese.biomicroscopiaOE && (
                                          <div className="p-3 bg-gray-50 rounded-lg">
                                            <h5 className="font-medium text-gray-700 mb-1">Biomicroscopia OE</h5>
                                            <p className="text-sm">{consulta.anamnese.biomicroscopiaOE}</p>
                                          </div>
                                        )}
                                        {consulta.anamnese.fundoscopiaOD && (
                                          <div className="p-3 bg-gray-50 rounded-lg">
                                            <h5 className="font-medium text-gray-700 mb-1">Fundoscopia OD</h5>
                                            <p className="text-sm">{consulta.anamnese.fundoscopiaOD}</p>
                                          </div>
                                        )}
                                        {consulta.anamnese.fundoscopiaOE && (
                                          <div className="p-3 bg-gray-50 rounded-lg">
                                            <h5 className="font-medium text-gray-700 mb-1">Fundoscopia OE</h5>
                                            <p className="text-sm">{consulta.anamnese.fundoscopiaOE}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Observações */}
                                {consulta.observacoes && (
                                  <div className="p-3 bg-yellow-50 rounded-lg">
                                    <h4 className="font-semibold text-yellow-800 mb-1">Observações</h4>
                                    <p className="text-gray-700">{consulta.observacoes}</p>
                                  </div>
                                )}

                                {/* Retorno */}
                                {consulta.retorno && (
                                  <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                                    <Calendar size={16} className="text-blue-600" />
                                    <span className="text-blue-800">
                                      Retorno agendado: {formatarData(consulta.retorno)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                        <FileText size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Nenhuma consulta registrada para este paciente</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <Card>
                <div className="text-center py-16 text-gray-500">
                  <FileText size={64} className="mx-auto mb-4 opacity-30" />
                  <h3 className="text-xl font-semibold mb-2">Selecione um Paciente</h3>
                  <p>Busque por CPF ou selecione um paciente da lista para visualizar o prontuário</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProntuarioScreen;
