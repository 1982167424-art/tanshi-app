import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { loadTencentCaptcha, ALIYUN_CAPTCHA_SCENE_ID } from '@/utils/turnstileLoader';
import { calculateAge } from '@/utils/date';
import { api } from '@/utils/api';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Shield, Heart, Copy, Check } from 'lucide-react';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [isUnderFourteen, setIsUnderFourteen] = useState(false);
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [generatedAccessCode, setGeneratedAccessCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReady, setCaptchaReady] = useState(false);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const captchaInitRef = useRef(false);
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [smsSending, setSmsSending] = useState(false);
  const [smsVerified, setSmsVerified] = useState(false);

  const { register } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadTencentCaptcha().then(ok => { if (ok) setCaptchaReady(true); else setCaptchaFailed(true); });
  }, []);

  useEffect(() => {
    if (!captchaReady || !window.initAliyunCaptcha || captchaInitRef.current) return;
    captchaInitRef.current = true;
    window.initAliyunCaptcha({
      SceneId: ALIYUN_CAPTCHA_SCENE_ID,
      mode: 'popup',
      element: '#aliyun-captcha-element-register',
      button: '#captcha-trigger-btn-register',
      success: (captchaVerifyParam: string) => { setCaptchaToken(captchaVerifyParam); setCaptchaVerified(true); setError(''); },
      fail: (result: unknown) => { console.error('[AliCaptcha] 验证失败:', result); },
    });
  }, [captchaReady]);

  const validatePassword = (pwd: string): { valid: boolean; message: string } => {
    if (pwd.length < 8) return { valid: false, message: '密码至少需要8位' };
    if (!/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(pwd))
      return { valid: false, message: '密码需要包含字母、数字和符号' };
    return { valid: true, message: '' };
  };

  const handlePasswordBlur = () => { setPasswordTouched(true); setPasswordError(password ? validatePassword(password).message : ''); };

  const handleSendSms = async () => {
    if (!phone.trim()) { setError('请输入手机号'); return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { setError('手机号格式不正确'); return; }
    setSmsSending(true);
    try {
      await api.verify.sendSms(phone);
      setSmsCountdown(60);
      const timer = setInterval(() => {
        setSmsCountdown(prev => { if (prev <= 1) { clearInterval(timer); return 0; } return prev - 1; });
      }, 1000);
    } catch (e: any) { setError(e.message || '发送失败'); }
    setSmsSending(false);
  };

  // 输入6位验证码时自动校验
  const lastVerifiedCode = useRef('');
  const handleSmsCodeChange = async (val: string) => {
    setSmsCode(val);
    setError('');
    // 同一个验证码不需要重复校验
    if (val.length === 6 && val !== lastVerifiedCode.current && /^1[3-9]\d{9}$/.test(phone)) {
      setSmsVerified(false);
      try {
        await api.verify.verifySms(phone, val);
        setSmsVerified(true);
        lastVerifiedCode.current = val;
        setError('');
      } catch (e: any) {
        setSmsVerified(false);
        lastVerifiedCode.current = '';
        setError(e.message || '验证码不正确');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!captchaVerified && !captchaFailed) { setError('请先完成人机验证'); return; }
    if (!phone.trim()) { setError('请输入手机号'); return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { setError('手机号格式不正确'); return; }
    if (!smsCode.trim()) { setError('请输入验证码'); return; }
    if (!smsVerified) { setError('请先验证手机号'); return; }
    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
    if (!birthday) { setError('请选择出生日期'); return; }
    setIsUnderFourteen(calculateAge(birthday) < 14); setShowAgeModal(true);
  };

  const confirmRegistration = async () => {
    setLoading(true); setShowAgeModal(false);
    try {
      const result = await register(username, password, birthday, captchaToken || undefined, undefined, phone, smsCode);
      if (result.success && result.accessCode) { setGeneratedAccessCode(result.accessCode); setShowAccessCodeModal(true); }
      else setError(result.message);
    } catch (e: any) { setError(e.message || '注册失败，请稍后重试'); } finally { setLoading(false); }
  };

  const handleCopyCode = async () => {
    try { await navigator.clipboard.writeText(generatedAccessCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {
      const t = document.createElement('textarea'); t.value = generatedAccessCode; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  const goToLogin = () => { setShowAccessCodeModal(false); navigate('/login'); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#1a1a2e]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-20 w-72 h-72 bg-amber-300/30 rounded-full blur-3xl animate-float dark:bg-blue-300/10" />
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-orange-300/30 rounded-full blur-3xl animate-float dark:bg-purple-300/10" style={{ animationDelay: '1.5s' }} />
      </div>
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-6"><h1 className="text-4xl font-serif font-bold text-amber-900 dark:text-gray-100">探时</h1></div>
        <GlassCard className="p-8">
          <h2 className="text-2xl font-serif font-semibold text-amber-900 mb-6 text-center dark:text-gray-100">创建账号</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="用户名" value={username} onChange={setUsername} placeholder="" />
            <Input label="密码" type="password" value={password} onChange={setPassword} onBlur={handlePasswordBlur} placeholder="至少8位" error={passwordTouched ? passwordError : ''} />
            <Input label="确认密码" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="再次输入密码" />
            <Input label="出生日期" type="date" value={birthday} onChange={setBirthday} max={new Date().toISOString().split('T')[0]} />
            <div>
              <Input label="手机号" value={phone} onChange={setPhone} placeholder="请输入手机号" />
              <p className="text-xs text-orange-400 font-serif mt-1 dark:text-gray-500">仅用于验证身份，不会发送营销短信</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input label="短信验证码" value={smsCode} onChange={handleSmsCodeChange} placeholder="6位验证码" />
              </div>
              <div className="flex-shrink-0">
                <button type="button" onClick={handleSendSms} disabled={smsCountdown > 0 || smsSending || !phone.trim()}
                  className={`mt-6 px-3 py-2.5 rounded-xl text-xs font-serif whitespace-nowrap transition-all ${smsCountdown > 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20'}`}>
                  {smsCountdown > 0 ? `${smsCountdown}s` : smsSending ? '发送中...' : '获取验证码'}
                </button>
              </div>
            </div>
            {smsVerified && <p className="text-xs text-green-600 font-serif dark:text-green-400">✓ 手机号已验证</p>}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-[#0f3460]/30 dark:border-white/10">
              <Shield size={18} className="text-amber-600 mt-0.5 flex-shrink-0 dark:text-amber-400" />
              <p className="text-xs text-amber-700 font-serif leading-relaxed dark:text-gray-300">你的生日只会用来判断是否开启青少年模式，我们不会收集或分享你的个人信息。</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              {captchaVerified ? (
                <div className="flex items-center gap-2 text-green-600 text-xs dark:text-green-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>验证通过
                </div>
              ) : captchaReady ? (
                <>
                  <button type="button" id="captcha-trigger-btn-register" className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors text-amber-700 text-sm dark:bg-[#0f3460]/50 dark:border-amber-400/30 dark:text-amber-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    点击进行人机验证
                  </button>
                  <div id="aliyun-captcha-element-register" className="hidden" />
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-amber-500 text-xs">验证组件加载中...</p>
                </div>
              )}
              {captchaFailed && !captchaVerified && (
                <div className="flex gap-3">
                  <button type="button" onClick={() => { captchaInitRef.current = false; setCaptchaReady(false); setCaptchaFailed(false); loadTencentCaptcha().then(ok => ok ? setCaptchaReady(true) : setCaptchaFailed(true)); }} className="text-amber-500 text-xs underline hover:text-amber-600">重试</button>
                  <button type="button" onClick={() => setCaptchaFailed(true)} className="text-amber-700 text-xs font-semibold dark:text-amber-300">跳过验证 →</button>
                </div>
              )}
            </div>
            {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-serif text-center dark:bg-red-900/20 dark:border-red-900/30">{error}</div>}
            <Button type="submit" className="w-full" size="lg" disabled={loading || (!captchaVerified && !captchaFailed)}>{loading ? '注册中...' : '创建账号'}</Button>
          </form>
          <div className="mt-5 text-center">
            <p className="text-amber-700 font-serif dark:text-gray-400">已有账号？<Link to="/login" className="text-amber-600 hover:text-amber-800 font-semibold ml-1 transition-colors dark:text-amber-400 dark:hover:text-amber-300">去登录</Link></p>
          </div>
        </GlassCard>
      </div>
      <Modal isOpen={showAgeModal} onClose={() => setShowAgeModal(false)} title="年龄确认">
        <div className="text-center py-2">
          {isUnderFourteen ? (<><div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center"><Heart size={36} className="text-white" /></div><h3 className="text-xl font-serif font-semibold text-orange-800 mb-2 dark:text-gray-100">你好呀，小朋友～</h3><p className="text-amber-700 font-serif mb-5 leading-relaxed dark:text-gray-300">检测到你还未满14岁，我们将为你开启<span className="text-orange-600 font-semibold">青少年模式</span>。</p></>) : (<><div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center text-4xl">✨</div><h3 className="text-xl font-serif font-semibold text-amber-800 mb-2 dark:text-gray-100">确认已满14岁</h3><p className="text-amber-700 font-serif mb-5 leading-relaxed dark:text-gray-300">你将使用标准模式。</p></>)}
          <div className="flex gap-3"><Button variant="secondary" onClick={() => setShowAgeModal(false)} className="flex-1">返回修改</Button><Button onClick={confirmRegistration} className="flex-1">确认</Button></div>
        </div>
      </Modal>
      <Modal isOpen={showAccessCodeModal} onClose={goToLogin} title="你的专属访问口令">
        <div className="text-center py-2 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center"><Shield size={36} className="text-white" /></div>
          <h3 className="text-xl font-serif font-semibold text-amber-800 mb-2 dark:text-gray-100">注册成功</h3>
          <p className="text-amber-700 font-serif mb-4 leading-relaxed text-sm dark:text-gray-300">以下是你的专属访问口令，<span className="text-red-500 font-semibold">仅展示一次</span>，请妥善保存。</p>
          <div className="relative mb-4"><div className="p-4 rounded-xl bg-amber-50 border-2 border-dashed border-amber-300 dark:bg-[#0f3460]/30 dark:border-amber-400/30"><p className="font-mono text-sm text-amber-900 break-all select-all dark:text-gray-100">{generatedAccessCode}</p></div><button onClick={handleCopyCode} className="absolute top-2 right-2 p-2 rounded-lg bg-white/80 hover:bg-amber-100 transition-colors text-amber-600 dark:bg-[#0f3460]/50 dark:text-amber-400" title="复制口令">{copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}</button></div>
          {copied && <p className="text-green-500 text-xs font-serif mb-3 animate-fade-in">已复制到剪贴板</p>}
          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-900/30"><Shield size={16} className="text-orange-500 mt-0.5 flex-shrink-0" /><p className="text-xs text-orange-700 font-serif leading-relaxed text-left dark:text-orange-300">口令丢失后无法找回，请立即复制保存到安全的地方。</p></div>
          <Button onClick={goToLogin} className="w-full" size="lg">已保存，去登录</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Register;
