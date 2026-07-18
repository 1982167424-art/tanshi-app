/**
 * Cloudflare Turnstile 脚本加载器
 *
 * 容错策略（与 API 请求重试机制一致）：
 * 1. 多源回退：官方 CDN → 后端代理（/api/turnstile/script）
 * 2. 自动重试：每个源最多 3 次，间隔递增（1s/2s/3s）
 * 3. 长超时：单次 12s，避免弱网误判
 *
 * 注意：Turnstile 脚本内部会自验证 <script> 标签的 src，
 * 必须从 https://challenges.cloudflare.com/turnstile/v0/api.js 加载，
 * 因此后端代理方式实际无法让脚本正常初始化，仅作为网络探测的兜底。
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: Record<string, unknown>
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

// 官方 CDN（render=explicit：仅通过 window.turnstile.render() 主动渲染）
const PRIMARY_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
// 后端代理（Railway 部署在美国，可访问 Cloudflare；仅作网络兜底）
const FALLBACK_URL = '/api/turnstile/script';

const SCRIPT_TIMEOUT_MS = 12000;
const MAX_RETRY = 3;
const RETRY_DELAYS_MS = [1000, 2000, 3000];

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

const loadScriptOnce = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.defer = true;

    const timeoutId = setTimeout(() => {
      if (!window.turnstile) {
        script.remove();
        resolve(false);
      }
    }, SCRIPT_TIMEOUT_MS);

    script.onload = () => {
      clearTimeout(timeoutId);
      if (window.turnstile) {
        resolve(true);
        return;
      }
      // 脚本已加载，turnstile 对象可能稍后初始化，轮询等待
      const check = setInterval(() => {
        if (window.turnstile) {
          clearInterval(check);
          resolve(true);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        resolve(!!window.turnstile);
      }, 3000);
    };

    script.onerror = () => {
      clearTimeout(timeoutId);
      script.remove();
      resolve(false);
    };

    document.head.appendChild(script);
  });
};

/**
 * 对单个 URL 进行多次重试加载
 */
const loadWithRetry = async (url: string): Promise<boolean> => {
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    if (window.turnstile) return true;
    const ok = await loadScriptOnce(url);
    if (ok && window.turnstile) return true;
    // 未成功，按递增间隔重试
    if (attempt < MAX_RETRY - 1) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
  return false;
};

/**
 * 加载 Turnstile 脚本，多源 + 重试容错
 * 仅当所有源、所有重试都失败时才返回 false
 */
export const loadTurnstile = async (): Promise<boolean> => {
  if (window.turnstile) return true;

  // 源 1：官方 CDN（必须，脚本会自验证 src）
  if (await loadWithRetry(PRIMARY_URL)) return true;

  // 源 2：后端代理（兜底，但因 src 自验证限制，仅作网络可达性兜底）
  if (await loadWithRetry(FALLBACK_URL)) return true;

  return false;
};

export const getTurnstileTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
