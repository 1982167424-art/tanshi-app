import React from 'react';
import SearchModal from '@/components/ui/SearchModal';

const Search: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-serif font-semibold text-amber-900 dark:text-gray-100">全局搜索</h2>
      <SearchModal inline />
    </div>
  );
};

export default Search;
