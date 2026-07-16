import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadTurnstile, getTurnstileTheme } from '../utils/turnstileLoader';

const Verify: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/login';
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>('');
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error'>('loading');
  const [loadFailed, setLoadFailed] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [rayId] = useState(() => {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * 16)];
    return id;
  });

  // 跳过验证（降级方案）
  const skipVerification = useCallback(() => {
    sessionStorage.setItem('turnstile_verified', 'true');
    navigate(from, { replace: true });
  }, [navigate, from]);

  // 第一步：加载脚本
  useEffect(() => {
    const loadScript = async () => {
      const success = await loadTurnstile();
      if (success) {
        setScriptReady(true);
      } else {
        setLoadFailed(true);
      }
    };
    loadScript();
  }, []);

  // 加载失败后 3 秒自动跳过验证（降级方案）
  useEffect(() => {
    if (!loadFailed) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem('turnstile_verified', 'true');
      navigate(from, { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [loadFailed, navigate, from]);

  // 第二步：脚本就绪后渲染 widget（此时 DOM 中容器 div 已存在）
  useEffect(() => {
    if (!scriptReady || !turnstileRef.current || widgetIdRef.current) return;
    if (!window.turnstile) return;

    setStatus('verifying');
    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAD1vYyHUN3U7Rkdz',
      callback: () => {
        setStatus('success');
        sessionStorage.setItem('turnstile_verified', 'true');
        setTimeout(() => navigate(from, { replace: true }), 500);
      },
      errorCallback: () => setStatus('error'),
      theme: getTurnstileTheme(),
    });
  }, [scriptReady, navigate, from]);

  // 重试
  const handleRetry = useCallback(() => {
    widgetIdRef.current = '';
    setScriptReady(false);
    setLoadFailed(false);
    setStatus('loading');
    loadTurnstile().then(success => {
      if (success) {
        setScriptReady(true);
      } else {
        setLoadFailed(true);
      }
    });
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-md">
          <h1 className="text-5xl font-normal text-gray-800 dark:text-gray-100 mb-4 tracking-tight">
            textime.top
          </h1>

          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {status === 'success' ? '验证通过' : '正在进行安全验证'}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 text-base mb-10 leading-relaxed">
            本网站使用安全服务防护恶意自动程序。在验证您不是自动程序期间，将显示此页面。
          </p>

          {/* 容器始终存在，用 CSS 控制显隐 */}
          <div className="mb-4">
            {status === 'loading' && (
              <div className="flex justify-center items-center py-6">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {/* Turnstile 容器：始终在 DOM 中，加载中时隐藏 */}
            <div
              ref={turnstileRef}
              style={{ display: status === 'loading' ? 'none' : 'block' }}
            />
          </div>

          {loadFailed && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-amber-600 dark:text-amber-400 font-serif">验证组件加载失败</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">3 秒后将自动跳过验证...</p>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="text-amber-500 hover:text-amber-600 font-serif text-sm underline dark:text-amber-400"
                >
                  点击重试
                </button>
                <button
                  onClick={skipVerification}
                  className="text-gray-500 hover:text-gray-600 font-serif text-sm underline dark:text-gray-400"
                >
                  立即跳过
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              验证失败，请刷新页面重试
            </div>
          )}
        </div>
      </div>

      <div className="py-8 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-md mx-auto text-center">
          <div className="text-xs text-gray-400">
            Ray ID: <span className="text-gray-600 dark:text-gray-400">{rayId}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            由 <span className="text-orange-500 font-medium">Cloudflare</span> 提供的性能和安全服务
            <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
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
