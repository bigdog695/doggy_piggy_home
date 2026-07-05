# Copilot Bridge + Claude Code 配置指南

本文记录一套已经过端到端验证的配置：使用 GitHub Copilot 作为 Claude Code 的模型后端，并让 Claude Code 正确启用 Claude Opus 4.8、1M context 和 `effort=max`，同时保留 Claude Code 的 Plan mode。

本文以以下版本为基准：

- copilot-bridge `0.3.2`（Linux x64）
- Claude Code `2.1.201`
- bridge 默认地址：`http://localhost:8765`

项目地址：<https://github.com/hooyao/copilot-bridge>

> GitHub Copilot 可用模型和各模型能力可能随服务端更新而变化。遇到差异时，以 `copilot-bridge debug list-models` 和实际 bridge 日志为准。

## 1. 工作原理

```text
Claude Code
    │ Anthropic Messages API
    ▼
http://localhost:8765/cc/v1/messages
    │ 模型名、beta header、thinking/effort 适配
    ▼
copilot-bridge
    │ GitHub Copilot token
    ▼
GitHub Copilot
```

Claude Code 仍负责交互界面、工具调用、Plan mode 和会话管理。copilot-bridge 负责认证 GitHub、转换请求，并按 Copilot 实际支持的能力调整模型、thinking、effort 和 beta header。

## 2. 前置条件

- 已安装 Claude Code。
- GitHub 账号具有可用的 Copilot 订阅和模型权限。
- 已下载与操作系统匹配的 copilot-bridge release。
- 本机端口 `8765` 未被其他程序占用。

检查 Claude Code：

```bash
claude --version
```

## 3. 解压 copilot-bridge

Linux 示例：

```bash
tar -xzf copilot-bridge-0.3.2-linux-x64.tar.gz
cd copilot-bridge-0.3.2-linux-x64
chmod +x copilot-bridge
```

压缩包中的 `copilot-bridge` 和 `appsettings.json` 必须放在同一目录，bridge 会从可执行文件所在目录读取配置。

其他平台：

- Windows 使用对应的 `.zip`，运行 `copilot-bridge.exe`。
- macOS 使用对应的 `.tar.gz` 或 `.pkg`。如果 Gatekeeper 阻止未签名程序，可按项目 README 清除 quarantine 属性。

## 4. GitHub 设备登录

推荐显式执行登录命令：

```bash
./copilot-bridge auth login
```

终端会给出设备登录地址和一次性代码。浏览器通常不会自动打开，需要手动访问：

```text
https://github.com/login/device
```

输入终端显示的代码并授权。如果终端暂时只显示 device-code flow 已开始，先保持进程运行并等待 URL 和代码，不要立即结束进程。

检查登录状态：

```bash
./copilot-bridge auth status
./copilot-bridge auth whoami
./copilot-bridge auth copilot-status
```

登录后，bridge 会在自身目录保存加密 token 文件，例如 `github_token.dat`。不要分享或提交这个文件。

需要重新登录时：

```bash
./copilot-bridge auth logout
./copilot-bridge auth login
```

## 5. 启动 bridge

```bash
./copilot-bridge serve
```

也可以直接运行：

```bash
./copilot-bridge
```

默认监听 `127.0.0.1:8765`。保持该进程运行，然后在另一个终端启动 Claude Code。

指定其他端口：

```bash
./copilot-bridge serve --port 18765
```

如果修改端口，后面的 `ANTHROPIC_BASE_URL` 也必须同步修改。

## 6. 备份 Claude Code 配置

全局配置通常位于 `~/.claude/settings.json`。修改前先备份：

```bash
mkdir -p ~/.claude/backups
if [ -f ~/.claude/settings.json ]; then
  cp ~/.claude/settings.json \
    ~/.claude/backups/settings.json.$(date +%Y%m%d-%H%M%S).bak
fi
```

如果文件不存在，可以直接新建。

## 7. 配置 Claude Code

