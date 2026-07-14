import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (accessCode.trim() && (!username.trim() || !password)) {
      setError('填写访问口令时，用户名和密码也必须填写');
      return;
    }

    setLoading(true);

    try {
      const result = await login(username, password, accessCode.trim() || undefined);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-serif font-semibold text-amber-900 mb-6 text-center dark:text-gray-100">
            登录
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="用户名"
              value={username}
              onChange={setUsername}
              placeholder="请输入用户名"
            />

            <Input
              label="密码"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="请输入密码"
            />

            <Input
              label="访问口令（选填）"
              type="password"
              value={accessCode}
              onChange={setAccessCode}
              placeholder="选填，用于增强账号安全"
            />

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-serif text-center dark:bg-red-900/20 dark:border-red-900/30">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? '登录中...' : '登 录'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-amber-700 font-serif dark:text-gray-400">
              还没有账号？
              <Link
                to="/register"
                className="text-amber-600 hover:text-amber-800 font-semibold ml-1 transition-colors dark:text-amber-400 dark:hover:text-amber-300"
              >
                立即注册
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Login;
