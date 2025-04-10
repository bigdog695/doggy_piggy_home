// app.js
const { testConnection } = require('./utils/api')
const CONFIG = require('./utils/config')

App({
  onLaunch: function() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    
    // 尝试从缓存中恢复聊天历史
    try {
      const chatHistory = wx.getStorageSync(CONFIG.STORAGE.CHAT_HISTORY)
      if (chatHistory) {
        this.globalData.chatHistory = JSON.parse(chatHistory)
      }
    } catch (e) {
      console.error('读取聊天历史失败:', e)
    }
    
    // 测试服务器连接
    this.testServerConnection()
  },
  
  // 测试服务器连接
  testServerConnection: function() {
    if (!CONFIG.API.BASE_URL) {
      console.error('API地址未配置')
      return
    }
    
    testConnection()
      .then(() => {
        console.log('服务器连接成功')
        this.globalData.serverConnected = true
      })
      .catch(err => {
        console.error('服务器连接失败:', err)
        this.globalData.serverConnected = false
        
        // 弹出提示框
        wx.showToast({
          title: '服务器连接失败',
          icon: 'none',
          duration: 2000
        })
      })
  },
  
  // 保存聊天历史到缓存
  saveChatHistory: function() {
    try {
      wx.setStorageSync(
        CONFIG.STORAGE.CHAT_HISTORY, 
        JSON.stringify(this.globalData.chatHistory)
      )
    } catch (e) {
      console.error('保存聊天历史失败:', e)
    }
  },
  
  globalData: {
    userInfo: null,
    chatHistory: [],
    serverConnected: false
  }
}) 