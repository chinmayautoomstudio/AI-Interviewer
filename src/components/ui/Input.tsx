import React from 'react';

interface InputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  id,
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-ai-coral ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`
          block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-ai-teal focus:border-ai-teal
          disabled:bg-ai-cream disabled:text-gray-500 disabled:cursor-not-allowed
          transition-colors duration-200
          ${error 
            ? 'border-ai-coral focus:ring-ai-coral focus:border-ai-coral' 
            : 'border-gray-300'
          }
        `}
      />
      {error && (
        <p className="text-sm text-ai-coral">{error}</p>
      )}
    </div>
  );
};

export default Input;
