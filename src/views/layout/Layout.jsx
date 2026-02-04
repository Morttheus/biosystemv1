// src/views/layout/Layout.jsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Sidebar />
        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
