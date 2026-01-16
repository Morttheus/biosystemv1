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

      const response = await fetch(`${API_URL}${endpoint}`, options);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição:', error);
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
    let query = '?';
    if (pacienteId) query += `paciente_id=${pacienteId}`;
    if (clinicaId) query += `clinica_id=${clinicaId}`;
    return this.request('GET', `/prontuarios${query === '?' ? '' : query}`);
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
}

const apiService = new ApiService();
export default apiService;
