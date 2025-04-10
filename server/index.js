// 后端服务器代理
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

// 创建express应用
const app = express();
const port = process.env.PORT || 3000;

// 配置中间件
app.use(cors());
app.use(bodyParser.json());

// Ollama服务器地址
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI生成接口
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'deepseek-coder' } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '消息格式不正确' });
    }
    
    // 获取最后一条用户消息
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    
    if (!lastUserMessage) {
      return res.status(400).json({ error: '没有找到用户消息' });
    }

    // 调用Ollama API
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model,
      prompt: lastUserMessage.content,
      options: {
        temperature: 0.7,
        top_p: 0.9
      }
    });

    // 返回结果
    if (response.data && response.data.response) {
      return res.status(200).json({
        response: response.data.response
      });
    } else {
      return res.status(500).json({ error: 'AI响应格式不正确' });
    }
  } catch (error) {
    console.error('AI请求失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`AI代理服务器已启动，监听端口: ${port}`);
  console.log(`Ollama服务地址: ${OLLAMA_URL}`);
}); 