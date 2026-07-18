export interface Platform {
  id: string;
  name: string;
  deepLink: string;
  webUrl: string;
  color: string;
}

export const entertainmentPlatforms: Platform[] = [
  { id: 'weixin-channels', name: '视频号', deepLink: 'weixin://channels', webUrl: 'https://channels.weixin.qq.com', color: 'from-green-400 to-emerald-500' },
  { id: 'douyin', name: '抖音', deepLink: 'snssdk1128://', webUrl: 'https://www.douyin.com', color: 'from-pink-500 to-rose-500' },
  { id: 'kuaishou', name: '快手', deepLink: 'kwai://', webUrl: 'https://www.kuaishou.com', color: 'from-orange-400 to-red-500' },
  { id: 'xiaohongshu', name: '小红书', deepLink: 'xhsdiscover://', webUrl: 'https://www.xiaohongshu.com', color: 'from-red-400 to-rose-500' },
  { id: 'bilibili', name: '哔哩哔哩', deepLink: 'bilibili://', webUrl: 'https://www.bilibili.com', color: 'from-blue-400 to-pink-400' },
  { id: 'toutiao', name: '今日头条', deepLink: 'snssdk143://', webUrl: 'https://www.toutiao.com', color: 'from-red-500 to-rose-600' },
  { id: 'qqvideo', name: '腾讯视频', deepLink: 'tenvideo://', webUrl: 'https://v.qq.com', color: 'from-yellow-400 to-orange-500' },
  { id: 'yangshipin', name: '央视频', deepLink: 'yangshipin://', webUrl: 'https://app.cctv.com', color: 'from-red-500 to-orange-500' },
  { id: 'mgtv', name: '芒果TV', deepLink: 'mgtv://', webUrl: 'https://www.mgtv.com', color: 'from-amber-400 to-yellow-500' },
  { id: 'iqiyi', name: '爱奇艺', deepLink: 'iqiyi://', webUrl: 'https://www.iqiyi.com', color: 'from-green-500 to-lime-500' },
  { id: '4399', name: '4399', deepLink: 'four399game://', webUrl: 'https://www.4399.com', color: 'from-emerald-400 to-teal-500' },
  { id: 'taptap', name: 'TapTap', deepLink: 'taptap://', webUrl: 'https://www.taptap.cn', color: 'from-blue-500 to-indigo-500' },
  { id: 'qqmusic', name: 'QQ音乐', deepLink: 'qqmusic://', webUrl: 'https://y.qq.com', color: 'from-green-400 to-teal-500' },
  { id: 'netease-music', name: '网易云音乐', deepLink: 'orpheus://', webUrl: 'https://music.163.com', color: 'from-red-500 to-rose-600' },
  { id: 'qishui', name: '汽水音乐', deepLink: 'qishui://', webUrl: 'https://qishui.douyin.com', color: 'from-cyan-400 to-sky-500' },
  { id: 'kugou', name: '酷狗音乐', deepLink: 'kugou://', webUrl: 'https://www.kugou.com', color: 'from-sky-400 to-blue-500' },
];

export const learningPlatforms: Platform[] = [
  { id: 'smartedu', name: '国家中小学智慧教育平台', deepLink: 'smartedu://', webUrl: 'https://www.smartedu.cn', color: 'from-blue-500 to-indigo-600' },
  { id: 'duolingo', name: '多邻国', deepLink: 'duolingo://', webUrl: 'https://www.duolingo.cn', color: 'from-green-500 to-emerald-500' },
  { id: 'dancizhan', name: '单词斩', deepLink: 'dancizhan://', webUrl: 'https://www.dancizhan.com', color: 'from-purple-500 to-pink-500' },
];

export const openPlatform = (platform: Platform): void => {
  const { deepLink, webUrl } = platform;
  const startTime = Date.now();
  const visibilityChanged = () => document.hidden || document.visibilityState === 'hidden';

  try { window.location.href = deepLink; } catch { window.location.href = webUrl; return; }

  setTimeout(() => {
    if (!visibilityChanged() && Date.now() - startTime < 2500) {
      window.location.href = webUrl;
    }
  }, 2000);
};
