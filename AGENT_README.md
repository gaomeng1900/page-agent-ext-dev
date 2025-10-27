# Browser Agent - AI 驱动的浏览器自动化

## 概述

Browser Agent 是一个运行在浏览器扩展中的 AI Agent，能够通过自然语言指令控制浏览器。它使用**视觉输入（截图）**而不是 DOM 清洗，让 LLM 能够"看到"页面的真实状态。

## 核心特性

### 🎯 与 page-agent 的关键区别

| 特性 | page-agent | Browser Agent |
|------|-----------|---------------|
| 运行环境 | 页面内（Web） | 浏览器扩展（Background） |
| 权限范围 | 单个页面 | 所有标签页 |
| 页面感知 | DOM 清洗 + 元素标注 | 截图（视觉输入） |
| 截图能力 | ❌ 无权限 | ✅ 原生支持 |
| 跨 Tab 操作 | ❌ 不支持 | ✅ 完全支持 |
| Canvas/Video | ❌ 无法感知 | ✅ 可见即可感知 |

### 🛠️ 工具集

Agent 提供以下工具来控制浏览器：

- **open_tab** - 打开新标签页
- **active_tab** - 切换到指定标签页
- **close_tab** - 关闭标签页
- **reload_tab** - 重新加载页面
- **scroll_page** - 滚动页面（up/down/top/bottom）
- **click** - 点击元素（使用 CSS 选择器）
- **keydown** - 键盘输入
- **wait** - 等待指定时间
- **done** - 标记任务完成

### 🧠 上下文感知

每次与 LLM 交互时，Agent 会自动提供：

1. **Tab 列表** - 所有打开的标签页（ID、标题、URL）
2. **当前激活的 Tab** - 高亮显示
3. **当前 Tab 的截图** - 完整的视觉信息

## 使用指南

### 1. 打开 Agent 控制面板

点击扩展图标，然后点击 **"打开 Agent 控制面板"** 按钮。

### 2. 配置 LLM

在控制面板中配置：

- **API Key**: 你的 OpenAI API Key（或兼容服务）
- **Base URL**: API 端点（默认：`https://api.openai.com/v1`）
- **Model**: 模型名称（推荐：`gpt-4o`，`gpt-4-vision-preview`，或其他支持视觉的模型）

> ⚠️ **重要**：必须使用支持视觉输入的模型（如 GPT-4o），否则无法处理截图！

### 3. 输入任务

在任务输入框中输入自然语言指令，例如：

- `"Open Google and search for 'AI agents'"`
- `"打开知乎，搜索'人工智能'，并点击第一篇文章"`
- `"在当前页面填写表单，用户名填'test'，密码填'123456'，然后提交"`
- `"打开 GitHub，找到 trending 页面，截图保存"`

### 4. 执行任务

点击 **"▶️ Start Agent"** 按钮，Agent 将：

1. 分析当前浏览器状态（tabs + 截图）
2. 调用 LLM 决策下一步操作
3. 执行工具（打开页面、点击、输入等）
4. 观察结果，继续下一步
5. 重复直到任务完成或达到最大步数

### 5. 观察执行过程

控制面板会实时显示：

- 每一步的执行时间和 token 消耗
- 当前截图
- LLM 的工具调用
- 工具执行结果

## 架构设计

```
┌─────────────────────────────────────┐
│         Panel (UI)                  │
│   - Task input                      │
│   - Config (API Key, Model)         │
│   - Execution history               │
└─────────────┬───────────────────────┘
              │ chrome.runtime.sendMessage
              ↓
┌─────────────────────────────────────┐
│    Background Service Worker        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   BrowserAgent                │  │
│  │   - Collect context           │  │
│  │   - Call LLM                  │  │
│  │   - Execute tools             │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Tools                        │  │
│  │   - open_tab, click, etc.     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   LLMClient                    │  │
│  │   - OpenAI compatible         │  │
│  │   - Vision support            │  │
│  └───────────────────────────────┘  │
└─────────────┬───────────────────────┘
              │ chrome.tabs.*
              │ chrome.scripting.*
              │ chrome.tabs.captureVisibleTab
              ↓
┌─────────────────────────────────────┐
│         Browser Tabs                │
│   - Tab 1: Google                   │
│   - Tab 2: GitHub                   │
│   - Tab 3: ...                      │
└─────────────────────────────────────┘
```

