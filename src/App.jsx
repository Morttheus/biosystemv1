// src/App.jsx
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginScreen from './views/auth/LoginScreen';
import MasterScreen from './views/master/MasterScreen';
import AdminScreen from './views/admin/AdminScreen';
import RecepcaoScreen from './views/recepcao/RecepcaoScreen';
import ConsultorioScreen from './views/consultorio/ConsultorioScreen';
import ProntuarioScreen from './views/prontuario/ProntuarioScreen';
import SalaEsperaScreen from './views/tv/SalaEsperaScreen';

const AppContent = () => {
  const { isAuthenticated, isMaster, isAdmin, isMedico, isUsuario, isPainel } = useAuth();
  const { telaAtual } = useApp();

  // Se não está autenticado, mostra tela de login
  if (!isAuthenticated()) {
    return <LoginScreen />;
  }

  // Se é usuário do tipo painel, mostra apenas a sala de espera
  if (isPainel()) {
    return <SalaEsperaScreen />;
  }

  // Se é para exibir painel de sala de espera (acesso público)
  if (telaAtual === 'sala-espera') {
    return <SalaEsperaScreen />;
  }

  // Se é Master, mostra painel master (acesso total)
  if (isMaster()) {
    return <MasterScreen />;
  }

  // Se é Admin de clínica, mostra painel administrativo da clínica
  if (isAdmin()) {
    return <AdminScreen />;
  }

  // Se é Médico, mostra tela do consultório
  if (isMedico()) {
    return <ConsultorioScreen />;
  }

  // Se é usuário (recepcionista), mostra navegação normal
  if (isUsuario()) {
    switch (telaAtual) {
      case 'recepcao':
        return <RecepcaoScreen />;
      case 'prontuario':
        return <ProntuarioScreen />;
      default:
        return <RecepcaoScreen />;
    }
  }

  // Fallback
  return <LoginScreen />;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <AppProvider>
            <AppContent />
            <ToastContainer />
          </AppProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
