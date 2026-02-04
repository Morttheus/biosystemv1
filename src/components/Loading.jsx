// src/components/Loading.jsx
import React from 'react';

const Loading = ({ message = 'Carregando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 dark:border-blue-400 mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
};

export default Loading;