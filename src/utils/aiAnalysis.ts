import { AIMoodAnalysis } from '@/types';
import { api } from '@/utils/api';

export const analyzeMoodTrend = async (moodData: {
  date: string;
  score: number;
  mood?: string;
  note?: string;
}[]): Promise<AIMoodAnalysis> => {
  try {
    const result = await api.ai.analysis(moodData);
    if (result && typeof result === 'object' && 'summary' in result) {
      return result as AIMoodAnalysis;
    }
    throw new Error('分析结果格式错误');
  } catch (error) {
    console.error('AI心情分析调用失败:', error);
    return getFallbackAnalysis(moodData);
  }
};

const getFallbackAnalysis = (moodData: {
  date: string;
  score: number;
  mood?: string;
  note?: string;
}[]): AIMoodAnalysis => {
  const hasData = moodData.some(d => d.score > 0);
  const avgScore = hasData
    ? moodData.filter(d => d.score > 0).reduce((s, d) => s + d.score, 0) /
      moodData.filter(d => d.score > 0).length
    : 0;

  let summary = '';
  let suggestion = '';
  let encouragement = '';

  if (!hasData) {
    summary = '最近7天还没有记录心情呢，快开始记录吧～';
    suggestion = '每天花几秒钟记录心情，能帮助更好地了解自己哦。';
    encouragement = '无论今天怎样，你都是最棒的！';
  } else if (avgScore >= 2.5) {
    summary = '最近一周你的心情整体很好呢，保持这样的状态真棒！';
    suggestion = '好心情的时候可以记录下来，回顾一下会发现生活中有很多美好。';
    encouragement = '你的笑容像阳光一样温暖，继续闪耀吧！';
  } else if (avgScore >= 1.5) {
    summary = '最近一周心情比较平稳，有起有落是生活的常态。';
    suggestion = '试试每天做一件让自己开心的小事，比如听音乐、散步或者和朋友聊天。';
    encouragement = '生活中的小确幸正在路上，记得去发现和珍惜哦～';
  } else {
    summary = '最近一周感觉你心情有点低落，抱抱你。';
    suggestion = '如果感到累了，就允许自己休息一下。也可以找信任的人聊聊，把情绪说出来会好很多。';
    encouragement = '无论遇到什么困难，你都不是一个人。相信自己，一切都会好起来的。';
  }

  return { summary, suggestion, encouragement };
};
