// src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = this.getToken();
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('biosystem_token', token);
  }

  getToken() {
    return localStorage.getItem('biosystem_token');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('biosystem_token');
  }

  getAuthHeader() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(method, endpoint, data = null) {
    try {
      const options = {
        method,
        headers: this.getAuthHeader(),
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      console.log(`📡 [${method}] ${API_URL}${endpoint}`);

      const response = await fetch(`${API_URL}${endpoint}`, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));

        // Tratamento específico para token expirado/inválido
        if (response.status === 401) {
          this.clearToken();
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }

        // Tratamento para acesso negado
        if (response.status === 403) {
          throw new Error(error.error || 'Você não tem permissão para realizar esta ação.');
        }

        // Tratamento para não encontrado
        if (response.status === 404) {
          throw new Error(error.error || 'Recurso não encontrado.');
        }

        throw new Error(error.error || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro na requisição:', error);

      // Trata erro de conectividade
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(`Não conseguiu conectar ao servidor (${API_URL}). Verifique se o backend está rodando.`);
      }

      throw error;
    }
  }

  // ========== AUTH ==========
  async login(email, senha) {
    const result = await this.request('POST', '/auth/login', { email, senha });
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  async logout() {
    this.clearToken();
  }

  async verificarToken() {
    try {
      return await this.request('GET', '/auth/me');
    } catch (err) {
      this.clearToken();
      throw err;
    }
  }

  // ========== AUTENTICAÇÃO - ESQUECI SENHA ==========
  async forgotPassword(contact) {
    // contact: pode ser email ou telefone
    return this.request('POST', '/auth/forgot-password', { contact });
  }

  // ========== USUÁRIOS ==========
  async listarUsuarios(clinicaId = null) {
    const query = clinicaId ? `?clinica_id=${clinicaId}` : '';
    return this.request('GET', `/usuarios${query}`);
  }

  async obterUsuario(id) {
    return this.request('GET', `/usuarios/${id}`);
  }

  async criarUsuario(dados) {
    return this.request('POST', '/auth/registrar', dados);
  }

  async atualizarUsuario(id, dados) {
    return this.request('PUT', `/usuarios/${id}`, dados);
  }

  async deletarUsuario(id) {
    return this.request('DELETE', `/usuarios/${id}`);
  }

  // ========== PACIENTES ==========
  async listarPacientes(clinicaId = null) {
    const query = clinicaId ? `?clinica_id=${clinicaId}` : '';
    return this.request('GET', `/pacientes${query}`);
  }

  async buscarPacienteCPF(cpf) {
    return this.request('GET', `/pacientes/cpf/${cpf}`);
  }

  async criarPaciente(dados) {
    return this.request('POST', '/pacientes', dados);
  }

  async atualizarPaciente(id, dados) {
    return this.request('PUT', `/pacientes/${id}`, dados);
  }

  // ========== PRONTUÁRIOS ==========
  async listarProntuarios(pacienteId = null, clinicaId = null) {
    const params = [];
    if (pacienteId) params.push(`paciente_id=${pacienteId}`);
    if (clinicaId) params.push(`clinica_id=${clinicaId}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.request('GET', `/prontuarios${query}`);
  }

  async criarProntuario(dados) {
    return this.request('POST', '/prontuarios', dados);
  }

  async atualizarProntuario(id, dados) {
    return this.request('PUT', `/prontuarios/${id}`, dados);
  }

  async deletarProntuario(id) {
    return this.request('DELETE', `/prontuarios/${id}`);
  }

  // ========== CLÍNICAS ==========
  async listarClinicas() {
    return this.request('GET', '/clinicas');
  }

  async obterClinica(id) {
    return this.request('GET', `/clinicas/${id}`);
  }

  async criarClinica(dados) {
    return this.request('POST', '/clinicas', dados);
  }

  async atualizarClinica(id, dados) {
    return this.request('PUT', `/clinicas/${id}`, dados);
  }

  async deletarClinica(id) {
    return this.request('DELETE', `/clinicas/${id}`);
  }

  // ========== FILA DE ATENDIMENTO ==========
  async listarFila(clinicaId = null, status = null) {
    const params = [];
    if (clinicaId) params.push(`clinica_id=${clinicaId}`);
    if (status) params.push(`status=${status}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.request('GET', `/fila-atendimento${query}`);
  }

  async adicionarFila(dados) {
    return this.request('POST', '/fila-atendimento', dados);
  }

  async atualizarFila(id, dados) {
    return this.request('PUT', `/fila-atendimento/${id}`, dados);
  }

  async removerFila(id) {
    return this.request('DELETE', `/fila-atendimento/${id}`);
  }

  // ========== MÉDICOS ==========
  async listarMedicos(clinicaId = null) {
    const query = clinicaId ? `?clinica_id=${clinicaId}` : '';
    return this.request('GET', `/medicos${query}`);
  }

  async obterMedico(id) {
    return this.request('GET', `/medicos/${id}`);
  }

  async criarMedico(dados) {
    return this.request('POST', '/medicos', dados);
  }

  async atualizarMedico(id, dados) {
    return this.request('PUT', `/medicos/${id}`, dados);
  }

  async deletarMedico(id) {
    return this.request('DELETE', `/medicos/${id}`);
  }

  // ========== PROCEDIMENTOS ==========
  async listarProcedimentos(clinicaId = null) {
    const query = clinicaId ? `?clinica_id=${clinicaId}` : '';
    return this.request('GET', `/procedimentos${query}`);
  }

  async obterProcedimento(id) {
    return this.request('GET', `/procedimentos/${id}`);
  }

  async obterProcedimentoComClinicas(id) {
    return this.request('GET', `/procedimentos/${id}`);
  }

  async criarProcedimento(dados) {
    return this.request('POST', '/procedimentos', dados);
  }

  async atualizarProcedimento(id, dados) {
    return this.request('PUT', `/procedimentos/${id}`, dados);
  }

  async deletarProcedimento(id) {
    return this.request('DELETE', `/procedimentos/${id}`);
  }
}

const apiService = new ApiService();
export default apiService;