编辑 `~/.claude/settings.json`：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://localhost:8765/cc",
    "ANTHROPIC_AUTH_TOKEN": "dummy",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-8",
    "ANTHROPIC_DEFAULT_OPUS_MODEL_NAME": "Claude Opus 4.8",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL_NAME": "Claude Sonnet 5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME": "Claude Haiku 4.5",
    "CLAUDE_CODE_EFFORT_LEVEL": "max"
  },
  "model": "opus[1m]",
  "effortLevel": "max"
}
```

说明：

- `ANTHROPIC_AUTH_TOKEN` 对 bridge 没有实际认证作用，但 Claude Code 要求存在该变量，因此使用非敏感占位值 `dummy`。
- `ANTHROPIC_DEFAULT_*_MODEL` 把 Claude Code 的内置 `opus`、`sonnet`、`haiku` 别名映射到 Copilot 模型。
- `model: "opus[1m]"` 将新会话默认设为 Opus 4.8 的 1M context。
- `CLAUDE_CODE_EFFORT_LEVEL=max` 是确保主请求实际发送 `effort=max` 的关键配置。
- 顶层 `effortLevel` 同时保留，便于 Claude Code UI 显示和持久化。

`model` 和顶层 `effortLevel` 用于初始化默认值。执行 `/model` 或 `/effort` 后，Claude Code 可能重写这些顶层字段；只要 `env` 映射仍在、`/model` 显示目标模型，并且 bridge 主请求日志正确，这不表示配置失效。

也可以把同样的 `env` 块放入项目级 `.claude/settings.local.json`。全局配置适合所有项目共用；项目级配置适合只让特定项目使用 bridge。

## 8. 为什么模型 ID 必须使用连字符

这里有一个容易忽略但非常关键的差异：

| 用途 | 模型 ID |
| --- | --- |
| Claude Code 内部配置 | `claude-opus-4-8` |
| GitHub Copilot 实际模型 | `claude-opus-4.8` |

Claude Code 使用连字符形式识别 Opus 4.8 的能力，包括 1M context、adaptive thinking 和 `max` effort。若把配置直接写成 Copilot 的点号形式 `claude-opus-4.8`，Claude Code 可能把它当成旧版 Opus，主请求不会携带 `effort=max`，bridge 日志会显示：

```text
effort=(none)→high
```

正确使用 `claude-opus-4-8` 后，bridge 会安全解析到 Copilot 的点号模型：

```text
requested=claude-opus-4-8 resolved=claude-opus-4.8 effort=max
```

Haiku 同理使用 `claude-haiku-4-5`。Sonnet 5 的 Claude Code 和 Copilot ID 都是 `claude-sonnet-5`。

## 9. 在 Claude Code 中选择模型

启动 Claude Code：

```bash
claude
```

执行：

```text
/model
```

选择：

```text
Opus 4.8 (1M context)
```

也可以直接执行：

```text
/model opus[1m]
```

模型选择页面可能把它显示为 `Opus 4`，但显示文本不是最终判断依据。应以 bridge 日志中的 `resolved=claude-opus-4.8` 和 `context-1m-2025-08-07` 为准。

> Claude Code 恢复旧会话时可能丢失 `[1m]` 标记并按 200k 自动压缩。使用 `--resume` 后建议重新执行 `/model opus[1m]`。

## 10. 可用 Claude 模型

可随时查询当前 Copilot 实际暴露的模型：

```bash
./copilot-bridge debug list-models
```

copilot-bridge 0.3.2 实测模型如下：

| Claude Code 建议写法 | Copilot 模型 | 1M context | Effort |
| --- | --- | --- | --- |
| `claude-opus-4-8[1m]` | `claude-opus-4.8` | 支持 | `low` 到 `max`，含 `xhigh` |
| `claude-opus-4-7[1m]` | `claude-opus-4.7` | 支持 | `low` 到 `max`，含 `xhigh` |
| `claude-opus-4-6[1m]` | `claude-opus-4.6` | 支持 | 支持 `max`，不支持 `xhigh` |
| `claude-sonnet-5[1m]` | `claude-sonnet-5` | 支持 | `low` 到 `max`，含 `xhigh` |
| `claude-sonnet-4-6[1m]` | `claude-sonnet-4.6` | 支持 | 支持 `max`，不支持 `xhigh` |
| `claude-sonnet-4-5` | `claude-sonnet-4.5` | 不支持 | 不接受 effort 字段 |
| `claude-haiku-4-5` | `claude-haiku-4.5` | 不支持 | 不接受 effort 字段 |

bridge 会剥离目标模型不支持的 effort，而不是把无效请求直接发给 Copilot。

## 11. Effort 与 Plan mode

### Effort

默认 max 由以下配置控制：

```json
"CLAUDE_CODE_EFFORT_LEVEL": "max"
```

Claude Code 也支持当前会话临时覆盖：

```bash
claude --effort max
```

或在 Claude Code 内执行：

```text
/effort max
```

### Plan mode

Plan mode 是 Claude Code 的客户端权限模式，不是 Copilot 模型名称。可以在 Claude Code 中使用模式切换快捷键，或启动时指定：

```bash
claude --permission-mode plan
```

直接从 gateway discovery 列表选择的模型，可能缺少 Claude Code 内置的能力元数据，导致 effort 或相关 UI 选项不完整。优先使用配置过的内置别名：

```text
opus / opus[1m] / sonnet / sonnet[1m] / haiku
```

## 12. 验证是否真的使用 Opus 4.8 1M + max

不要只看 `/model` 页面。发出一条真实问题后检查 bridge 日志：

```bash
rg -n "summary messages" log/bridge-*.log | tail -n 10
```

如果没有 `rg`：

```bash
grep -n "summary messages" log/bridge-*.log | tail -n 10
```

主请求应同时满足：

```text
requested=claude-opus-4-8
resolved=claude-opus-4.8
context-1m-2025-08-07
effort=max
status=200
```

典型成功日志：

```text
summary messages requested=claude-opus-4-8 resolved=claude-opus-4.8
betas_in=[...,context-1m-2025-08-07,...,effort-2025-11-24]
effort=max max_tokens=64000 status=200 streaming=true
```

Claude Code 可能同时产生摘要、标题、状态检测等辅助请求。这些请求可能显示 `effort=(none)`、`max_tokens=64` 或 `streaming=false`，不代表主回答降级。判断用户问题对应的主请求时，重点看相同时间点、`streaming=true`、较大的 `max_tokens` 以及最终 `status=200` 的记录。

## 13. 可选：Linux 旧环境变量冲突排查

本节不是标准安装步骤。只有以下情况才需要检查：

- 以前把 DeepSeek、其他 Anthropic 代理或自建网关写进了 shell 配置。
- 修改 `settings.json` 后，Claude Code 仍然请求旧模型。
- bridge 日志显示 `requested=deepseek-*` 或其他非预期模型。

查看当前 shell 中的相关变量：

```bash
env | rg '^(ANTHROPIC|CLAUDE_CODE).*='
```

搜索 Linux shell 启动文件：

```bash
rg -n 'ANTHROPIC_|CLAUDE_CODE_|deepseek' \
  ~/.zshrc ~/.zprofile ~/.zshenv ~/.bashrc ~/.profile 2>/dev/null
