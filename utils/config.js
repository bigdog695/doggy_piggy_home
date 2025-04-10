/**
 * 项目配置文件
 */

// API配置
const API = {
  // Ollama服务器地址
  BASE_URL: 'http://your-server-address:11434',
  // 模型名称
  MODEL: 'deepseek-coder',
  // 请求超时时间(ms)
  TIMEOUT: 30000
};

// 应用配置
const APP = {
  // 应用名称
  NAME: 'AI助手',
  // 版本号
  VERSION: '1.0.0',
  // 调试模式
  DEBUG: true
};

// 缓存键名
const STORAGE = {
  // 聊天历史记录
  CHAT_HISTORY: 'CHAT_HISTORY',
  // 用户信息
  USER_INFO: 'USER_INFO',
  // 设置信息
  SETTINGS: 'SETTINGS'
};

module.exports = {
  API,
  APP,
  STORAGE
}; 