import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { loadTencentCaptcha, ALIYUN_CAPTCHA_SCENE_ID } from '@/utils/turnstileLoader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaInitializing, setCaptchaInitializing] = useState(false);
  const captchaInitRef = useRef(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  // SDK 加载后立即初始化验证码（绑定按钮）
  useEffect(() => {
    loadTencentCaptcha().then(ok => {
      if (ok) {
        setCaptchaReady(true);
      } else {
        setCaptchaFailed(true);
      }
    });
  }, []);

  // SDK 就绪后绑定验证码到按钮
  useEffect(() => {
    if (!captchaReady || !window.initAliyunCaptcha || captchaInitRef.current) return;
    captchaInitRef.current = true;
    setCaptchaInitializing(true);

    window.initAliyunCaptcha({
      SceneId: ALIYUN_CAPTCHA_SCENE_ID,
      mode: 'popup',
      element: '#aliyun-captcha-element-login',
      button: '#captcha-trigger-btn-login',
      success: (captchaVerifyParam: string) => {
        setCaptchaToken(captchaVerifyParam);
        setCaptchaVerified(true);
        setError('');
      },
      fail: (result: unknown) => {
        console.error('[AliCaptcha] 验证失败:', result);
      },
      getInstance: (instance: unknown) => {
        window._aliyunCaptchaInstance = instance as any;
      },
    });
  }, [captchaReady]);

  const handleRetry = () => {
    captchaInitRef.current = false;
    setCaptchaReady(false);
    setCaptchaFailed(false);
    setCaptchaInitializing(false);
    loadTencentCaptcha().then(ok => {
      if (ok) setCaptchaReady(true);
      else setCaptchaFailed(true);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!captchaVerified && !captchaFailed) { setError('请先完成人机验证'); return; }
    if (accessCode.trim() && (!username.trim() || !password)) { setError('填写访问口令时，用户名和密码也必须填写'); return; }
    setLoading(true);
    try {
      const result = await login(username, password, accessCode.trim() || undefined, captchaToken || undefined);
      if (result.success) { navigate('/'); } else { setError(result.message); }
    } catch { setError('登录失败，请稍后重试'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#1a1a2e]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-amber-300/30 rounded-full blur-3xl animate-float dark:bg-blue-300/10" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-orange-300/30 rounded-full blur-3xl animate-float dark:bg-purple-300/10" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl dark:bg-blue-300/5" />
      </div>
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-amber-900 dark:text-gray-100">探时</h1>
        </div>
        <GlassCard className="p-8">
          <h2 className="text-2xl font-serif font-semibold text-amber-900 mb-6 text-center dark:text-gray-100">登录</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="用户名" value={username} onChange={setUsername} placeholder="请输入用户名" />
            <Input label="密码" type="password" value={password} onChange={setPassword} placeholder="请输入密码" />
            <Input label="访问口令（选填）" type="password" value={accessCode} onChange={setAccessCode} placeholder="选填，用于增强账号安全" />
            <div className="flex flex-col items-center gap-2">
              {captchaVerified ? (
                <div className="flex items-center gap-2 text-green-600 text-xs dark:text-green-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  验证通过
                </div>
              ) : captchaReady ? (
                <>
                  {/* 这个按钮被 SDK 绑定，点击后自动弹出验证码 */}
                  <button type="button" id="captcha-trigger-btn-login" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors text-amber-700 text-sm dark:bg-[#0f3460]/50 dark:border-amber-400/30 dark:text-amber-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    点击进行人机验证
                  </button>
                  {/* 隐藏的容器，SDK 在这里面渲染 */}
                  <div id="aliyun-captcha-element-login" className="hidden" />
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-amber-500 text-xs">验证组件加载中...</p>
                </div>
              )}
              {captchaFailed && !captchaVerified && (
                <div className="flex gap-3">
                  <button type="button" onClick={handleRetry} className="text-amber-500 text-xs underline hover:text-amber-600">重试</button>
                  <button type="button" onClick={() => setCaptchaFailed(true)} className="text-amber-700 text-xs font-semibold dark:text-amber-300">跳过验证 →</button>
                </div>
              )}
            </div>
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-serif text-center dark:bg-red-900/20 dark:border-red-900/30">{error}</div>}
            <Button type="submit" className="w-full" size="lg" disabled={loading || (!captchaVerified && !captchaFailed)}>{loading ? '登录中...' : '登 录'}</Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-amber-700 font-serif dark:text-gray-400">还没有账号？<Link to="/register" className="text-amber-600 hover:text-amber-800 font-semibold ml-1 transition-colors dark:text-amber-400 dark:hover:text-amber-300">立即注册</Link></p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Login;