## 工具实现细节

### 截图（chrome.tabs.captureVisibleTab）

```typescript
const screenshot = await chrome.tabs.captureVisibleTab(
  windowId,
  { format: 'png' }
)
// 返回 data URL，直接传给 LLM
```

### 点击（chrome.scripting.executeScript）

```typescript
await chrome.scripting.executeScript({
  target: { tabId },
  func: (selector: string) => {
    const element = document.querySelector(selector)
    element?.click()
  },
  args: [selector],
})
```

### 键盘输入

支持三种方式：

1. `input.value = text` （适用于 input/textarea）
2. `element.textContent = text` （适用于 contenteditable）
3. 模拟 KeyboardEvent （兜底方案）

## 系统提示（System Prompt）

Agent 使用以下指导原则：

1. **逐步思考** - 分析当前状态 → 决策 → 执行 → 观察
2. **工具优先** - 总是使用提供的工具，不要臆测结果
3. **等待策略** - 页面变化后使用 `wait` 工具观察结果
4. **选择器精准** - 使用 CSS 选择器时要小心，从截图中推断结构
5. **任务完成** - 完成后调用 `done` 工具并总结结果

## 配置示例

### 使用 OpenAI

```javascript
{
  apiKey: "sk-...",
  baseURL: "https://api.openai.com/v1",
  model: "gpt-4o"
}
```

### 使用兼容服务（如 Ollama + LLaVA）

```javascript
{
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1",
  model: "llava:latest"
}
```

## 最佳实践

### ✅ 推荐

- 使用具体的任务描述（`"打开 Google 并搜索 X"` 而不是 `"搜索"`）
- 为复杂任务设置更大的 `maxSteps`（默认 20）
- 在任务中明确指定期望的结果
- 使用支持视觉的模型（GPT-4o, GPT-4-Vision, Claude-3-Opus）

### ❌ 避免

- 不要让 Agent 处理需要登录的私密操作（安全风险）
- 不要期望 Agent 理解极其复杂的页面布局（可能需要多次尝试）
- 不要在没有截图权限的页面上使用（如 `chrome://` 页面）

## 故障排查

### Agent 无法启动

- 检查 API Key 是否正确
- 检查 Base URL 是否可访问
- 检查模型是否支持视觉输入

### 工具执行失败

- **click 失败** - 检查 CSS 选择器是否正确
- **keydown 失败** - 检查元素是否可聚焦
- **截图失败** - 检查是否有 `<all_urls>` 权限

### LLM 不理解截图

- 确保使用支持视觉的模型
- 检查截图是否正确传递（data URL 格式）
- 可能需要在任务描述中强调"查看截图"

## 开发

### 添加新工具

1. 在 `tools.ts` 中定义工具：

```typescript
export const myToolTool: Tool = {
  name: 'my_tool',
  description: '...',
  parameters: { ... }
}

export async function myTool(args: any): Promise<string> {
  // 实现逻辑
  return "✅ Success"
}
```

2. 添加到工具列表：

```typescript
export const allTools = [..., myToolTool]
export const toolExecutors = {
  ...,
  my_tool: myTool
}
```

### 自定义系统提示

在创建 Agent 时传入：

```typescript
const agent = new BrowserAgent({
  ...config,
  systemPrompt: "Your custom prompt..."
})
```

## 局限性

1. **视觉理解依赖 LLM** - 截图质量和 LLM 的视觉能力直接影响效果
2. **无状态持久化** - Agent 刷新后历史丢失
3. **同步执行** - 一次只能运行一个任务
4. **选择器脆弱性** - 页面结构变化可能导致选择器失效

## 未来计划

- [ ] 支持页面录制和重放
- [ ] 添加 DOM 清洗作为视觉的补充（参考 page-agent）
- [ ] 支持多 Agent 协作
- [ ] 添加任务队列和历史管理
- [ ] 支持自定义工具插件系统

## 参考

- **page-agent**: <https://github.com/alibaba/page-agent>
- **browser-use**: <https://github.com/browser-use/browser-use>
- **OpenAI Vision API**: <https://platform.openai.com/docs/guides/vision>

---

**License**: ISC
