import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { calculateAge } from '@/utils/date';
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

  const { register } = useAuthStore();
  const navigate = useNavigate();

  const validatePassword = (pwd: string): { valid: boolean; message: string } => {
    if (pwd.length < 8) {
      return { valid: false, message: '密码至少需要8位' };
    }
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(pwd);
    if (!hasLetter || !hasNumber || !hasSymbol) {
      return { valid: false, message: '密码需要包含字母、数字和符号' };
    }
    return { valid: true, message: '' };
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    if (password) {
      const result = validatePassword(password);
      setPasswordError(result.message);
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (!birthday) {
      setError('请选择出生日期');
      return;
    }

    const age = calculateAge(birthday);
    setIsUnderFourteen(age < 14);
    setShowAgeModal(true);
  };

  const confirmRegistration = async () => {
    setLoading(true);
    setShowAgeModal(false);

    try {
      const result = await register(username, password, birthday);
      if (result.success && result.accessCode) {
        setGeneratedAccessCode(result.accessCode);
        setShowAccessCodeModal(true);
      } else {
        setError(result.message);
      }
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedAccessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = generatedAccessCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const goToLogin = () => {
    setShowAccessCodeModal(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#1a1a2e]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-20 w-72 h-72 bg-amber-300/30 rounded-full blur-3xl animate-float dark:bg-blue-300/10" />
        <div className="absolute bottom-32 left-20 w-80 h-80 bg-orange-300/30 rounded-full blur-3xl animate-float dark:bg-purple-300/10" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-serif font-bold text-amber-900 dark:text-gray-100">探时</h1>
        </div>

        <GlassCard className="p-8">
          <h2 className="text-2xl font-serif font-semibold text-amber-900 mb-6 text-center dark:text-gray-100">
            创建账号
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="用户名"
              value={username}
              onChange={setUsername}
              placeholder=""
            />

            <Input
              label="密码"
              type="password"
              value={password}
              onChange={setPassword}
              onBlur={handlePasswordBlur}
              placeholder="至少8位"
              error={passwordTouched ? passwordError : ''}
            />

            <Input
              label="确认密码"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="再次输入密码"
            />

            <Input
              label="出生日期"
              type="date"
              value={birthday}
              onChange={setBirthday}
            />

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-[#0f3460]/30 dark:border-white/10">
              <Shield size={18} className="text-amber-600 mt-0.5 flex-shrink-0 dark:text-amber-400" />
              <p className="text-xs text-amber-700 font-serif leading-relaxed dark:text-gray-300">
                你的生日只会用来判断是否开启青少年模式，我们不会收集或分享你的个人信息。
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-serif text-center dark:bg-red-900/20 dark:border-red-900/30">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? '注册中...' : '创建账号'}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-amber-700 font-serif dark:text-gray-400">
              已有账号？
              <Link
                to="/login"
                className="text-amber-600 hover:text-amber-800 font-semibold ml-1 transition-colors dark:text-amber-400 dark:hover:text-amber-300"
              >
                去登录
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>

      <Modal
        isOpen={showAgeModal}
        onClose={() => setShowAgeModal(false)}
        title="年龄确认"
      >
        <div className="text-center py-2">
          {isUnderFourteen ? (
            <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-300 to-pink-300 flex items-center justify-center">
                <Heart size={36} className="text-white" />
              </div>
              <h3 className="text-xl font-serif font-semibold text-orange-800 mb-2 dark:text-gray-100">
                你好呀，小朋友～ 👋
              </h3>
              <p className="text-amber-700 font-serif mb-5 leading-relaxed dark:text-gray-300">
                检测到你还未满14岁，我们将为你开启<span className="text-orange-600 font-semibold">青少年模式</span>。
                在这里，你可以记录心情、培养好习惯，还有暖心小助手陪伴你哦～ 🌈
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 flex items-center justify-center text-4xl">
                ✨
              </div>
              <h3 className="text-xl font-serif font-semibold text-amber-800 mb-2 dark:text-gray-100">
                确认已满14岁
              </h3>
              <p className="text-amber-700 font-serif mb-5 leading-relaxed dark:text-gray-300">
                你将使用标准模式。
              </p>
            </>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowAgeModal(false)} className="flex-1">
              返回修改
            </Button>
            <Button onClick={confirmRegistration} className="flex-1">
              确认
            </Button>
          </div>
        </div>
      </Modal>

      {/* 访问口令展示弹窗 - 柔和浮现动画 */}
      <Modal
        isOpen={showAccessCodeModal}
        onClose={goToLogin}
        title="你的专属访问口令"
      >
        <div className="text-center py-2 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center">
            <Shield size={36} className="text-white" />
          </div>
          <h3 className="text-xl font-serif font-semibold text-amber-800 mb-2 dark:text-gray-100">
            注册成功 🎉
          </h3>
          <p className="text-amber-700 font-serif mb-4 leading-relaxed text-sm dark:text-gray-300">
            以下是你的专属访问口令，<span className="text-red-500 font-semibold">仅展示一次</span>，请妥善保存。
            登录时可选填以增强账号安全。
          </p>

          <div className="relative mb-4 group">
            <div className="p-4 rounded-xl bg-amber-50 border-2 border-dashed border-amber-300 dark:bg-[#0f3460]/30 dark:border-amber-400/30">
              <p className="font-mono text-sm text-amber-900 break-all select-all dark:text-gray-100">
                {generatedAccessCode}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="absolute top-2 right-2 p-2 rounded-lg bg-white/80 hover:bg-amber-100 transition-colors text-amber-600 dark:bg-[#0f3460]/50 dark:text-amber-400"
              title="复制口令"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            </button>
          </div>

          {copied && (
            <p className="text-green-500 text-xs font-serif mb-3 animate-fade-in">
              ✓ 已复制到剪贴板
            </p>
          )}

          <div className="flex items-start gap-2 p-3 mb-4 rounded-xl bg-orange-50 border border-orange-200 dark:bg-orange-900/20 dark:border-orange-900/30">
            <Shield size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-orange-700 font-serif leading-relaxed text-left dark:text-orange-300">
              ⚠️ 口令丢失后无法找回，请立即复制保存到安全的地方。
            </p>
          </div>

          <Button onClick={goToLogin} className="w-full" size="lg">
            已保存，去登录
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Register;
