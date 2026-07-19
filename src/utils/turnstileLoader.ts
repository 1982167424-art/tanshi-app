/**
 * Cloudflare Turnstile 脚本加载器（国内 CDN 代理版）
 *
 * 核心思路：
 * 1. 通过 Vercel rewrite 将 challenges.cloudflare.com 代理到 /cf-turnstile/*（同源）
 * 2. 加载 api.js 前，monkey-patch iframe src，让 Turnstile 创建的 iframe 也走代理
 * 3. monkey-patch postMessage origin，让 api.js 的 origin 校验通过
 * 4. 国内手机无代理时也能加载验证组件
 *
 * 容错策略：
 * - 优先走同源代理（/cf-turnstile/），失败回退官方 CDN，再失败回退后端代理
 * - 每个源最多重试 3 次，间隔递增
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

const PROXY_BASE = '/cf-turnstile';
const CF_ORIGIN = 'https://challenges.cloudflare.com';

// 同源代理（Vercel rewrite → challenges.cloudflare.com）
const PRIMARY_URL = `${PROXY_BASE}/turnstile/v0/api.js?render=explicit`;
// 官方 CDN（有代理时直连）
const SECONDARY_URL = `${CF_ORIGIN}/turnstile/v0/api.js?render=explicit`;

const SCRIPT_TIMEOUT_MS = 12000;
const MAX_RETRY = 3;
const RETRY_DELAYS_MS = [1000, 2000, 3000];

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ============ Monkey-patch: iframe src 重写 ============
let patched = false;

const installPatches = () => {
  if (patched) return;
  patched = true;

  // 1. 拦截 iframe.src 属性赋值
  const srcDescriptor = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
  if (srcDescriptor && srcDescriptor.set && srcDescriptor.get) {
    const originalSet = srcDescriptor.set;
    const originalGet = srcDescriptor.get;
    Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
      set(this: HTMLIFrameElement, value: string) {
        if (typeof value === 'string' && value.includes('challenges.cloudflare.com')) {
          value = value.replace(CF_ORIGIN, PROXY_BASE);
        }
        originalSet.call(this, value);
      },
      get(this: HTMLIFrameElement) {
        return originalGet.call(this);
      },
      configurable: true,
    });
  }

  // 2. 拦截 setAttribute('src', ...)
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (this: Element, name: string, value: string) {
    if (
      this instanceof HTMLIFrameElement &&
      name.toLowerCase() === 'src' &&
      typeof value === 'string' &&
      value.includes('challenges.cloudflare.com')
    ) {
      value = value.replace(CF_ORIGIN, PROXY_BASE);
    }
    return originalSetAttribute.call(this, name, value);
  };

  // 3. MutationObserver: 捕获通过 innerHTML/insertAdjacentHTML 创建的 iframe
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLIFrameElement) {
          rewriteIframeSrc(node);
        }
        if (node instanceof Element) {
          node.querySelectorAll?.('iframe').forEach(rewriteIframeSrc);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // 4. 拦截 postMessage origin 校验
  //    iframe 走代理后 origin 变为当前页 origin，需伪装为 challenges.cloudflare.com
  const originalAddEventListener = window.addEventListener.bind(window);
  (window as any).addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    if (type === 'message') {
      const wrapped = function (this: unknown, event: MessageEvent) {
        if (event.origin === window.location.origin) {
          try {
            Object.defineProperty(event, 'origin', {
              value: CF_ORIGIN,
              configurable: true,
            });
          } catch {
            // 如果不可配置就跳过
          }
        }
        if (typeof listener === 'function') {
          return (listener as (e: MessageEvent) => void)(event);
        }
        return (listener as EventListenerObject).handleEvent(event);
      };
      return originalAddEventListener(type, wrapped, options);
    }
    return originalAddEventListener(type, listener, options);
  };
};

const rewriteIframeSrc = (iframe: HTMLIFrameElement) => {
  const src = iframe.getAttribute('src');
  if (src && src.includes('challenges.cloudflare.com')) {
    iframe.setAttribute('src', src.replace(CF_ORIGIN, PROXY_BASE));
  }
};

// ============ 脚本加载 ============

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

const loadWithRetry = async (url: string): Promise<boolean> => {
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    if (window.turnstile) return true;
    const ok = await loadScriptOnce(url);
    if (ok && window.turnstile) return true;
    if (attempt < MAX_RETRY - 1) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }
  return false;
};

/**
 * 加载 Turnstile 脚本
 * 1. 同源代理（国内可用） → 2. 官方 CDN（有代理可用） → 3. 全部失败返回 false
 */
export const loadTurnstile = async (): Promise<boolean> => {
  if (window.turnstile) return true;

  // 安装 monkey-patch（仅一次）
  installPatches();

  // 源 1：同源代理（Vercel rewrite → challenges.cloudflare.com）
  if (await loadWithRetry(PRIMARY_URL)) return true;

  // 源 2：官方 CDN（用户开了代理时可用）
  if (await loadWithRetry(SECONDARY_URL)) return true;

  return false;
};

export const getTurnstileTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
