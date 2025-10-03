import React from 'react';
import { CardProps } from '../../types';

const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  actions,
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-ai-teal/20 ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-ai-teal/20 flex items-center justify-between">
          {title && (
            <h3 className="text-lg font-semibold text-ai-teal">{title}</h3>
          )}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
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
