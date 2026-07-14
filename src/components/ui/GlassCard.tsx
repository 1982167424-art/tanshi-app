import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        backdrop-blur-md bg-white/60 border border-white/40 
        dark:bg-[#16213e]/60 dark:border-white/10
        rounded-2xl shadow-lg shadow-amber-100/50
        dark:shadow-black/20
        ${hover ? 'transition-all duration-300 hover:shadow-xl hover:shadow-amber-200/60 hover:-translate-y-1 cursor-pointer dark:hover:shadow-black/30' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
