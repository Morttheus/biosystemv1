// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Carregar usuário logado ao iniciar
  useEffect(() => {
    const recuperarUsuario = async () => {
      const token = apiService.getToken();
      if (token) {
        try {
          const { usuario } = await apiService.verificarToken();
          setUsuarioLogado(usuario);
          carregarUsuarios();
        } catch (err) {
          apiService.clearToken();
          setUsuarioLogado(null);
        }
      }
      setCarregando(false);
    };

    recuperarUsuario();
  }, []);

  const carregarUsuarios = async () => {
    try {
      const listaUsuarios = await apiService.listarUsuarios();
      setUsuarios(listaUsuarios);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const login = async (email, senha) => {
    try {
      setErro(null);
      const resultado = await apiService.login(email, senha);
      
      if (resultado.usuario) {
        setUsuarioLogado(resultado.usuario);
        toast.success('Login realizado com sucesso!');
        return { success: true, usuario: resultado.usuario };
      }
      
      return { success: false, error: 'Erro ao fazer login' };
    } catch (err) {
      const mensagem = err.message || 'Erro ao fazer login';
      setErro(mensagem);
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  const forgotPassword = async (contact) => {
    try {
      const resultado = await apiService.forgotPassword(contact);
      if (resultado.message) {
        toast.success(resultado.message);
        return { success: true };
      }
      throw new Error(resultado.error || 'Erro ao solicitar redefinição de senha');
    } catch (err) {
      const mensagem = err.message || 'Erro ao solicitar redefinição de senha';
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  const logout = async () => {
    await apiService.logout();
    setUsuarioLogado(null);
    toast.success('Logout realizado');
  };

  const isAuthenticated = () => {
    return usuarioLogado !== null;
  };

  const isMaster = () => {
    return usuarioLogado?.tipo === 'master';
  };

  const isAdmin = () => {
    return usuarioLogado?.tipo === 'admin';
  };

  const isUsuario = () => {
    return usuarioLogado?.tipo === 'usuario';
  };

  const isMedico = () => {
    return usuarioLogado?.tipo === 'medico';
  };

  const isPainel = () => {
    return usuarioLogado?.tipo === 'painel';
  };

  // ============ FUNÇÕES DE GERENCIAMENTO DE USUÁRIOS ============

  const obterUsuarios = (clinicaId = null) => {
    if (isMaster()) {
      return usuarios;
    }
    if (clinicaId) {
      return usuarios.filter(u => u.clinica_id === clinicaId);
    }
    return [];
  };

  const obterTodosUsuarios = () => {
    if (!isMaster()) return [];
    return usuarios;
  };

  const adicionarUsuario = async (dadosUsuario) => {
    try {
      const resultado = await apiService.criarUsuario(dadosUsuario);
      
      if (resultado.usuario) {
        setUsuarios(prev => [...prev, resultado.usuario]);
        toast.success('Usuário criado com sucesso!');
        return { success: true, usuario: resultado.usuario };
      }
      
      throw new Error(resultado.error || 'Erro ao criar usuário');
    } catch (err) {
      const mensagem = err.message || 'Erro ao criar usuário';
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  const editarUsuario = async (id, dados) => {
    try {
      const resultado = await apiService.atualizarUsuario(id, dados);
      
      if (resultado.usuario) {
        setUsuarios(prev => prev.map(u => u.id === id ? resultado.usuario : u));
        toast.success('Usuário atualizado com sucesso!');
        return { success: true };
      }
      
      throw new Error(resultado.error || 'Erro ao editar usuário');
    } catch (err) {
      const mensagem = err.message || 'Erro ao editar usuário';
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  const excluirUsuario = async (id) => {
    try {
      if (usuarioLogado.id === id) {
        throw new Error('Você não pode excluir seu próprio usuário');
      }

      const resultado = await apiService.deletarUsuario(id);
      
      if (resultado.message) {
        setUsuarios(prev => prev.filter(u => u.id !== id));
        toast.success('Usuário desativado com sucesso!');
        return { success: true };
      }
      
      throw new Error(resultado.error || 'Erro ao excluir usuário');
    } catch (err) {
      const mensagem = err.message || 'Erro ao excluir usuário';
      toast.error(mensagem);
      return { success: false, error: mensagem };
    }
  };

  const value = {
    usuarioLogado,
    usuarios,
    carregando,
    erro,
    login,
    logout,
    isAuthenticated,
    isMaster,
    isAdmin,
    isUsuario,
    isMedico,
    isPainel,
    obterUsuarios,
    obterTodosUsuarios,
    adicionarUsuario,
    editarUsuario,
    excluirUsuario,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;
