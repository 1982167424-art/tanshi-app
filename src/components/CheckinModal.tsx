import React, { useEffect, useState } from 'react';
import { CheckinResult, NewTitle } from '@/types';

interface Props { result: CheckinResult | null; visible: boolean; onClose: () => void; }

const CheckinModal: React.FC<Props> = ({ result, visible, onClose }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [titleIdx, setTitleIdx] = useState(0);

  useEffect(() => {
    if (visible && result && result.new_titles.length > 0) {
      setShowTitle(false);
      setTitleIdx(0);
      const t = setTimeout(() => setShowTitle(true), 1500);
      return () => clearTimeout(t);
    } else if (visible && result && result.new_titles.length === 0) {
      const t = setTimeout(onClose, 1500);
      return () => clearTimeout(t);
    }
  }, [visible, result, onClose]);

  if (!visible || !result) return null;

  const titles = result.new_titles;
  const current: NewTitle | null = titles[titleIdx] || null;

  const handleTitleConfirm = () => {
    if (titleIdx < titles.length - 1) setTitleIdx(titleIdx + 1);
    else { setShowTitle(false); onClose(); }
  };

  const titleIcon = (type: string) => type === 'milestone' ? '🏆' : type === 'special' ? '💎' : type === 'holiday' ? '🎉' : '⭐';
  const titleTypeLabel = (type: string) => type === 'weekly' ? '周期连签成就' : type === 'milestone' ? '里程碑纪念' : type === 'special' ? '特殊纪念称号（永久）' : '节假日限定';

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ display: visible ? 'flex' : 'none' }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={showTitle ? undefined : onClose} />

        {!showTitle && (
          <div className="relative z-10 animate-slide-up">
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-gradient-radial from-amber-300/40 via-amber-200/20 to-transparent animate-glow-pulse" />
            </div>
            <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl shadow-2xl p-8 max-w-xs w-full text-center border border-amber-200 dark:border-amber-500/20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg animate-bounce-in">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-amber-900 dark:text-amber-100 mb-2">签到成功</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-3xl font-serif font-bold text-orange-500">+{result.points_earned}</span>
                <span className="text-sm text-amber-600 font-serif">积分</span>
              </div>
              {result.auto_renewed && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1 mb-2 dark:bg-amber-900/20 dark:text-amber-300">
                  ✨ 已自动续签（-100积分）
                </p>
              )}
              <div className="flex items-center justify-center gap-4 text-sm font-serif mb-4">
                <span className="text-amber-700 dark:text-amber-300">🔥 连续 {result.streak_days} 天</span>
                <span className="text-amber-300">|</span>
                <span className="text-amber-700 dark:text-amber-300">🏆 累计 {result.total_checkin_days} 天</span>
              </div>
              <div className="pt-3 border-t border-amber-100 dark:border-white/10">
                <span className="text-xs text-amber-500">总积分：<span className="font-bold text-orange-500">{result.total_points}</span></span>
              </div>
            </div>
          </div>
        )}

        {showTitle && current && (
          <div className="relative z-10 animate-slide-up">
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="w-80 h-80 rounded-full bg-gradient-radial from-yellow-300/50 via-amber-200/30 to-transparent animate-glow-burst" />
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-[#1a1a2e] dark:to-[#16213e] rounded-3xl shadow-2xl p-8 max-w-xs w-full text-center border-2 border-amber-300 dark:border-amber-500/30">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-400 flex items-center justify-center shadow-xl animate-bounce-in">
                <span className="text-5xl">{titleIcon(current.type)}</span>
              </div>
              <p className="text-sm text-amber-600 mb-2 dark:text-amber-400">恭喜解锁新称号</p>
              <h3 className="text-2xl font-serif font-bold text-amber-900 mb-3 dark:text-amber-100">{current.name}</h3>
              <p className="text-xs text-amber-500 mb-5 dark:text-amber-400">{titleTypeLabel(current.type)}</p>
              <button onClick={handleTitleConfirm} className="px-8 py-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-serif font-medium shadow-lg">
                {titleIdx < titles.length - 1 ? '查看下一个' : '确认'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CheckinModal;
