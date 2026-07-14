import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

interface TurnstileProps {
  siteKey: string;
  onToken: (token: string) => void;
  onError?: () => void;
  className?: string;
}

interface TurnstileHandle {
  reset: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          errorCallback?: () => void;
          theme?: 'light' | 'dark';
        }
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(({ siteKey, onToken, onError, className }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkTurnstile = () => {
      if (window.turnstile) {
        setIsReady(true);
      } else {
        setTimeout(checkTurnstile, 100);
      }
    };
    checkTurnstile();
  }, []);

  const renderWidget = useCallback(() => {
    if (!isReady || !containerRef.current || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile!.render(containerRef.current, {
      sitekey: siteKey,
      callback: onToken,
      errorCallback: onError,
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
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

  useEffect(() => {
    const handleThemeChange = () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    };
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleThemeChange);
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleThemeChange);
    };
  }, []);

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  useImperativeHandle(ref, () => ({ reset }));

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
