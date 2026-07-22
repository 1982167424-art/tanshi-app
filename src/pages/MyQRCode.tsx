import React, { useEffect, useState } from 'react';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import GlassCard from '@/components/ui/GlassCard';
import QRCode from 'qrcode';

const MyQRCode: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const [qrUrl, setQrUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) return;
    QRCode.toDataURL(currentUser.uid, {
      width: 256,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(url => {
      setQrUrl(url);
    }).catch(err => {
      console.error('QR generate error:', err);
      setError('二维码生成失败');
    });
  }, [currentUser]);

  const handleDownload = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.download = `tanshi-qr-${currentUser?.uid}.png`;
    link.href = qrUrl;
    link.click();
  };

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 mb-4 font-serif text-sm">
        <ArrowLeft size={16} /> 返回
      </button>
      <GlassCard className="p-8 flex flex-col items-center">
        <h2 className="text-xl font-serif font-bold text-amber-900 mb-2 dark:text-gray-100">我的二维码</h2>
        <p className="text-sm text-orange-500 mb-6 dark:text-gray-400">让朋友扫描添加你</p>
        <div className="w-64 h-64 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-orange-100 dark:border-white/10">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : qrUrl ? (
            <img src={qrUrl} alt="我的二维码" className="rounded-xl" />
          ) : (
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <div className="mt-2 text-center">
          <p className="text-lg font-serif font-semibold text-amber-900 dark:text-gray-100">{currentUser?.username}</p>
          <p className="text-xs text-orange-500 dark:text-gray-400">UID: {currentUser?.uid}</p>
        </div>
        <div className="flex gap-3 mt-6 w-full">
          <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-200 text-orange-700 font-serif text-sm hover:bg-orange-50 transition-colors dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5">
            <Download size={16} /> 保存图片
          </button>
          <button onClick={() => { navigator.clipboard.writeText(currentUser?.uid || ''); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-200 text-orange-700 font-serif text-sm hover:bg-orange-50 transition-colors dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5">
            <Share2 size={16} /> 复制 UID
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default MyQRCode;
