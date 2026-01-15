// src/views/auth/LoginScreen.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const resultado = login(email, senha);

    if (!resultado.success) {
      setErro(resultado.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Eye size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900">BioSystem</h1>
          <p className="text-gray-500 mt-2">Sistema de Gestao Oftalmologica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />

          <div className="relative">
            <Input
              label="Senha"
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
            >
              {mostrarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            icon={LogIn}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center mb-3">Usuarios de teste:</p>
          <div className="text-xs text-gray-500 space-y-2 bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between">
              <span className="font-semibold text-purple-600">Master:</span>
              <span>master@biosystem.com / 123456</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-blue-600">Admin:</span>
              <span>admin@biosystem.com / 123456</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-green-600">Recepcionista:</span>
              <span>usuario@biosystem.com / 123456</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-teal-600">Medico:</span>
              <span>carlos@biosystem.com / 123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
