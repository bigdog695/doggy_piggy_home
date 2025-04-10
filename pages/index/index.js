// index.js
const app = getApp()

Page({
  data: {
    motto: '欢迎使用AI助手',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
  },
  
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },
  
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '展示用户信息',
      success: (res) => {
        app.globalData.userInfo = res.userInfo
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        
        // 获取用户信息后直接跳转到聊天页面
        wx.navigateTo({
          url: '../chat/chat',
        })
      }
    })
  },
  
  startChat() {
    wx.navigateTo({
      url: '../chat/chat',
    })
  }
}) 