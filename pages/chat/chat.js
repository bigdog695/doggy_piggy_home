// chat.js
const app = getApp()
const { callAI } = require('../../utils/api')
const CONFIG = require('../../utils/config')
const { throttle } = require('../../utils/util')

Page({
  data: {
    inputValue: '',
    messages: [],
    loading: false,
    scrollTop: 0,
    scrollViewHeight: 0,
    inputBottom: 0,
    serverConnected: false
  },

  onLoad: function() {
    // 设置初始消息
    if (!app.globalData.chatHistory || app.globalData.chatHistory.length === 0) {
      const initialMessage = {
        role: 'system',
        content: '你好！我是AI助手，请问有什么可以帮助你的？'
      }
      
      this.setData({
        messages: [initialMessage]
      })
      
      app.globalData.chatHistory = [initialMessage]
    } else {
      this.setData({
        messages: app.globalData.chatHistory
      })
    }
    
    // 获取屏幕高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      scrollViewHeight: systemInfo.windowHeight - 120, // 减去输入框高度
      serverConnected: app.globalData.serverConnected
    })
    
    // 创建节流版本的发送消息函数
    this.throttledSendMessage = throttle(this.sendMessage, 500)
  },
  
  onShow: function() {
    // 读取全局聊天记录（如果有）
    if (app.globalData.chatHistory && app.globalData.chatHistory.length > 0) {
      this.setData({
        messages: app.globalData.chatHistory,
        serverConnected: app.globalData.serverConnected
      })
    }
  },

  // 处理键盘高度变化
  inputFocus: function(e) {
    this.setData({
      inputBottom: e.detail.height
    })
  },
  
  inputBlur: function() {
    this.setData({
      inputBottom: 0
    })
  },

  // 监听输入框变化
  onInputChange: function(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  // 发送消息
  sendMessage: function() {
    if (!this.data.inputValue.trim()) return
    
    // 检查服务器连接状态
    if (!app.globalData.serverConnected) {
      wx.showToast({
        title: '服务器未连接，请检查网络',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: this.data.inputValue
    }
    
    const messages = [...this.data.messages, userMessage]
    
    this.setData({
      messages,
      inputValue: '',
      loading: true
    })
    
    // 存储聊天记录到全局数据
    app.globalData.chatHistory = messages
    app.saveChatHistory()
    
    // 滚动到底部
    this.scrollToBottom()
    
    // 调用AI接口
    callAI(messages).then(res => {
      // 添加AI回复
      const aiMessage = {
        role: 'system',
        content: res.response
      }
      
      const updatedMessages = [...this.data.messages, aiMessage]
      
      this.setData({
        messages: updatedMessages,
        loading: false
      })
      
      // 更新全局聊天记录
      app.globalData.chatHistory = updatedMessages
      app.saveChatHistory()
      
      // 滚动到底部
      this.scrollToBottom()
    }).catch(err => {
      console.error('AI请求失败:', err)
      
      // 添加错误消息
      const errorMessage = {
        role: 'system',
        content: '抱歉，发生了一些错误，请稍后再试。'
      }
      
      const updatedMessages = [...this.data.messages, errorMessage]
      
      this.setData({
        messages: updatedMessages,
        loading: false
      })
      
      // 更新全局聊天记录
      app.globalData.chatHistory = updatedMessages
      app.saveChatHistory()
      
      // 滚动到底部
      this.scrollToBottom()
    })
  },
  
  // 清空聊天记录
  clearChat: function() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有聊天记录吗？',
      success: (res) => {
        if (res.confirm) {
          const initialMessage = {
            role: 'system',
            content: '你好！我是AI助手，请问有什么可以帮助你的？'
          }
          
          this.setData({
            messages: [initialMessage]
          })
          
          // 更新全局聊天记录
          app.globalData.chatHistory = [initialMessage]
          app.saveChatHistory()
        }
      }
    })
  },
  
  // 滚动到底部
  scrollToBottom: function() {
    setTimeout(() => {
      wx.createSelectorQuery()
        .select('#message-container')
        .boundingClientRect((rect) => {
          if (rect) {
            this.setData({
              scrollTop: rect.height
            })
          }
        })
        .exec()
    }, 100)
  }
}) 