// src/utils/formatters.js
// Funções de formatação centralizadas

/**
 * Formata CPF para exibição (000.000.000-00)
 * @param {string} cpf - CPF com ou sem formatação
 * @returns {string} CPF formatado
 */
export const formatarCPF = (cpf) => {
  if (!cpf) return '';
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length <= 11) {
    return numeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return cpf;
};

/**
 * Remove formatação do CPF
 * @param {string} cpf - CPF formatado
 * @returns {string} CPF apenas números
 */
export const limparCPF = (cpf) => {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
};

/**
 * Formata telefone para exibição (00) 00000-0000
 * @param {string} telefone - Telefone com ou sem formatação
 * @returns {string} Telefone formatado
 */
export const formatarTelefone = (telefone) => {
  if (!telefone) return '';
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length <= 11) {
    if (numeros.length > 6) {
      return numeros.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    } else if (numeros.length > 2) {
      return numeros.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    return numeros;
  }
  return telefone;
};

/**
 * Remove formatação do telefone
 * @param {string} telefone - Telefone formatado
 * @returns {string} Telefone apenas números
 */
export const limparTelefone = (telefone) => {
  if (!telefone) return '';
  return telefone.replace(/\D/g, '');
};

/**
 * Formata data para exibição (DD/MM/YYYY)
 * @param {string|Date} data - Data a formatar
 * @param {boolean} incluirHora - Se deve incluir hora
 * @returns {string} Data formatada
 */
export const formatarData = (data, incluirHora = false) => {
  if (!data) return '-';
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  if (incluirHora) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Date(data).toLocaleDateString('pt-BR', options);
};

/**
 * Formata data e hora para exibição (DD/MM/YYYY HH:mm)
 * @param {string|Date} data - Data a formatar
 * @returns {string} Data e hora formatadas
 */
export const formatarDataHora = (data) => {
  return formatarData(data, true);
};

/**
 * Formata apenas hora (HH:mm)
 * @param {string|Date} data - Data/hora a formatar
 * @returns {string} Hora formatada
 */
export const formatarHora = (data) => {
  if (!data) return '-';
  return new Date(data).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formata nome para exibição (primeira letra maiúscula)
 * @param {string} nome - Nome completo
 * @returns {string} Nome formatado
 */
export const formatarNome = (nome) => {
  if (!nome) return '';
  return nome
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
};

/**
 * Abrevia nome (João Silva Santos -> João S. Santos)
 * @param {string} nome - Nome completo
 * @returns {string} Nome abreviado
 */
export const abreviarNome = (nome) => {
  if (!nome) return '';
  const partes = nome.trim().split(' ');
  if (partes.length <= 2) return nome;
  const primeiro = partes[0];
  const ultimo = partes[partes.length - 1];
  const meio = partes.slice(1, -1).map(p => p.charAt(0).toUpperCase() + '.').join(' ');
  return `${primeiro} ${meio} ${ultimo}`;
};