/**
 * 阿里云验证码 2.0 (SmartCaptcha) 加载器
 *
 * SDK: https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js
 * 接入方式: window.AliyunCaptchaConfig + window.initAliyunCaptcha
 */

declare global {
  interface Window {
    AliyunCaptchaConfig?: { region: string; prefix: string };
    initAliyunCaptcha?: (options: Record<string, unknown>) => void;
    _aliyunCaptchaInstance?: {
      reset: () => void;
      show: () => void;
      hide: () => void;
    };
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
    };
  }
}

// ============ 阿里云验证码 2.0 ============
const ALIYUN_CAPTCHA_SDK = 'https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js';
const SCRIPT_TIMEOUT_MS = 8000;
const INIT_WAIT_MS = 2000;

export const ALIYUN_CAPTCHA_SCENE_ID = import.meta.env.VITE_ALIYUN_CAPTCHA_SCENE_ID || '5muz4qov';
export const ALIYUN_CAPTCHA_PREFIX = import.meta.env.VITE_ALIYUN_CAPTCHA_PREFIX || '1xsr1d';

export const loadTencentCaptcha = async (): Promise<boolean> => {
  if (window.initAliyunCaptcha) return true;

  return new Promise((resolve) => {
    window.AliyunCaptchaConfig = { region: 'cn', prefix: ALIYUN_CAPTCHA_PREFIX };

    if (document.querySelector('script[src*="alicdn.com/captcha-frontend"]')) {
      const check = setInterval(() => { if (window.initAliyunCaptcha) { clearInterval(check); resolve(true); } }, 100);
      setTimeout(() => { clearInterval(check); resolve(!!window.initAliyunCaptcha); }, 2000);
      return;
    }

    const script = document.createElement('script');
    script.src = ALIYUN_CAPTCHA_SDK;
    script.async = true;

    let settled = false;
    const finish = (ok: boolean) => { if (settled) return; settled = true; clearTimeout(timeoutId); clearInterval(checkInterval); if (!ok) script.remove(); resolve(ok); };
    const timeoutId = setTimeout(() => finish(!!window.initAliyunCaptcha), SCRIPT_TIMEOUT_MS);
    const checkInterval = setInterval(() => { if (window.initAliyunCaptcha) finish(true); }, 100);

    script.onload = () => { if (window.initAliyunCaptcha) finish(true); else setTimeout(() => finish(!!window.initAliyunCaptcha), INIT_WAIT_MS); };
    script.onerror = () => finish(false);
    document.head.appendChild(script);
  });
};

export const getCaptchaAppId = (): string => ALIYUN_CAPTCHA_SCENE_ID;

// ============ Cloudflare Turnstile（仅中间页使用）============
const TURNSTILE_CDN_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const loadTurnstile = async (): Promise<boolean> => {
  if (window.turnstile) return true;

  return new Promise((resolve) => {
    if (document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
      const check = setInterval(() => { if (window.turnstile) { clearInterval(check); resolve(true); } }, 100);
      setTimeout(() => { clearInterval(check); resolve(!!window.turnstile); }, 2000);
      return;
    }

    const script = document.createElement('script');
    script.src = TURNSTILE_CDN_URL;
    script.async = true;
    script.defer = true;

    let settled = false;
    const finish = (ok: boolean) => { if (settled) return; settled = true; clearTimeout(timeoutId); clearInterval(checkInterval); if (!ok) script.remove(); resolve(ok); };
    const timeoutId = setTimeout(() => finish(!!window.turnstile), 8000);
    const checkInterval = setInterval(() => { if (window.turnstile) finish(true); }, 100);

    script.onload = () => { if (window.turnstile) finish(true); else setTimeout(() => finish(!!window.turnstile), 2000); };
    script.onerror = () => finish(false);
    document.head.appendChild(script);
  });
};

export const getTurnstileTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
