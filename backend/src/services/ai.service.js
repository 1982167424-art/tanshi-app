const POLLINATIONS_API_URL = 'https://text.pollinations.ai/openai';
const POLLINATIONS_MODEL = 'openai';

// 带重试的 AI 调用
const callMimo = async (systemPrompt, userPrompt, { temperature = 0.8, maxTokens = 200, retries = 2 } = {}) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(POLLINATIONS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: POLLINATIONS_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) throw new Error(`AI服务返回 ${response.status}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('AI返回内容为空');
      return content;
    } catch (error) {
      if (i === retries) throw error;
      // 等待后重试
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

// AI 对话
const chat = async (message) => {
  if (!message) {
    const err = new Error('消息不能为空'); err.status = 400; throw err;
  }

  const systemPrompt = `你是"小暖"，一个温暖、贴心、善解人意的AI陪伴助手。你的特点是：
1. 用温暖、治愈的语言与用户交流
2. 善于倾听，给予情感支持
3. 用轻松、友善的语气，适当使用"呢"、"呀"、"～"等语气词
4. 关注用户的情绪变化，给予积极的回应
5. 保持简洁，回复一般不超过100字
6. 如果用户表达了负面情绪，给予安慰和理解
7. 用中文回复，保持温暖治愈的风格`;

  const content = await callMimo(systemPrompt, message, { temperature: 0.8, maxTokens: 200 });
  return content || '我听到了，能再说详细一点吗？';
};

// AI 心情分析
const analysis = async (moodData) => {
  if (!moodData || !Array.isArray(moodData)) {
    const err = new Error('心情数据不能为空'); err.status = 400; throw err;
  }

  const hasData = moodData.some((d) => d.score > 0);
  const moodText = moodData
    .map((d) => {
      const label = d.score === 3 ? '很好' : d.score === 2 ? '一般' : d.score === 1 ? '不好' : '未记录';
      return `${d.date}: ${label}${d.note ? '（' + d.note + '）' : ''}`;
    })
    .join('\n');

  const systemPrompt = `你是"小暖"，一个温暖、贴心的AI心情分析师。请根据用户最近7天的心情数据，给出温暖、治愈的分析。
以JSON格式回复，包含：summary(一句话总结)、suggestion(一条建议)、encouragement(一句鼓励)。
语气温暖治愈，每段不超过50字，只返回JSON。`;

  const userPrompt = `以下是我最近7天的心情记录：\n${moodText}\n\n请用JSON格式返回：{"summary":"...","suggestion":"...","encouragement":"..."}`;

  let analysisResult = { summary: '', suggestion: '', encouragement: '' };

  try {
    const aiResponse = await callMimo(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 300 });
    const match = aiResponse.match(/\{[\s\S]*\}/);
    if (match) analysisResult = JSON.parse(match[0]);
  } catch {
    // 调用失败时使用兜底分析
  }

  // 兜底分析
  if (!analysisResult.summary) {
    const validScores = moodData.filter((d) => d.score > 0);
    const avgScore = hasData ? validScores.reduce((s, d) => s + d.score, 0) / validScores.length : 0;

    if (!hasData) {
      analysisResult = {
        summary: '最近7天还没有记录心情呢，快开始记录吧～',
        suggestion: '每天花几秒钟记录心情，能帮助更好地了解自己哦。',
        encouragement: '无论今天怎样，你都是最棒的！',
      };
    } else if (avgScore >= 2.5) {
      analysisResult = {
        summary: '最近一周你的心情整体很好呢，保持这样的状态真棒！',
        suggestion: '好心情的时候可以记录下来，回顾一下会发现生活中有很多美好。',
        encouragement: '你的笑容像阳光一样温暖，继续闪耀吧！',
      };
    } else if (avgScore >= 1.5) {
      analysisResult = {
        summary: '最近一周心情比较平稳，有起有落是生活的常态。',
        suggestion: '试试每天做一件让自己开心的小事，比如听音乐、散步或者和朋友聊天。',
        encouragement: '生活中的小确幸正在路上，记得去发现和珍惜哦～',
      };
    } else {
      analysisResult = {
        summary: '最近一周感觉你心情有点低落，抱抱你。',
        suggestion: '如果感到累了，就允许自己休息一下。也可以找信任的人聊聊。',
        encouragement: '无论遇到什么困难，你都不是一个人。相信自己，一切都会好起来的。',
      };
    }
  }

  return analysisResult;
};

module.exports = { chat, analysis };
