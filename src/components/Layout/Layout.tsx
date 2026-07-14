import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/store/useAuthStore';

const Layout: React.FC = () => {
  const { currentUser, checkTeenModeAge } = useAuthStore();
  const isTeen = currentUser?.isTeenMode;

  React.useEffect(() => {
    checkTeenModeAge();
  }, [checkTeenModeAge]);

  return (
    <div className={`
      min-h-screen flex
      bg-gradient-to-br
      ${isTeen
        ? 'from-orange-50 via-amber-50 to-yellow-50 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#1a1a2e]'
        : 'from-amber-50 via-yellow-50 to-orange-50 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#1a1a2e]'
      }
    `}>
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
