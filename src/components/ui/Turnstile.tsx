import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { loadTurnstile, getTurnstileTheme } from '../../utils/turnstileLoader';

interface TurnstileProps {
  siteKey: string;
  onToken: (token: string) => void;
  onError?: () => void;
  className?: string;
}

interface TurnstileHandle {
  reset: () => void;
}

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(({ siteKey, onToken, onError, className }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>('');
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const init = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    const success = await loadTurnstile();
    setIsLoading(false);
    if (success) {
      setIsReady(true);
    } else {
      setLoadFailed(true);
      onError?.();
    }
  }, [onError]);

  useEffect(() => {
    init();
  }, [init]);

  const renderWidget = useCallback(() => {
    if (!isReady || !containerRef.current || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile!.render(containerRef.current, {
      sitekey: siteKey,
      callback: onToken,
      errorCallback: onError,
      theme: getTurnstileTheme(),
    });
  }, [isReady, siteKey, onToken, onError]);

  useEffect(() => {
    renderWidget();
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    };
  }, [renderWidget]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    };
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  useImperativeHandle(ref, () => ({ reset }));

  if (isLoading) {
    return (
      <div className={`${className || 'w-full'} flex justify-center items-center py-6`}>
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div className={`${className || 'w-full'} flex flex-col items-center gap-3 py-6`}>
        <p className="text-amber-600 font-serif dark:text-amber-400">验证组件加载失败</p>
        <button
          onClick={init}
          className="text-amber-500 hover:text-amber-600 font-serif text-sm underline dark:text-amber-400"
        >
          点击重试
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className || 'w-full'}
      data-turnstile-widget
    />
  );
});

Turnstile.displayName = 'Turnstile';

export default Turnstile;
