import React from 'react';
import BottomSheet from '@/components/ui/BottomSheet';
import { learningPlatforms, openPlatform } from '@/utils/platforms';

interface Props { visible: boolean; onClose: () => void; }

const LearningSheet: React.FC<Props> = ({ visible, onClose }) => (
  <BottomSheet visible={visible} onClose={onClose} title="学习平台">
    <div className="grid grid-cols-3 gap-3">
      {learningPlatforms.map((p) => (
        <button
          key={p.id}
          onClick={() => { openPlatform(p); onClose(); }}
          className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-amber-50 dark:hover:bg-white/5 transition-colors"
        >
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-xl font-bold shadow-sm`}>
            {p.name.charAt(0)}
          </div>
          <span className="text-xs text-amber-800 dark:text-gray-300 font-serif text-center leading-tight">{p.name}</span>
        </button>
      ))}
    </div>
  </BottomSheet>
);

export default LearningSheet;
