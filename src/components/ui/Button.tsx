import React from 'react';
import { ButtonProps } from '../../types';

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-ai-teal to-ai-teal-light hover:from-ai-teal-dark hover:to-ai-teal text-white focus:ring-ai-teal shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-gradient-to-r from-ai-orange to-ai-orange-light hover:from-ai-orange-dark hover:to-ai-orange text-white focus:ring-ai-orange shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0',
    outline: 'border-2 border-ai-teal bg-white hover:bg-ai-teal hover:text-white text-ai-teal focus:ring-ai-teal shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-colors',
    ghost: 'bg-transparent hover:bg-ai-cream text-gray-700 hover:text-gray-900 focus:ring-ai-teal hover:shadow-sm transform hover:-translate-y-0.5 active:translate-y-0',
    danger: 'bg-gradient-to-r from-ai-coral to-red-500 hover:from-red-600 hover:to-ai-coral-dark text-white focus:ring-ai-coral shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0',
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-sm rounded-xl',
    lg: 'px-8 py-4 text-base rounded-xl',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {/* Ripple effect overlay */}
      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-inherit"></span>
      
      {/* Loading spinner */}
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {/* Button content */}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export default Button;
