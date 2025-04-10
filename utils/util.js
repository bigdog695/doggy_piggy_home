// util.js
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 将聊天历史记录格式化为DeepSeek模型所需的格式
 * @param {Array} messages - 聊天历史记录
 * @returns {String} - 格式化后的文本
 */
const formatChatHistory = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return '';
  }

  return messages.map(msg => {
    if (msg.role === 'user') {
      return `Human: ${msg.content}`;
    } else if (msg.role === 'system') {
      return `AI: ${msg.content}`;
    }
    return '';
  }).join('\n\n');
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {Number} wait - 等待时间
 * @returns {Function} - 节流后的函数
 */
const throttle = (func, wait = 300) => {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(context, args);
      }, wait);
    }
  }
}

module.exports = {
  formatTime,
  formatNumber,
  formatChatHistory,
  throttle
} 