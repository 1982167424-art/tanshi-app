import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadTurnstile, getTurnstileTheme } from '../utils/turnstileLoader';

// 跳过验证的安全策略
const SKIP_COOLDOWN_MS = 60 * 60 * 1000; // 1 小时内只能跳过一次

const getSkipRecord = (): number | null => {
  const t = sessionStorage.getItem('tanshi_skip_at');
  return t ? Number(t) : null;
};

const setSkipRecord = () => {
  sessionStorage.setItem('tanshi_skip_at', String(Date.now()));
};

const checkSkipCooldown = (): boolean => {
  const lastSkip = getSkipRecord();
  if (!lastSkip) return true;
  return Date.now() - lastSkip > SKIP_COOLDOWN_MS;
};

const Verify: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/login';
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>('');
  const countdownRef = useRef<number>(0);
  const [status, setStatus] = useState<'loading' | 'verifying' | 'success' | 'error'>('loading');
  const [loadFailed, setLoadFailed] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [skipConfirming, setSkipConfirming] = useState(false);
  const [skipCountdown, setSkipCountdown] = useState(0);
  const [skipBlocked, setSkipBlocked] = useState(false);
  const [skipCooldownRemaining, setSkipCooldownRemaining] = useState('');
  const [rayId] = useState(() => {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 16; i++) id += chars[Math.floor(Math.random() * 16)];
    return id;
  });

  // 页面加载时检查冷却期
  useEffect(() => {
    const lastSkip = getSkipRecord();
    if (lastSkip) {
      const remaining = SKIP_COOLDOWN_MS - (Date.now() - lastSkip);
      if (remaining > 0) {
        setSkipBlocked(true);
        const min = Math.ceil(remaining / 60000);
        setSkipCooldownRemaining(min > 1 ? `${min} 分钟` : '不到 1 分钟');
      }
    }
  }, []);

  // 加载 Turnstile 脚本
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

  // 脚本就绪后渲染 widget
  useEffect(() => {
    if (!scriptReady || !turnstileRef.current || widgetIdRef.current) return;
    if (!window.turnstile) return;

    setStatus('verifying');

    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAD1vYyHUN3U7Rkdz',
      callback: (token: string) => {
        setStatus('success');
        sessionStorage.setItem('turnstile_verified', 'true');
        sessionStorage.setItem('turnstile_token', token);
        setTimeout(() => navigate(from, { replace: true }), 500);
      },
      errorCallback: () => {
        setStatus('error');
      },
      theme: getTurnstileTheme(),
    });
  }, [scriptReady, navigate, from]);

  // 重试
  const handleRetry = useCallback(() => {
    setSkipConfirming(false);
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

  // 跳过验证 —— 第一步：点击"跳过验证"
  const handleSkipRequest = useCallback(() => {
    if (!checkSkipCooldown()) {
      setSkipBlocked(true);
      const remaining = SKIP_COOLDOWN_MS - (Date.now() - getSkipRecord()!);
      const min = Math.ceil(remaining / 60000);
      setSkipCooldownRemaining(min > 1 ? `${min} 分钟` : '不到 1 分钟');
      return;
    }
    setSkipConfirming(true);
    setSkipCountdown(5);
    let count = 5;
    countdownRef.current = window.setInterval(() => {
      count--;
      setSkipCountdown(count);
      if (count <= 0) {
        clearInterval(countdownRef.current);
      }
    }, 1000);
  }, []);

  // 取消跳过
  const handleCancelSkip = useCallback(() => {
    setSkipConfirming(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  // 确认跳过
  const handleSkipConfirm = useCallback(() => {
    if (skipCountdown > 0) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setSkipRecord();
    sessionStorage.setItem('turnstile_verified', 'true');
    navigate(from, { replace: true });
  }, [skipCountdown, navigate, from]);

  // 清理
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    };
  }, []);

  // 是否显示跳过入口（所有非成功状态都显示）
  const canSkip = status !== 'success' && !skipConfirming;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md">
          <h1 className="text-5xl font-normal text-gray-800 dark:text-gray-100 mb-4 tracking-tight">
            textime.top
          </h1>

          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {status === 'success' ? '验证通过' : '正在进行安全验证'}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 text-base mb-8 leading-relaxed">
            本网站使用安全服务防护恶意自动程序。在验证您不是自动程序期间，将显示此页面。
          </p>

          {/* Turnstile 区域 */}
          <div className="mb-4">
            {status === 'loading' && (
              <div className="flex justify-center items-center py-6">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div
              ref={turnstileRef}
              style={{ display: status === 'loading' ? 'none' : 'block' }}
            />
          </div>

          {/* 脚本加载失败 */}
          {loadFailed && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-amber-600 dark:text-amber-400 font-serif">验证组件加载失败</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">可能是网络原因导致验证服务无法加载，请检查网络后重试</p>
              <button
                onClick={handleRetry}
                className="text-amber-500 hover:text-amber-600 font-serif text-sm underline dark:text-amber-400"
              >
                点击重试
              </button>
            </div>
          )}

          {/* 验证错误 */}
          {status === 'error' && (
            <div className="mt-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              验证失败，请刷新页面重试
            </div>
          )}

          {/* 跳过验证入口 —— loading / loadFailed / verifying / error 均显示 */}
          {canSkip && (
            <div className="mt-6 p-5 rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-amber-800 font-serif text-sm mb-2 dark:text-amber-200">
                ⚡ 无法完成验证？
              </p>
              <p className="text-amber-600 text-xs mb-4 dark:text-amber-400">
                {skipBlocked
                  ? `您已在${skipCooldownRemaining}前使用过跳过验证，请等待冷却时间结束后再试，或通过上方验证组件完成验证。`
                  : '如验证组件无法正常加载或完成，您可以跳过验证直接进入登录页。为确保安全，每 1 小时只能跳过一次。'}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {(loadFailed || status === 'error') && (
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 text-amber-600 hover:text-amber-700 font-serif text-sm underline dark:text-amber-400"
                  >
                    重新加载
                  </button>
                )}
                <button
                  onClick={handleSkipRequest}
                  disabled={skipBlocked}
                  className={`px-5 py-2 rounded-lg font-serif text-sm transition-all ${
                    skipBlocked
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                      : 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm'
                  }`}
                >
                  跳过验证
                </button>
              </div>
            </div>
          )}

          {/* 二次确认 —— 防误触 + 倒计时 */}
          {skipConfirming && (
            <div className="mt-6 p-6 rounded-xl border-2 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/30">
              <p className="text-amber-900 font-serif font-semibold mb-3 dark:text-amber-100">
                ⚠️ 确认你是真人？
              </p>
              <p className="text-amber-700 text-sm mb-5 leading-relaxed dark:text-amber-300">
                跳过验证将直接进入登录页面。为确保安全，每 1 小时只能跳过一次。
                自动程序请勿尝试滥用。
              </p>
              {skipCountdown > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <span className="text-amber-600 font-serif dark:text-amber-400">
                    {skipCountdown} 秒后可确认
                  </span>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelSkip}
                    className="flex-1 py-2.5 rounded-xl border border-amber-300 text-amber-700 font-serif hover:bg-amber-100 transition-colors dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-800/40"
                  >
                    返回验证
                  </button>
                  <button
                    onClick={handleSkipConfirm}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-serif hover:bg-amber-600 active:bg-amber-700 transition-colors shadow-sm"
                  >
                    确认跳过
                  </button>
                </div>
              )}
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
