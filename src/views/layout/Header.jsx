// src/views/layout/Header.jsx
import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import Button from '../../components/Button';

const Header = () => {
  const { usuarioLogado, logout } = useAuth();
  const { clinicas } = useData();

  const clinicaAtual = clinicas.find(c => c.id === usuarioLogado?.clinicaId);

  const getTipoUsuario = () => {
    switch (usuarioLogado?.tipo) {
      case 'master': return 'Master Admin';
      case 'medico': return 'Médico';
      case 'usuario': return 'Recepcionista';
      default: return 'Usuário';
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">BioSystem</h1>
            <p className="text-blue-200 text-sm">
              {getTipoUsuario()} - {usuarioLogado?.nome}
              {clinicaAtual && ` | ${clinicaAtual.nome}`}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="danger"
              size="sm"
              icon={LogOut}
              onClick={logout}
            >
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
