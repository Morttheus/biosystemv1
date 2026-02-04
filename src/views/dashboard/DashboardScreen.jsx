// src/views/dashboard/DashboardScreen.jsx
import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Clock,
  Activity,
  Eye,
  Stethoscope,
  DollarSign,
  BarChart3
} from 'lucide-react';

const DashboardScreen = () => {
  const { usuarioLogado } = useAuth();
  const { pacientes, medicos, filaAtendimento, clinicas } = useData();

  const clinicaId = usuarioLogado?.clinicaId || usuarioLogado?.clinica_id;
  const isMaster = usuarioLogado?.tipo === 'master';

  // Filtra dados por clínica se não for master
  const pacientesClinica = isMaster
    ? pacientes
    : pacientes.filter(p => (p.clinicaId || p.clinica_id) === clinicaId);

  const medicosClinica = isMaster
    ? medicos
    : medicos.filter(m => (m.clinicaId || m.clinica_id) === clinicaId);

  // Estatísticas do dia
  const hoje = new Date().toDateString();

  const atendimentosHoje = filaAtendimento.filter(a => {
    const dataAtend = new Date(a.horarioChegada || a.horario_chegada).toDateString();
    const atendClinicaId = a.clinicaId || a.clinica_id;
    return dataAtend === hoje && (isMaster || atendClinicaId === clinicaId);
  });

  const atendidosHoje = atendimentosHoje.filter(a => a.status === 'atendido');
  const aguardandoHoje = atendimentosHoje.filter(a => a.status === 'aguardando');
  const emAtendimento = atendimentosHoje.filter(a => a.status === 'atendendo');

  // Estatísticas da semana
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());

  const atendimentosSemana = filaAtendimento.filter(a => {
    const dataAtend = new Date(a.horarioChegada || a.horario_chegada);
    const atendClinicaId = a.clinicaId || a.clinica_id;
    return dataAtend >= inicioSemana && (isMaster || atendClinicaId === clinicaId);
  });

  // Atendimentos por dia da semana (para gráfico)
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const atendimentosPorDia = diasSemana.map((dia, index) => {
    const count = atendimentosSemana.filter(a => {
      const dataAtend = new Date(a.horarioChegada || a.horario_chegada);
      return dataAtend.getDay() === index && a.status === 'atendido';
    }).length;
    return { dia, count };
  });

  const maxAtendimentos = Math.max(...atendimentosPorDia.map(d => d.count), 1);

  // Atendimentos por médico
  const atendimentosPorMedico = medicosClinica.map(medico => {
    const count = atendimentosHoje.filter(a => {
      const medicoId = a.medicoId || a.medico_id;
      return medicoId === medico.id && a.status === 'atendido';
    }).length;
    return { nome: medico.nome, count };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Visão geral do sistema - {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Pacientes Cadastrados</p>
              <p className="text-3xl font-bold mt-1">{pacientesClinica.length}</p>
            </div>
            <div className="bg-blue-400/30 p-3 rounded-full">
              <Users size={28} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Atendidos Hoje</p>
              <p className="text-3xl font-bold mt-1">{atendidosHoje.length}</p>
            </div>
            <div className="bg-green-400/30 p-3 rounded-full">
              <UserCheck size={28} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Aguardando</p>
              <p className="text-3xl font-bold mt-1">{aguardandoHoje.length}</p>
            </div>
            <div className="bg-orange-400/30 p-3 rounded-full">
              <Clock size={28} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Em Atendimento</p>
              <p className="text-3xl font-bold mt-1">{emAtendimento.length}</p>
            </div>
            <div className="bg-purple-400/30 p-3 rounded-full">
              <Activity size={28} />
            </div>
          </div>
        </Card>
      </div>

      {/* Segunda linha de cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Médicos Ativos</p>
              <p className="text-3xl font-bold mt-1">{medicosClinica.filter(m => m.ativo).length}</p>
            </div>
            <div className="bg-teal-400/30 p-3 rounded-full">
              <Stethoscope size={28} />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Atendimentos na Semana</p>
              <p className="text-3xl font-bold mt-1">{atendimentosSemana.filter(a => a.status === 'atendido').length}</p>
            </div>
            <div className="bg-indigo-400/30 p-3 rounded-full">
              <Calendar size={28} />
            </div>
          </div>
        </Card>

        {isMaster && (
          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm font-medium">Clínicas Ativas</p>
                <p className="text-3xl font-bold mt-1">{clinicas.filter(c => c.ativa).length}</p>
              </div>
              <div className="bg-pink-400/30 p-3 rounded-full">
                <Eye size={28} />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Atendimentos por Dia */}
        <Card title="Atendimentos da Semana" subtitle="Pacientes atendidos por dia">
          <div className="h-64 flex items-end justify-between gap-2 pt-4">
            {atendimentosPorDia.map((item, index) => {
              const altura = (item.count / maxAtendimentos) * 100;
              const isHoje = index === new Date().getDay();
              return (
                <div key={item.dia} className="flex-1 flex flex-col items-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{item.count}</span>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isHoje ? 'bg-gradient-to-t from-teal-500 to-teal-400' : 'bg-gradient-to-t from-blue-500 to-blue-400'
                    }`}
                    style={{ height: `${Math.max(altura, 5)}%` }}
                  />
                  <span className={`text-xs mt-2 ${isHoje ? 'font-bold text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {item.dia}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Ranking de Médicos */}
        <Card title="Atendimentos por Médico" subtitle="Ranking do dia">
          <div className="space-y-3">
            {atendimentosPorMedico.slice(0, 5).map((medico, index) => (
              <div key={medico.nome} className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-400' :
                  'bg-gray-300'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Dr(a). {medico.nome}</span>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{medico.count} atend.</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-400' :
                        'bg-blue-400'
                      }`}
                      style={{ width: `${(medico.count / Math.max(...atendimentosPorMedico.map(m => m.count), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {atendimentosPorMedico.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum atendimento hoje</p>
            )}
          </div>
        </Card>
      </div>

      {/* Fila de Espera Atual */}
      <Card title="Fila de Espera Atual" subtitle="Pacientes aguardando atendimento">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold">#</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold">Paciente</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold">Médico</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold">Chegada</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-300 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...aguardandoHoje, ...emAtendimento].slice(0, 10).map((atend, index) => {
                const pacienteNome = atend.pacienteNome || atend.paciente_nome || 'Paciente';
                const medicoNome = atend.medicoNome || atend.medico_nome || '-';
                const horarioChegada = atend.horarioChegada || atend.horario_chegada;
                return (
                  <tr key={atend.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400">{index + 1}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{pacienteNome}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">Dr(a). {medicoNome}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                      {horarioChegada ? new Date(horarioChegada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        atend.status === 'atendendo'
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {atend.status === 'atendendo' ? 'Em Atendimento' : 'Aguardando'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {aguardandoHoje.length === 0 && emAtendimento.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum paciente na fila</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardScreen;
