import { api } from '@/utils/api';

export const getAIResponse = async (message: string): Promise<string> => {
  try {
    const response = await api.ai.chat(message);
    return response || getFallbackResponse(message);
  } catch (error) {
    console.error('AI API调用失败:', error);
    return getFallbackResponse(message);
  }
};

// 本地备用响应（当API不可用时）
const getFallbackResponse = (message: string): string => {
  const fallbackResponses = [
    '你好呀～ 我是小暖，很高兴能陪你聊聊天。今天过得怎么样？',
    '嗯嗯，我在听呢。有什么想说的都可以告诉我，我会一直在这里陪着你。',
    '谢谢你愿意和我分享。不管开心还是难过，说出来都会好受一些的。',
    '我很喜欢听你说话，继续说吧，我在这里。',
    '和你聊天很开心，希望你每天都能有好心情～'
  ];
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
};

export const quickTopics = [
  { emoji: '😢', label: '我有点难过', text: '我今天有点难过' },
  { emoji: '😊', label: '今天很开心', text: '今天发生了开心的事' },
  { emoji: '😤', label: '有点生气', text: '我好生气啊' },
  { emoji: '😴', label: '好累啊', text: '最近感觉好累' },
  { emoji: '📚', label: '学习压力', text: '学习压力好大' },
  { emoji: '💭', label: '聊聊梦想', text: '我想聊聊我的梦想' },
  { emoji: '💔', label: '有点迷茫', text: '我现在很迷茫' },
  { emoji: '🌙', label: '睡不着', text: '我睡不着，有点失眠' },
  { emoji: '💝', label: '想感谢', text: '我想感谢一些人' },
  { emoji: '💬', label: '随便聊聊', text: '随便聊聊吧' },
  { emoji: '🔥', label: '需要鼓励', text: '我需要一些鼓励' },
  { emoji: '🍀', label: '身体不舒服', text: '我身体有点不舒服' },
];
