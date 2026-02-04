// src/components/Card.jsx
import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  className = '',
  headerActions,
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300 ${className}`}>
      {(title || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {headerActions && (
            <div className="flex gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;