```

如果发现旧配置，例如：

```bash
export ANTHROPIC_MODEL="deepseek-..."
export ANTHROPIC_BASE_URL="https://old-provider.example"
```

应删除或注释这些旧导出。若父进程仍可能继承旧值，也可以在 Linux 的 `~/.zshrc` 中加入可选清理块：

```bash
# Optional: prevent legacy Claude provider variables from overriding settings.json.
unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN ANTHROPIC_MODEL
unset ANTHROPIC_DEFAULT_OPUS_MODEL ANTHROPIC_DEFAULT_SONNET_MODEL
unset ANTHROPIC_DEFAULT_HAIKU_MODEL CLAUDE_CODE_SUBAGENT_MODEL
unset CLAUDE_CODE_EFFORT_LEVEL
```

然后重载 shell：

```bash
exec zsh
```

已经运行的 Claude Code 进程不会自动重载环境变量，必须退出并重新启动。

> 注意：如果你仍需要在其他命令中使用这些变量，不要全局 `unset`。改为给 Claude Code 写一个单独启动脚本，或只在启动 Claude Code 的终端中清理。

## 14. 常见问题

### 14.1 启动后没有自动打开网页

这是正常情况。保持 device-code 流程运行，手动打开：

```text
https://github.com/login/device
```

输入终端给出的代码。

### 14.2 Claude Code 仍显示或请求 DeepSeek

检查三处：

1. 退出所有旧 Claude Code 会话。
2. 检查 Linux shell 中是否仍有 `ANTHROPIC_MODEL` 或旧 `ANTHROPIC_BASE_URL`。
3. 确认 bridge 日志中的最新请求，而不是旧日志。

### 14.3 `/model` 页面没有全部 Copilot 模型

Claude Code 的 `/model` 页面不是 Copilot 模型目录的完整镜像。gateway discovery 可以发现更多模型，但这些条目可能缺少 Claude Code 内置的 effort、thinking 或 UI 能力元数据。

查询 Copilot 的真实模型列表：

```bash
./copilot-bridge debug list-models
```

需要稳定使用 effort 和 1M 时，优先通过 `ANTHROPIC_DEFAULT_*_MODEL` 映射 Claude Code 内置别名。

### 14.4 配置了 max，但日志显示 high

先确认模型 ID。错误配置：

```json
"ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4.8"
```

正确配置：

```json
"ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-8"
```

然后确认存在：

```json
"CLAUDE_CODE_EFFORT_LEVEL": "max"
```

完全退出 Claude Code 后重新启动，再检查主请求日志。

### 14.5 bridge 报 unknown model 或 No profile

先运行：

```bash
./copilot-bridge debug list-models
```

确认模型在当前 Copilot 账号中可用。模型名称拼写必须正确。对于 Claude Code 原生连字符 ID，bridge 0.3.2 会解析到对应的 Copilot 点号 ID。

### 14.6 端口连接失败

确认 bridge 正在运行：

```bash
ss -ltnp | rg ':8765'
```

确认 Claude 配置地址为：

```text
http://localhost:8765/cc
```

### 14.7 内置 WebSearch 不工作

Copilot 不提供 Claude Code 内置 WebSearch 所依赖的 Anthropic 服务端搜索。需要联网搜索时，配置独立的搜索 MCP server，并禁用内置 WebSearch 工具。

## 15. appsettings.json 常用设置

bridge 的默认配置文件位于可执行文件旁边。

### 修改端口

```json
{
  "Server": {
    "Port": 8765
  }
}
```

命令行 `--port` 优先于配置文件。

### 请求 trace

默认关闭：

```json
{
  "Tracing": {
    "Enabled": false,
    "Directory": "request-traces"
  }
}
```

只在调试协议问题时临时开启。trace 文件包含完整 prompt、headers 和响应，排查结束后立即关闭并妥善删除。

### ResponseLeakGuard

建议保持默认开启。它用于检测模型把工具调用或 Claude Code 控制消息作为普通文本泄漏的情况，并触发安全重试。修改相关开关后需要重启 bridge。

## 16. 安全注意事项

- 不要提交 `github_token.dat`、request trace、真实 API token 或包含凭据的旧备份。
- `ANTHROPIC_AUTH_TOKEN=dummy` 只是 Claude Code 的占位值，不是 GitHub token。
- 默认仅监听 localhost；除非明确理解风险，否则不要把端口暴露到局域网或公网。
- Linux/macOS 的 token 文件虽然加密，但同一用户权限下的本地攻击者仍可能访问或推导相关密钥材料，应保护 bridge 目录权限。
- 配置备份可能包含以前使用过的真实 provider token，同样需要保护。

## 17. 最小检查清单

```text
[ ] copilot-bridge 与 appsettings.json 位于同一目录
[ ] ./copilot-bridge auth status 显示 Logged in
[ ] bridge 正在监听 127.0.0.1:8765
[ ] ANTHROPIC_BASE_URL 指向 http://localhost:8765/cc
[ ] Opus 映射使用 claude-opus-4-8，而不是 claude-opus-4.8
[ ] CLAUDE_CODE_EFFORT_LEVEL=max
[ ] Claude Code 中选择 opus[1m]
[ ] 主请求日志包含 resolved=claude-opus-4.8
[ ] 主请求日志包含 context-1m-2025-08-07
[ ] 主请求日志包含 effort=max 和 status=200
```

完成以上检查后，即可确认 Claude Code 的主请求正在使用 GitHub Copilot 提供的 Claude Opus 4.8、1M context 和 max effort。
