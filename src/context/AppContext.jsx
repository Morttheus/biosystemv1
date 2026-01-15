// src/context/AppContext.jsx
import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de um AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [telaAtual, setTelaAtual] = useState('recepcao');
  const [clinicaSelecionada, setClinicaSelecionada] = useState(null);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(null);

  const navegarPara = (tela) => {
    setTelaAtual(tela);
  };

  const selecionarClinica = (clinica) => {
    setClinicaSelecionada(clinica);
  };

  const selecionarPaciente = (paciente) => {
    setPacienteSelecionado(paciente);
  };

  const abrirModal = (modal) => {
    setModalAberto(modal);
  };

  const fecharModal = () => {
    setModalAberto(null);
  };

  return (
    <AppContext.Provider value={{
      telaAtual,
      setTelaAtual,
      navegarPara,
      clinicaSelecionada,
      setClinicaSelecionada,
      selecionarClinica,
      pacienteSelecionado,
      setPacienteSelecionado,
      selecionarPaciente,
      modalAberto,
      abrirModal,
      fecharModal,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
