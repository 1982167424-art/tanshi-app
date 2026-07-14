import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-amber-900/20 backdrop-blur-sm animate-fade-in dark:bg-black/40"
        onClick={onClose}
      />
      <div className={`
        relative w-full max-w-md
        backdrop-blur-xl bg-white/85 border border-white/50
        dark:bg-[#16213e]/90 dark:border-white/10
        rounded-3xl shadow-2xl shadow-amber-200/50
        dark:shadow-black/30
        animate-bounce-in
        ${className}
      `}>
        <div className="flex items-center justify-between p-5 border-b border-amber-100 dark:border-white/10">
          <h3 className="text-lg font-serif font-semibold text-amber-900 dark:text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-100 transition-colors text-amber-600 dark:hover:bg-white/10 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
