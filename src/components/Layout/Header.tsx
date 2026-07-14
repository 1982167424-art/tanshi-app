import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { getGreeting } from '@/utils/date';
import SearchModal from '@/components/ui/SearchModal';

interface HeaderProps {
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { currentUser } = useAuthStore();
  const isTeen = currentUser?.isTeenMode;
  const [showSearch, setShowSearch] = useState(false);

  const greeting = getGreeting();
  const displayTitle = title || `${greeting}，${currentUser?.username} ☀️`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className={`
        sticky top-0 z-30 px-6 lg:px-10 py-5
        backdrop-blur-xl bg-white/30
        border-b border-amber-200/40
        dark:bg-[#16213e]/30 dark:border-white/10
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className={`
              text-xl lg:text-2xl font-serif font-semibold
              ${isTeen ? 'text-orange-900 dark:text-gray-100' : 'text-amber-900 dark:text-gray-100'}
            `}>
              {displayTitle}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(true)}
              className={`
                p-2.5 rounded-xl transition-all duration-200
                flex items-center gap-2
                ${isTeen
                  ? 'bg-orange-100/50 hover:bg-orange-200/60 border border-orange-200/50 text-orange-700 dark:bg-[#0f3460]/30 dark:border-white/10 dark:text-gray-300 dark:hover:bg-[#0f3460]/50'
                  : 'bg-amber-100/50 hover:bg-amber-200/60 border border-amber-200/50 text-amber-700 dark:bg-[#0f3460]/30 dark:border-white/10 dark:text-gray-300 dark:hover:bg-[#0f3460]/50'
                }
              `}
              title="搜索 (Cmd+K / Ctrl+K)"
            >
              <Search size={18} />
              <span className="hidden sm:inline text-sm font-serif dark:text-gray-300">搜索</span>
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-white/60 text-[10px] font-sans border border-amber-200/50 dark:bg-[#1a1a2e]/60 dark:border-white/10 dark:text-gray-400">
                ⌘K
              </kbd>
            </button>
            <div className="text-sm font-serif text-amber-600 dark:text-gray-400">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>
        </div>
      </header>
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
};

export default Header;
