import React from 'react';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ visible, onClose, title, children }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#1a1a2e] rounded-t-3xl shadow-2xl animate-slide-up z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-amber-100 dark:border-white/10">
          <h3 className="text-lg font-serif font-semibold text-amber-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-amber-400 hover:text-amber-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default BottomSheet;
