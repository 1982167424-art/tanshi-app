/**
 * Cloudflare Turnstile 脚本加载器
 * 多 CDN 降级机制，提升国内访问稳定性
 */

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

// CDN 列表：主CDN（Cloudflare 官方）+ 备用CDN（unpkg）
// 注意：jsDelivr 在国内也被墙，改用 unpkg
const CDN_URLS = [
  'https://challenges.cloudflare.com/turnstile/v0/api.js',
  'https://unpkg.com/@cloudflare/turnstile@0.6.4/dist/turnstile.js',
];

const SCRIPT_TIMEOUT_MS = 15000;

/**
 * 加载单个脚本文件
 */
const loadScript = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      if (window.turnstile) {
        resolve();
        return;
      }
      const check = setInterval(() => {
        if (window.turnstile) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        reject(new Error('Timeout'));
      }, SCRIPT_TIMEOUT_MS);
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);

    setTimeout(() => {
      if (!window.turnstile) {
        script.remove();
        reject(new Error('Timeout'));
      }
    }, SCRIPT_TIMEOUT_MS);
  });
};

/**
 * 加载 Turnstile 脚本，自动按 CDN 列表降级
 * @returns 是否加载成功
 */
export const loadTurnstile = async (): Promise<boolean> => {
  if (window.turnstile) return true;

  for (const url of CDN_URLS) {
    try {
      await loadScript(url);
      if (window.turnstile) return true;
    } catch {
      // 当前 CDN 失败，尝试下一个
      continue;
    }
  }
  return false;
};

/**
 * 获取当前主题（用于 Turnstile 渲染）
 */
export const getTurnstileTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
