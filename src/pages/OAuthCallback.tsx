import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/utils/api';

const OAuthCallback = () => {
  const { provider } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { currentUser } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const uid = params.get('uid');
    const username = params.get('username');
    const errorParam = params.get('error');

    if (errorParam) {
      const messages: Record<string, string> = {
        wechat_not_configured: '微信登录暂未开放',
        no_code: '授权失败，请重试',
        wechat_auth_denied: '微信授权被拒绝',
        wechat_token_failed: '微信认证失败',
        wechat_profile_failed: '获取微信账户信息失败',
        wechat_error: '微信登录出错',
      };
      setError(messages[errorParam] || '登录失败，请重试');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (token && uid && username) {
      api.setToken(token);
      useAuthStore.setState({
        currentUser: {
          uid,
          username: decodeURIComponent(username),
          birthday: '',
          isTeenMode: false,
          avatar: '',
          createdAt: new Date().toISOString(),
        },
      });
      navigate('/');
    } else {
      setError('登录信息不完整');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [navigate, provider]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#1a1a2e]">
        <div className="text-center p-8">
          <p className="text-red-500 text-lg font-serif mb-2">{error}</p>
          <p className="text-amber-600 text-sm">正在跳转到登录页...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 dark:from-[#1a1a2e] dark:via-[#16213e] dark:to-[#1a1a2e]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-amber-700 mt-4 font-serif">正在完成登录...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
