# AI助手微信小程序

基于微信小程序开发的AI聊天助手，界面类似ChatGPT，使用Ollama部署的DeepSeek模型提供AI能力。

## 项目结构

```
├── pages/                # 小程序页面
│   ├── index/            # 首页
│   └── chat/             # 聊天页面
├── utils/                # 工具函数
│   ├── api.js            # API接口
│   ├── util.js           # 通用工具函数
│   └── config.js         # 配置文件
├── assets/               # 静态资源
├── server/               # 后端服务
│   ├── index.js          # 服务入口
│   └── package.json      # 依赖配置
├── app.js                # 小程序入口
├── app.json              # 小程序配置
├── app.wxss              # 全局样式
└── project.config.json   # 项目配置
```

## 使用方法

### 1. 后端服务部署

1. 确保已安装Ollama并运行DeepSeek模型：
   ```
   ollama pull deepseek-coder
   ollama run deepseek-coder
   ```

2. 部署代理服务器：
   ```
   cd server
   npm install
   npm start
   ```

### 2. 小程序配置

1. 在`utils/config.js`中修改`BASE_URL`为你的服务器地址
2. 在微信开发者工具中导入项目
3. 在`project.config.json`中修改`appid`为你的小程序AppID

### 3. 发布

按照微信小程序的正常发布流程进行审核和发布

## 功能特点

- 简洁美观的聊天界面，类似ChatGPT
- 基于DeepSeek模型的AI能力
- 聊天历史记录本地存储
- 响应式设计，适配不同屏幕大小

## 注意事项

- 请确保Ollama服务器能够被小程序访问
- 小程序域名需要在微信公众平台进行配置
- 请遵守微信小程序相关规范和政策 