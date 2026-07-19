/**
 * Cloudflare Turnstile 脚本加载器
 *
 * 设计原则：
 * - 快速失败：单次尝试 + 8s 超时，失败立即返回（不长时间转圈）
 * - 手动重试：失败后由 UI 层显示重试按钮，不自动跳过验证
 * - 官方 CDN：必须从 challenges.cloudflare.com 加载（脚本内部会自验证 src）
 *
 * 关于 CDN 选择：
 * Turnstile 脚本内部用正则 ^https://challenges.cloudflare.com/turnstile/v0/api.js
 * 校验 <script> 标签的 src，任何第三方 CDN 或本地副本都会导致脚本抛出 43777 错误。
 * 因此官方 CDN 是唯一可用源，无法替换为其他"优质 CDN"。
 * Cloudflare 自身就是全球 CDN，textime.top 已走 Cloudflare 代理，
 * 能访问 textime.top = 能访问 Cloudflare 边缘节点 = 能访问 challenges.cloudflare.com。
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

// Cloudflare Turnstile 官方 CDN（render=explicit：仅主动 render，避免自动扫描）
const TURNSTILE_CDN_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
// 单次加载超时：8 秒（快速失败，不让用户长时间转圈）
const SCRIPT_TIMEOUT_MS = 8000;
// 脚本加载后 turnstile 对象初始化的等待时间
const INIT_WAIT_MS = 2000;

export const loadTurnstile = async (): Promise<boolean> => {
  if (window.turnstile) return true;

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_CDN_URL;
    script.async = true;
    script.defer = true;

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      clearInterval(checkInterval);
      if (!ok) script.remove();
      resolve(ok);
    };

    // 单次超时：8 秒后快速失败
    const timeoutId = setTimeout(() => {
      finish(!!window.turnstile);
    }, SCRIPT_TIMEOUT_MS);

    // 轮询检查 turnstile 对象（脚本加载后可能需要一点时间初始化）
    const checkInterval = setInterval(() => {
      if (window.turnstile) finish(true);
    }, 100);

    script.onload = () => {
      if (window.turnstile) {
        finish(true);
      } else {
        // 脚本已加载，给 2 秒让 turnstile 对象初始化
        setTimeout(() => finish(!!window.turnstile), INIT_WAIT_MS);
      }
    };

    script.onerror = () => {
      finish(false);
    };

    document.head.appendChild(script);
  });
};

export const getTurnstileTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
