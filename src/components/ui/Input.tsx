import React from 'react';

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-serif text-amber-800 mb-1.5 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`
          w-full px-4 py-2.5 font-serif
          bg-white/60 backdrop-blur-sm
          border-2 rounded-xl
          transition-all duration-200
          focus:outline-none
          placeholder:text-gray-300
          text-gray-400
          dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-300 dark:placeholder:text-gray-500
          ${error
            ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-200'
            : 'border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:focus:border-amber-400 dark:focus:ring-amber-400/30'
          }
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500 font-serif">{error}</p>
      )}
    </div>
  );
};

export default Input;
