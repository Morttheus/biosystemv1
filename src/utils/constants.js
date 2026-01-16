// src/utils/constants.js
// Constantes centralizadas do sistema

/**
 * Tipos de usuário disponíveis no sistema
 */
export const TIPOS_USUARIO = [
  { value: 'master', label: 'Master' },
  { value: 'admin', label: 'Administrador de Clínica' },
  { value: 'usuario', label: 'Recepcionista' },
  { value: 'medico', label: 'Médico' },
  { value: 'painel', label: 'Painel TV (Sala de Espera)' },
];

/**
 * Configuração de cores e labels por tipo de usuário
 */
export const USER_TYPE_CONFIG = {
  master: {
    label: 'Master',
    badgeColor: 'bg-purple-100 text-purple-800',
    icon: 'Shield'
  },
  admin: {
    label: 'Administrador',
    badgeColor: 'bg-blue-100 text-blue-800',
    icon: 'Building2'
  },
  usuario: {
    label: 'Recepcionista',
    badgeColor: 'bg-green-100 text-green-800',
    icon: 'User'
  },
  medico: {
    label: 'Médico',
    badgeColor: 'bg-orange-100 text-orange-800',
    icon: 'Stethoscope'
  },
  painel: {
    label: 'Painel',
    badgeColor: 'bg-gray-100 text-gray-800',
    icon: 'Monitor'
  }
};

/**
 * Status de atendimento na fila
 */
export const STATUS_FILA = {
  AGUARDANDO: 'aguardando',
  CHAMADO: 'chamado',
  EM_ATENDIMENTO: 'em_atendimento',
  ATENDIDO: 'atendido',
  DESISTIU: 'desistiu'
};

/**
 * Configuração de cores por status da fila
 */
export const STATUS_FILA_CONFIG = {
  aguardando: {
    label: 'Aguardando',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    icon: 'Clock'
  },
  chamado: {
    label: 'Chamado',
    badgeColor: 'bg-blue-100 text-blue-800',
    icon: 'Bell'
  },
  em_atendimento: {
    label: 'Em Atendimento',
    badgeColor: 'bg-green-100 text-green-800',
    icon: 'Stethoscope'
  },
  atendido: {
    label: 'Atendido',
    badgeColor: 'bg-gray-100 text-gray-800',
    icon: 'CheckCircle'
  },
  desistiu: {
    label: 'Desistiu',
    badgeColor: 'bg-red-100 text-red-800',
    icon: 'XCircle'
  }
};

/**
 * Períodos para relatórios
 */
export const PERIODOS_RELATORIO = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'personalizado', label: 'Personalizado' }
];

/**
 * Calcula datas de início e fim baseado no período
 * @param {string} periodo - Período selecionado
 * @returns {object} { dataInicio: Date, dataFim: Date }
 */
export const calcularDatasRelatorio = (periodo) => {
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

/**
 * Obtém label do tipo de usuário
 * @param {string} tipo - Tipo do usuário
 * @returns {string} Label formatado
 */
export const getTipoLabel = (tipo) => {
  return USER_TYPE_CONFIG[tipo]?.label || tipo;
};

/**
 * Obtém cor do badge por tipo
 * @param {string} tipo - Tipo do usuário
 * @returns {string} Classes CSS do badge
 */
export const getTipoBadgeColor = (tipo) => {
  return USER_TYPE_CONFIG[tipo]?.badgeColor || 'bg-gray-100 text-gray-800';
};

/**
 * Obtém label do período
 * @param {string} periodo - Código do período
 * @returns {string} Label do período
 */
export const getPeriodoLabel = (periodo) => {
  const found = PERIODOS_RELATORIO.find(p => p.value === periodo);
  return found?.label || periodo;
};

/**
 * Obtém label do status da fila
 * @param {string} status - Status da fila
 * @returns {string} Label formatado
 */
export const getStatusFilaLabel = (status) => {
  return STATUS_FILA_CONFIG[status]?.label || status;
};

/**
 * Obtém cor do badge por status da fila
 * @param {string} status - Status da fila
 * @returns {string} Classes CSS do badge
 */
export const getStatusFilaBadgeColor = (status) => {
  return STATUS_FILA_CONFIG[status]?.badgeColor || 'bg-gray-100 text-gray-800';
};

/**
 * Mensagens de erro padrão
 */
export const MENSAGENS_ERRO = {
  CONEXAO: 'Erro de conexão com o servidor. Verifique sua internet.',
  AUTENTICACAO: 'Sessão expirada. Faça login novamente.',
  PERMISSAO: 'Você não tem permissão para esta ação.',
  VALIDACAO: 'Verifique os campos obrigatórios.',
  SERVIDOR: 'Erro interno do servidor. Tente novamente.',
  NAO_ENCONTRADO: 'Registro não encontrado.'
};

/**
 * Mensagens de sucesso padrão
 */
export const MENSAGENS_SUCESSO = {
  SALVO: 'Dados salvos com sucesso!',
  EXCLUIDO: 'Registro excluído com sucesso!',
  ATUALIZADO: 'Dados atualizados com sucesso!',
  CRIADO: 'Registro criado com sucesso!'
};