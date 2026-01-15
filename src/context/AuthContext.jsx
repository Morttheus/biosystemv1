// src/context/AuthContext.jsx
import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Usuários do sistema (em produção, isso viria de um banco de dados)
  const [usuarios, setUsuarios] = useState([
    {
      id: 1,
      nome: 'Administrador Master',
      email: 'master@biosystem.com',
      senha: '123456',
      tipo: 'master',
      clinicaId: null // Master tem acesso a todas as clínicas
    },
    {
      id: 2,
      nome: 'Admin Clínica Centro',
      email: 'admin@biosystem.com',
      senha: '123456',
      tipo: 'admin',
      clinicaId: 1 // Admin da clínica Centro
    },
    {
      id: 3,
      nome: 'Admin Clínica Sul',
      email: 'adminsul@biosystem.com',
      senha: '123456',
      tipo: 'admin',
      clinicaId: 2 // Admin da clínica Sul
    },
    {
      id: 4,
      nome: 'Recepcionista Ana',
      email: 'usuario@biosystem.com',
      senha: '123456',
      tipo: 'usuario',
      clinicaId: 1
    },
    {
      id: 5,
      nome: 'Recepcionista Paula',
      email: 'paula@biosystem.com',
      senha: '123456',
      tipo: 'usuario',
      clinicaId: 2
    },
    {
      id: 6,
      nome: 'Dr. Carlos Silva',
      email: 'carlos@biosystem.com',
      senha: '123456',
      tipo: 'medico',
      medicoId: 1,
      clinicaId: 1
    },
    {
      id: 7,
      nome: 'Dra. Maria Santos',
      email: 'maria@biosystem.com',
      senha: '123456',
      tipo: 'medico',
      medicoId: 2,
      clinicaId: 1
    },
    {
      id: 8,
      nome: 'Painel Clínica Centro',
      email: 'painel@biosystem.com',
      senha: '123456',
      tipo: 'painel',
      clinicaId: 1
    },
    {
      id: 9,
      nome: 'Painel Clínica Sul',
      email: 'painelsul@biosystem.com',
      senha: '123456',
      tipo: 'painel',
      clinicaId: 2
    },
  ]);

  const [usuarioLogado, setUsuarioLogado] = useState(null);

  const login = (email, senha) => {
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);

    if (usuario) {
      const { senha: _, ...usuarioSemSenha } = usuario;
      setUsuarioLogado(usuarioSemSenha);
      return { success: true, usuario: usuarioSemSenha };
    }

    return { success: false, error: 'Email ou senha incorretos' };
  };

  const logout = () => {
    setUsuarioLogado(null);
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

  // Obtém usuários por clínica (admin só vê sua clínica, master vê todos)
  const obterUsuarios = (clinicaId = null) => {
    if (isMaster()) {
      return usuarios.map(({ senha, ...u }) => u);
    }
    if (clinicaId) {
      return usuarios
        .filter(u => u.clinicaId === clinicaId)
        .map(({ senha, ...u }) => u);
    }
    return [];
  };

  // Obtém todos os usuários (somente master)
  const obterTodosUsuarios = () => {
    if (!isMaster()) return [];
    return usuarios.map(({ senha, ...u }) => u);
  };

  // Adicionar novo usuário
  const adicionarUsuario = (dadosUsuario) => {
    // Verifica se email já existe
    const emailExiste = usuarios.some(u => u.email === dadosUsuario.email);
    if (emailExiste) {
      return { success: false, error: 'Email já cadastrado' };
    }

    // Admin só pode criar usuários para sua própria clínica
    if (isAdmin() && dadosUsuario.clinicaId !== usuarioLogado.clinicaId) {
      return { success: false, error: 'Você só pode criar usuários para sua clínica' };
    }

    // Admin não pode criar outros admins ou masters
    if (isAdmin() && (dadosUsuario.tipo === 'admin' || dadosUsuario.tipo === 'master')) {
      return { success: false, error: 'Você não tem permissão para criar este tipo de usuário' };
    }

    const novoUsuario = {
      ...dadosUsuario,
      id: Date.now(),
    };

    setUsuarios(prev => [...prev, novoUsuario]);
    return { success: true, usuario: { ...novoUsuario, senha: undefined } };
  };

  // Editar usuário existente
  const editarUsuario = (id, dados) => {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Admin só pode editar usuários da sua clínica
    if (isAdmin() && usuario.clinicaId !== usuarioLogado.clinicaId) {
      return { success: false, error: 'Você só pode editar usuários da sua clínica' };
    }

    // Admin não pode promover para admin ou master
    if (isAdmin() && (dados.tipo === 'admin' || dados.tipo === 'master')) {
      return { success: false, error: 'Você não tem permissão para definir este tipo de usuário' };
    }

    // Verifica se novo email já existe (se estiver mudando)
    if (dados.email && dados.email !== usuario.email) {
      const emailExiste = usuarios.some(u => u.email === dados.email);
      if (emailExiste) {
        return { success: false, error: 'Email já cadastrado' };
      }
    }

    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...dados } : u));
    return { success: true };
  };

  // Excluir usuário
  const excluirUsuario = (id) => {
    const usuario = usuarios.find(u => u.id === id);
    if (!usuario) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Não pode excluir a si mesmo
    if (usuarioLogado.id === id) {
      return { success: false, error: 'Você não pode excluir seu próprio usuário' };
    }

    // Admin só pode excluir usuários da sua clínica
    if (isAdmin() && usuario.clinicaId !== usuarioLogado.clinicaId) {
      return { success: false, error: 'Você só pode excluir usuários da sua clínica' };
    }

    // Admin não pode excluir outros admins ou masters
    if (isAdmin() && (usuario.tipo === 'admin' || usuario.tipo === 'master')) {
      return { success: false, error: 'Você não tem permissão para excluir este tipo de usuário' };
    }

    setUsuarios(prev => prev.filter(u => u.id !== id));
    return { success: true };
  };

  const value = {
    usuarioLogado,
    usuarios: usuarios.map(({ senha, ...u }) => u), // Expõe usuários sem senha
    login,
    logout,
    isAuthenticated,
    isMaster,
    isAdmin,
    isUsuario,
    isMedico,
    isPainel,
    // Funções de gerenciamento de usuários
    obterUsuarios,
    obterTodosUsuarios,
    adicionarUsuario,
    editarUsuario,
    excluirUsuario,
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
