import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Verify: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/login';
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>('');
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error'>('loading');
  const [rayId] = useState(() => {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * 16)];
    return id;
  });

  useEffect(() => {
    const loadTurnstile = () => {
      if (window.turnstile && turnstileRef.current) {
        setStatus('verifying');
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAD1vYyHUN3U7Rkdz',
          callback: () => {
            setStatus('success');
            sessionStorage.setItem('turnstile_verified', 'true');
            setTimeout(() => navigate(from, { replace: true }), 500);
          },
          errorCallback: () => setStatus('error'),
          theme: 'light',
        } as any);
      } else {
        setTimeout(loadTurnstile, 100);
      }
    };
    loadTurnstile();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    };
  }, [navigate, from]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          <h1 className="text-5xl font-normal text-gray-800 mb-4 tracking-tight">
            textime.top
          </h1>

          <h2 className="text-3xl font-semibold text-gray-800 mb-4">
            {status === 'success' ? '验证通过' : '正在进行安全验证'}
          </h2>

          <p className="text-gray-600 text-base mb-10 leading-relaxed">
            本网站使用安全服务防护恶意自动程序。在验证您不是自动程序期间，将显示此页面。
          </p>

          <div className="mb-4">
            <div ref={turnstileRef} />
          </div>

          {status === 'error' && (
            <div className="mt-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
              验证失败，请刷新页面重试
            </div>
          )}
        </div>
      </div>

      <div className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-md mx-auto text-center">
          <div className="text-xs text-gray-400">
            Ray ID: <span className="text-gray-600">{rayId}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            由 <span className="text-orange-500 font-medium">Cloudflare</span> 提供的性能和安全服务
            <span className="mx-2 text-gray-300">|</span>
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              隐私
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;