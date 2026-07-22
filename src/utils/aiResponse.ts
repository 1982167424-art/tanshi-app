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

// 根据对话上下文生成 AI 提示建议
export const getAISuggestions = (messages: { role: string; content: string }[]): string[] => {
  if (messages.length === 0) return [];

  const lastMsg = messages[messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'ai') return [];

  const text = lastMsg.content;

  // 根据 AI 回复内容生成相关建议
  if (/难过|伤心|低落|不开心/.test(text)) {
    return ['想聊聊原因吗？', '有什么我能帮你的？', '试试做点开心的事吧'];
  }
  if (/开心|快乐|高兴|太好了/.test(text)) {
    return ['还想分享更多吗？', '最近还有什么开心事？', '一起想想明天的计划'];
  }
  if (/压力|焦虑|紧张|担心/.test(text)) {
    return ['深呼吸一下', '聊聊压力来源', '给自己放个假吧'];
  }
  if (/累|疲惫|辛苦/.test(text)) {
    return ['今天早点休息', '聊聊你在忙什么', '给自己充充电'];
  }
  if (/迷茫|不确定|犹豫/.test(text)) {
    return ['说说你的想法', '你最想要什么？', '先迈出一小步试试'];
  }
  if (/睡|失眠|梦/.test(text)) {
    return ['试试冥想放松', '聊聊今天做了什么', '明天有什么期待的？'];
  }
  if (/感谢|谢谢/.test(text)) {
    return ['你还想感谢谁？', '你也很棒呀', '继续分享温暖的事'];
  }
  if (/鼓励|加油/.test(text)) {
    return ['我相信你可以的', '你已经做得很好了', '今天给自己一个小奖励'];
  }

  // 默认建议
  return ['继续聊聊', '你今天感觉怎么样？', '说说你最近的事'];
};
