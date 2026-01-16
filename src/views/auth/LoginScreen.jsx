// src/views/auth/LoginScreen.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { LogIn, Eye, EyeOff } from 'lucide-react';

const LoginScreen = () => {
  const { login, forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarEsqueci, setMostrarEsqueci] = useState(false);
  const [contatoRecuperacao, setContatoRecuperacao] = useState('');
  const [loadingEsqueci, setLoadingEsqueci] = useState(false);

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

        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setMostrarEsqueci(!mostrarEsqueci)}
          >
            Esqueci a senha
          </button>
        </div>

        {mostrarEsqueci && (
          <div className="mt-4 bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Informe seu email ou telefone cadastrado para receber a nova senha.</p>
            <Input
              label="Email ou Telefone"
              value={contatoRecuperacao}
              onChange={(e) => setContatoRecuperacao(e.target.value)}
              placeholder="email@exemplo.com ou (11) 99999-9999"
            />
            <div className="flex gap-2 mt-3">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => { setMostrarEsqueci(false); setContatoRecuperacao(''); }}
              >
                Cancelar
              </Button>
              <Button
                fullWidth
                onClick={async () => {
                  setLoadingEsqueci(true);
                  try {
                    const resultado = await forgotPassword(contatoRecuperacao);
                    if (resultado.success) {
                      setContatoRecuperacao('');
                      setMostrarEsqueci(false);
                    }
                  } catch (err) {
                    // handled in context
                  }
                  setLoadingEsqueci(false);
                }}
                disabled={loadingEsqueci || !contatoRecuperacao}
              >
                {loadingEsqueci ? 'Enviando...' : 'Enviar nova senha'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
