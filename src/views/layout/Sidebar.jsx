// src/views/layout/Sidebar.jsx
import React from 'react';
import { Users, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const Sidebar = () => {
  const { isUsuario } = useAuth();
  const { telaAtual, navegarPara } = useApp();

  // Menu para usuários (recepcionistas)
  const menuUsuario = [
    { id: 'recepcao', label: 'Recepção', icon: Users },
    { id: 'prontuario', label: 'Prontuários', icon: FileText },
  ];

  const menuItems = isUsuario() ? menuUsuario : [];

  if (menuItems.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex gap-3 flex-wrap">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navegarPara(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                telaAtual === item.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
