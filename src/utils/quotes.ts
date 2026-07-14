const quotes: { text: string; author?: string }[] = [
  { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
  { text: '生活不是等待风暴过去，而是学会在雨中跳舞。', author: '维维安·格林' },
  { text: '你比你想象的更勇敢，比你看起来更坚强，比你认为的更聪明。', author: '小熊维尼' },
  { text: '慢慢来，比较快。', author: '谚语' },
  { text: '人生没有白走的路，每一步都算数。', author: '李宗盛' },
  { text: '今天的努力是明天最好的铺垫。', author: '探时' },
  { text: '无论你正在经历什么，都请不要轻易放弃。', author: '探时' },
  { text: '微笑是最好的语言，善良是最好的名片。', author: '探时' },
  { text: '每一天都是新的开始，每一刻都值得珍惜。', author: '探时' },
  { text: '相信自己，你比想象中更强大。', author: '探时' },
  { text: '心若向阳，无畏悲伤。', author: '谚语' },
  { text: '愿你眼中有光，心中有爱，脚下有力量。', author: '探时' },
  { text: '时间不会辜负每一个用心的人。', author: '探时' },
  { text: '生活明朗，万物可爱，人间值得，未来可期。', author: '探时' },
  { text: '星光不问赶路人，时光不负有心人。', author: '谚语' },
  { text: '保持热爱，奔赴山海。', author: '谚语' },
  { text: '慢慢来，谁还没有一个努力的过程。', author: '探时' },
  { text: '你所做的事情，也许暂时看不到成果，但不要灰心或焦虑，你不是没有成长，而是在扎根。', author: '探时' },
  { text: '每一次跌倒，都是为了更好地站起来。', author: '探时' },
  { text: '愿你成为自己喜欢的样子，不抱怨，不将就，有自由，有光芒。', author: '探时' },
];

export const getDailyQuote = (): { text: string; author?: string } => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return quotes[dayOfYear % quotes.length];
};

export const getRandomQuote = (): { text: string; author?: string } => {
  return quotes[Math.floor(Math.random() * quotes.length)];
};