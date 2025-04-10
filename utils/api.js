// api.js
const CONFIG = require('./config');

/**
 * 调用AI接口发送消息
 * @param {Array} messages - 历史消息数组
 * @returns {Promise} - 返回API调用的Promise对象
 */
function callAI(messages) {
  return new Promise((resolve, reject) => {
    // 验证消息格式
    if (!Array.isArray(messages) || messages.length === 0) {
      reject(new Error('消息格式不正确'));
      return;
    }

    // 使用微信请求API
    wx.request({
      url: `${CONFIG.API.BASE_URL}/api/chat`, 
      method: 'POST',
      data: {
        messages: messages,
        model: CONFIG.API.MODEL
      },
      header: {
        'content-type': 'application/json'
      },
      timeout: CONFIG.API.TIMEOUT,
      success(res) {
        if (res.statusCode === 200 && res.data) {
          resolve({
            response: res.data.response || '抱歉，我没有找到合适的回答。'
          });
        } else {
          const errorMsg = (res.data && res.data.error) ? res.data.error : 'API响应异常';
          reject(new Error(errorMsg));
        }
      },
      fail(err) {
        console.error('API请求失败:', err);
        reject(err);
      }
    });
  });
}

/**
 * 测试AI服务连接
 * @returns {Promise} - 返回连接测试的Promise对象
 */
function testConnection() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${CONFIG.API.BASE_URL}/health`,
      method: 'GET',
      timeout: 5000,
      success(res) {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          reject(new Error('服务器连接失败'));
        }
      },
      fail(err) {
        console.error('连接测试失败:', err);
        reject(err);
      }
    });
  });
}

// 导出函数
module.exports = {
  callAI,
  testConnection
}; 