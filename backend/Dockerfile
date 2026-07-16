FROM node:20-slim

# 安装 better-sqlite3 编译所需工具
RUN apt-get update && apt-get install -y python3 make g++ gcc && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制 package 文件并安装依赖
COPY package*.json ./
RUN npm ci

# 复制源码
COPY . .

# 创建数据目录
RUN mkdir -p /data

EXPOSE 3001

CMD ["node", "server.js"]
