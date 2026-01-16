// src/utils/validators.js
// Funções de validação centralizadas

/**
 * Valida CPF
 * @param {string} cpf - CPF a validar
 * @returns {boolean} Se é válido
 */
export const validarCPF = (cpf) => {
  if (!cpf) return false;

  const numeros = cpf.replace(/\D/g, '');

  if (numeros.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  // Validação dos dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(10))) return false;

  return true;
};

/**
 * Valida email
 * @param {string} email - Email a validar
 * @returns {boolean} Se é válido
 */
export const validarEmail = (email) => {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Valida telefone brasileiro (10 ou 11 dígitos)
 * @param {string} telefone - Telefone a validar
 * @returns {boolean} Se é válido
 */
export const validarTelefone = (telefone) => {
  if (!telefone) return false;
  const numeros = telefone.replace(/\D/g, '');
  return numeros.length >= 10 && numeros.length <= 11;
};

/**
 * Valida senha (mínimo 6 caracteres)
 * @param {string} senha - Senha a validar
 * @param {number} minLength - Tamanho mínimo (default 6)
 * @returns {boolean} Se é válida
 */
export const validarSenha = (senha, minLength = 6) => {
  if (!senha) return false;
  return senha.length >= minLength;
};

/**
 * Valida se campo não está vazio
 * @param {string} valor - Valor a validar
 * @returns {boolean} Se não está vazio
 */
export const validarCampoObrigatorio = (valor) => {
  if (valor === null || valor === undefined) return false;
  return String(valor).trim().length > 0;
};

/**
 * Valida CRM (formato XX-000000)
 * @param {string} crm - CRM a validar
 * @returns {boolean} Se é válido
 */
export const validarCRM = (crm) => {
  if (!crm) return false;
  // CRM: UF-números (ex: SP-123456)
  const regex = /^[A-Z]{2}-?\d{4,6}$/i;
  return regex.test(crm.trim());
};

/**
 * Valida data
 * @param {string|Date} data - Data a validar
 * @returns {boolean} Se é válida
 */
export const validarData = (data) => {
  if (!data) return false;
  const d = new Date(data);
  return d instanceof Date && !isNaN(d);
};

/**
 * Valida formulário de usuário
 * @param {object} dados - Dados do usuário
 * @returns {object} { valido: boolean, erros: string[] }
 */
export const validarFormularioUsuario = (dados) => {
  const erros = [];

  if (!validarCampoObrigatorio(dados.nome)) {
    erros.push('Nome é obrigatório');
  }

  if (!validarEmail(dados.email)) {
    erros.push('Email inválido');
  }

  if (dados.senha && !validarSenha(dados.senha)) {
    erros.push('Senha deve ter no mínimo 6 caracteres');
  }

  if (dados.telefone && !validarTelefone(dados.telefone)) {
    erros.push('Telefone inválido');
  }

  return {
    valido: erros.length === 0,
    erros
  };
};

/**
 * Valida formulário de paciente
 * @param {object} dados - Dados do paciente
 * @returns {object} { valido: boolean, erros: string[] }
 */
export const validarFormularioPaciente = (dados) => {
  const erros = [];

  if (!validarCampoObrigatorio(dados.nome)) {
    erros.push('Nome é obrigatório');
  }

  if (!validarCPF(dados.cpf)) {
    erros.push('CPF inválido');
  }

  if (dados.telefone && !validarTelefone(dados.telefone)) {
    erros.push('Telefone inválido');
  }

  return {
    valido: erros.length === 0,
    erros
  };
};