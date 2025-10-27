# 🚀 快速开始指南

## 1. 安装依赖

```bash
npm install
```

## 2. 启动开发模式

```bash
npm run dev
```

这会自动：

- 打开 Chrome 浏览器
- 加载扩展
- 监听文件变化并自动重载

## 3. 使用 AI Agent

### 3.1 打开控制面板

1. 点击浏览器工具栏的扩展图标
2. 点击 **"打开 Agent 控制面板"** 按钮

### 3.2 配置 LLM

在控制面板中输入：

- **API Key**: 你的 OpenAI API Key（`sk-...`）
- **Base URL**: `https://api.openai.com/v1`（或其他兼容服务）
- **Model**: `gpt-4o`（必须支持视觉输入！）

> 💡 **提示**: 如果你使用其他服务（如本地 Ollama），确保：
>
> - 模型支持视觉输入（如 `llava:latest`）
> - Base URL 正确（如 `http://localhost:11434/v1`）

### 3.3 尝试第一个任务

在任务输入框中输入：

```
打开 Google 并搜索 'browser automation'
```

点击 **"▶️ Start Agent"**，观察 Agent 执行过程！

## 4. 查看 Demo 页面

访问测试页面查看更多示例：

```
http://localhost:3000/agent-demo.html
```

## 5. 示例任务

### 简单任务

```
打开 https://example.com
```

### 搜索任务

```
打开 Google，搜索 'AI agents'，打开第一个结果
```

### 多步骤任务

```
1. 打开 GitHub
2. 点击搜索框
3. 输入 'page-agent'
4. 点击搜索按钮
5. 打开第一个结果
```

### Tab 管理

```
列出所有打开的标签页，关闭标题包含 'test' 的标签页
```

## 6. 观察执行过程

控制面板会实时显示：

- ✅ 每步的执行状态
- 📸 当前页面截图
- 🔧 LLM 调用的工具
- 📤 工具执行结果
- 💰 Token 使用统计

## 7. 故障排查

### Agent 无法启动

**检查项**：

- [ ] API Key 是否正确
- [ ] Base URL 是否可访问
- [ ] 模型是否支持视觉输入

**测试方法**：

```bash
# 测试 OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 工具执行失败

**常见问题**：

1. **click 失败** - CSS 选择器可能不正确
   - 在控制台中测试：`document.querySelector('button.submit')`

2. **keydown 失败** - 元素可能不可聚焦
   - 确保元素是 `<input>`、`<textarea>` 或 `contenteditable`

3. **截图失败** - 权限不足
   - 检查扩展是否有 `<all_urls>` 权限

### LLM 不理解截图

**解决方法**：

1. 确认使用支持视觉的模型（如 `gpt-4o`）
2. 在任务描述中强调"查看截图"
3. 提供更具体的任务描述

## 8. 构建生产版本

```bash
# Chrome
npm run build

# Firefox
npm run build:firefox

# 打包 zip
npm run zip
```

## 9. 进阶使用

### 自定义系统提示

修改 `entrypoints/background/agent/agent.ts` 中的 `getDefaultSystemPrompt()`

### 添加新工具

1. 在 `entrypoints/background/agent/tools.ts` 中定义工具
2. 添加到 `allTools` 和 `toolExecutors`

### 调整最大步数

在控制面板配置中（未来版本会支持 UI 配置）：

```typescript
const config = {
  ...
  maxSteps: 30  // 默认 20
}
```

## 10. 相关资源

- **完整文档**: [AGENT_README.md](./AGENT_README.md)
- **实现总结**: [README_SUMMARY.md](./README_SUMMARY.md)
- **page-agent**: <https://github.com/alibaba/page-agent>
- **本地 submodule**: `/workspaces/page-agent-ext-dev/page-agent/`

---

## 🎉 开始探索吧

试试这个任务：

```
打开知乎，搜索'人工智能'，阅读第一篇文章的标题和摘要
```

Happy Hacking! 🚀
