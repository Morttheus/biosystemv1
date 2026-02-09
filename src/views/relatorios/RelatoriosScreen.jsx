// src/views/relatorios/RelatoriosScreen.jsx
import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Select from '../../components/Select';
import {
  FileText,
  Download,
  Calendar,
  Users,
  Stethoscope,
  TrendingUp,
  Filter,
  Printer,
  FileSpreadsheet
} from 'lucide-react';

const RelatoriosScreen = () => {
  const { usuarioLogado } = useAuth();
  const { pacientes, medicos, filaAtendimento, clinicas } = useData();

  const clinicaId = usuarioLogado?.clinicaId || usuarioLogado?.clinica_id;
  const isMaster = usuarioLogado?.tipo === 'master';
  const clinicaAtual = clinicas.find(c => c.id === clinicaId);

  // Filtros
  const [tipoRelatorio, setTipoRelatorio] = useState('atendimentos');
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [medicoFiltro, setMedicoFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');

  // Médicos da clínica
  const medicosClinica = isMaster
    ? medicos
    : medicos.filter(m => (m.clinicaId || m.clinica_id) === clinicaId);

  // Dados filtrados
  const dadosFiltrados = useMemo(() => {
    let dados = [];

    if (tipoRelatorio === 'atendimentos') {
      dados = filaAtendimento.filter(a => {
        const atendClinicaId = a.clinicaId || a.clinica_id;
        const dataAtend = a.horarioChegada || a.horario_chegada;
        const atendMedicoId = a.medicoId || a.medico_id;

        // Filtro de clínica
        if (!isMaster && atendClinicaId !== clinicaId) return false;

        // Filtro de data
        if (dataAtend) {
          const data = new Date(dataAtend).toISOString().split('T')[0];
          if (data < dataInicio || data > dataFim) return false;
        }

        // Filtro de médico
        if (medicoFiltro && atendMedicoId !== parseInt(medicoFiltro)) return false;

        // Filtro de status
        if (statusFiltro && a.status !== statusFiltro) return false;

        return true;
      });
    } else if (tipoRelatorio === 'pacientes') {
      dados = pacientes.filter(p => {
        const pacClinicaId = p.clinicaId || p.clinica_id;
        if (!isMaster && pacClinicaId !== clinicaId) return false;

        // Filtro de data de cadastro (se disponível)
        if (p.dataCadastro) {
          const data = new Date(p.dataCadastro).toISOString().split('T')[0];
          if (data < dataInicio || data > dataFim) return false;
        }

        return true;
      });
    }

    return dados;
  }, [tipoRelatorio, filaAtendimento, pacientes, dataInicio, dataFim, medicoFiltro, statusFiltro, clinicaId, isMaster]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    if (tipoRelatorio === 'atendimentos') {
      const total = dadosFiltrados.length;
      const atendidos = dadosFiltrados.filter(a => a.status === 'atendido').length;
      const aguardando = dadosFiltrados.filter(a => a.status === 'aguardando').length;
      const emAtendimento = dadosFiltrados.filter(a => a.status === 'atendendo').length;

      // Atendimentos por médico
      const porMedico = {};
      dadosFiltrados.forEach(a => {
        const medicoNome = a.medicoNome || a.medico_nome || 'Não informado';
        porMedico[medicoNome] = (porMedico[medicoNome] || 0) + 1;
      });

      return { total, atendidos, aguardando, emAtendimento, porMedico };
    } else {
      return {
        total: dadosFiltrados.length,
        comTelefone: dadosFiltrados.filter(p => p.telefone).length,
        comEmail: dadosFiltrados.filter(p => p.email).length
      };
    }
  }, [dadosFiltrados, tipoRelatorio]);

  // Exportar para CSV (Excel)
  const exportarCSV = () => {
    let csv = '';
    let filename = '';

    if (tipoRelatorio === 'atendimentos') {
      csv = 'Data,Hora,Paciente,Médico,Procedimento,Status\n';
      dadosFiltrados.forEach(a => {
        const data = a.horarioChegada || a.horario_chegada;
        const dataFormatada = data ? new Date(data).toLocaleDateString('pt-BR') : '';
        const horaFormatada = data ? new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
        const paciente = (a.pacienteNome || a.paciente_nome || '').replace(/,/g, ' ');
        const medico = (a.medicoNome || a.medico_nome || '').replace(/,/g, ' ');
        const procedimento = (a.procedimentoNome || a.procedimento_nome || '').replace(/,/g, ' ');
        csv += `${dataFormatada},${horaFormatada},${paciente},${medico},${procedimento},${a.status}\n`;
      });
      filename = `relatorio_atendimentos_${dataInicio}_${dataFim}.csv`;
    } else {
      csv = 'Nome,CPF,Telefone,Email,Data Nascimento,Convênio\n';
      dadosFiltrados.forEach(p => {
        const nome = (p.nome || '').replace(/,/g, ' ');
        const dataNasc = p.dataNascimento ? new Date(p.dataNascimento).toLocaleDateString('pt-BR') : '';
        csv += `${nome},${p.cpf || ''},${p.telefone || ''},${p.email || ''},${dataNasc},${p.convenio || ''}\n`;
      });
      filename = `relatorio_pacientes_${dataInicio}_${dataFim}.csv`;
    }

    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  // Imprimir relatório (PDF via impressão do navegador)
  const imprimirRelatorio = () => {
    const printWindow = window.open('', '_blank');

    let conteudo = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório - ${tipoRelatorio === 'atendimentos' ? 'Atendimentos' : 'Pacientes'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; margin-bottom: 5px; }
          .info { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1e40af; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .stats { display: flex; gap: 20px; margin-bottom: 20px; }
          .stat-card { background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
          .stat-label { font-size: 12px; color: #666; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>Relatório de ${tipoRelatorio === 'atendimentos' ? 'Atendimentos' : 'Pacientes'}</h1>
        <p class="info">
          ${clinicaAtual?.nome || 'Sistema BioSystem'}<br>
          Período: ${new Date(dataInicio).toLocaleDateString('pt-BR')} a ${new Date(dataFim).toLocaleDateString('pt-BR')}<br>
          Gerado em: ${new Date().toLocaleString('pt-BR')}
        </p>

        <div class="stats">
    `;

    if (tipoRelatorio === 'atendimentos') {
      conteudo += `
          <div class="stat-card">
            <div class="stat-value">${estatisticas.total}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${estatisticas.atendidos}</div>
            <div class="stat-label">Atendidos</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${estatisticas.aguardando}</div>
            <div class="stat-label">Aguardando</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Hora</th>
              <th>Paciente</th>
              <th>Médico</th>
              <th>Procedimento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
      `;

      dadosFiltrados.forEach(a => {
        const data = a.horarioChegada || a.horario_chegada;
        const dataFormatada = data ? new Date(data).toLocaleDateString('pt-BR') : '-';
        const horaFormatada = data ? new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';

        conteudo += `
          <tr>
            <td>${dataFormatada}</td>
            <td>${horaFormatada}</td>
            <td>${a.pacienteNome || a.paciente_nome || '-'}</td>
            <td>${a.medicoNome || a.medico_nome || '-'}</td>
            <td>${a.procedimentoNome || a.procedimento_nome || '-'}</td>
            <td>${a.status}</td>
          </tr>
        `;
      });
    } else {
      conteudo += `
          <div class="stat-card">
            <div class="stat-value">${estatisticas.total}</div>
            <div class="stat-label">Total de Pacientes</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${estatisticas.comTelefone}</div>
            <div class="stat-label">Com Telefone</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${estatisticas.comEmail}</div>
            <div class="stat-label">Com Email</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Email</th>
              <th>Data Nasc.</th>
              <th>Convênio</th>
            </tr>
          </thead>
          <tbody>
      `;

      dadosFiltrados.forEach(p => {
        conteudo += `
          <tr>
            <td>${p.nome || '-'}</td>
            <td>${p.cpf || '-'}</td>
            <td>${p.telefone || '-'}</td>
            <td>${p.email || '-'}</td>
            <td>${p.dataNascimento ? new Date(p.dataNascimento).toLocaleDateString('pt-BR') : '-'}</td>
            <td>${p.convenio || '-'}</td>
          </tr>
        `;
      });
    }

    conteudo += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(conteudo);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card title="Gerar Relatório" subtitle="Selecione os filtros para gerar o relatório">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Select
            label="Tipo de Relatório"
            value={tipoRelatorio}
            onChange={(e) => setTipoRelatorio(e.target.value)}
            options={[
              { value: 'atendimentos', label: 'Atendimentos' },
              { value: 'pacientes', label: 'Pacientes' }
            ]}
          />
          <Input
            label="Data Início"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
          <Input
            label="Data Fim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
          {tipoRelatorio === 'atendimentos' && (
            <>
              <Select
                label="Médico"
                value={medicoFiltro}
                onChange={(e) => setMedicoFiltro(e.target.value)}
                options={[
                  { value: '', label: 'Todos' },
                  ...medicosClinica.map(m => ({ value: m.id.toString(), label: m.nome }))
                ]}
              />
              <Select
                label="Status"
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                options={[
                  { value: '', label: 'Todos' },
                  { value: 'aguardando', label: 'Aguardando' },
                  { value: 'atendendo', label: 'Em Atendimento' },
                  { value: 'atendido', label: 'Atendido' }
                ]}
              />
            </>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button icon={Printer} onClick={imprimirRelatorio}>
            Imprimir / PDF
          </Button>
          <Button icon={FileSpreadsheet} variant="success" onClick={exportarCSV}>
            Exportar Excel (CSV)
          </Button>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {tipoRelatorio === 'atendimentos' ? (
          <>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <div className="text-center">
                <p className="text-blue-100 text-sm">Total de Registros</p>
                <p className="text-4xl font-bold">{estatisticas.total}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <div className="text-center">
                <p className="text-green-100 text-sm">Atendidos</p>
                <p className="text-4xl font-bold">{estatisticas.atendidos}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <div className="text-center">
                <p className="text-orange-100 text-sm">Aguardando</p>
                <p className="text-4xl font-bold">{estatisticas.aguardando}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <div className="text-center">
                <p className="text-purple-100 text-sm">Em Atendimento</p>
                <p className="text-4xl font-bold">{estatisticas.emAtendimento}</p>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <div className="text-center">
                <p className="text-blue-100 text-sm">Total de Pacientes</p>
                <p className="text-4xl font-bold">{estatisticas.total}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <div className="text-center">
                <p className="text-green-100 text-sm">Com Telefone</p>
                <p className="text-4xl font-bold">{estatisticas.comTelefone}</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
              <div className="text-center">
                <p className="text-teal-100 text-sm">Com Email</p>
                <p className="text-4xl font-bold">{estatisticas.comEmail}</p>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Prévia dos Dados */}
      <Card
        title={`Prévia do Relatório (${dadosFiltrados.length} registros)`}
        subtitle="Mostrando os primeiros 50 registros"
      >
        <div className="overflow-x-auto">
          {tipoRelatorio === 'atendimentos' ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Data</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Hora</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Paciente</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Médico</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.slice(0, 50).map((a, index) => {
                  const data = a.horarioChegada || a.horario_chegada;
                  return (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                        {data ? new Date(data).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {data ? new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        {a.pacienteNome || a.paciente_nome || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {a.medicoNome || a.medico_nome || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          a.status === 'atendido'
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                            : a.status === 'atendendo'
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Nome</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">CPF</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Telefone</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Email</th>
                  <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Convênio</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.slice(0, 50).map((p, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{p.nome}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{p.cpf || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{p.telefone || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{p.email || '-'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{p.convenio || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {dadosFiltrados.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-30" />
              <p>Nenhum registro encontrado para os filtros selecionados</p>
            </div>
          )}
        </div>
      </Card>

      {/* Gráfico de Atendimentos por Médico */}
      {tipoRelatorio === 'atendimentos' && Object.keys(estatisticas.porMedico || {}).length > 0 && (
        <Card title="Atendimentos por Médico">
          <div className="space-y-3">
            {Object.entries(estatisticas.porMedico)
              .sort((a, b) => b[1] - a[1])
              .map(([medico, count]) => {
                const maxCount = Math.max(...Object.values(estatisticas.porMedico));
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={medico} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {medico}
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-xs font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default RelatoriosScreen;
