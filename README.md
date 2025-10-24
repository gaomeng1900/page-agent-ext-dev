# Page Agent Extension

一个 Chrome 浏览器扩展，允许特定网页通过认证后控制浏览器的其他 tab，包括获取 tab 列表、执行脚本等高权限操作。

## 核心功能

- **Tab 管理**：获取所有打开的 tabs 信息（ID、标题、URL 等）
- **脚本执行**：在指定 tab 中动态执行 JavaScript 代码并返回结果
- **安全认证**：基于 Session ID + API Key 的双重认证机制
- **权限隔离**：每个页面实例独立认证，页面刷新需重新认证

## 技术架构

### 整体流程

```bash
┌─────────────────┐
│   User Page     │  (需要控制浏览器的网页)
│  (Main World)   │
└────────┬────────┘
         │ window.postMessage
         ↓
┌─────────────────┐
│ Content Script  │  (消息中转层，运行在 Isolated World)
│ (Isolated)      │
└────────┬────────┘
         │ chrome.runtime.sendMessage
         ↓
┌─────────────────┐
│   Background    │  (权限管理和 API 调用中枢)
│ Service Worker  │
└────────┬────────┘
         │ chrome.tabs / chrome.scripting
         ↓
┌─────────────────┐
│  Target Tabs    │  (被控制的其他 tabs)
└─────────────────┘
```

### 核心组件

#### 1. Main World Script (`entrypoints/main-world.ts`)

- **运行环境**：页面的主世界（Main World），与网页 JS 同环境
- **职责**：
  - 生成唯一的 `sessionId`（每次页面加载生成新 ID）
  - 向 `window` 对象注入 `pageAgentExtension` API
  - 通过 `window.postMessage` 与 Content Script 通信
- **暴露的 API**：

  ```javascript
  pageAgentExtension.link(key)              // 认证
  pageAgentExtension.listTabs()             // 获取 tab 列表
  pageAgentExtension.executeScript(id, js)  // 在指定 tab 执行脚本
  ```

#### 2. Content Script (`entrypoints/content/index.ts`)

- **运行环境**：浏览器的隔离世界（Isolated World）
- **职责**：
  - 使用 `injectScript` 将 main-world 脚本注入到页面
  - 监听来自页面的 `postMessage`，转发到 Background
  - 接收 Background 响应，通过 `postMessage` 返回给页面
- **为什么需要**：Main World 无法直接访问 `chrome.runtime` API

#### 3. Background Service Worker (`entrypoints/background/index.ts`)

- **运行环境**：浏览器后台，持久运行
- **职责**：
  - 生成并存储 API Key（每次启动生成新 key）
  - 维护已认证的 sessions（`sessionId -> { key, tabId, timestamp }`）
  - 验证每个请求的权限（`sessionId + key` 双重验证）
  - 调用 Chrome API 执行实际操作（`chrome.tabs.query`、`chrome.scripting.executeScript`）
  - 清理关闭 tab 的 sessions

#### 4. Popup (`entrypoints/popup/`)

- **运行环境**：浏览器工具栏的弹窗页面
- **职责**：
  - 显示当前的 API Key
  - 提供复制 Key 功能
  - 提供刷新 Key 功能（会清空所有已认证的 sessions）

## 安全机制

### 认证流程

1. **生成 Session ID**：每次页面加载时，main-world 脚本生成唯一的 `sessionId`
2. **获取 API Key**：用户打开 Popup，复制显示的 key
3. **Link 认证**：在控制页面调用 `pageAgentExtension.link(key)`
4. **后续调用**：认证成功后，所有请求携带 `sessionId`，Background 验证权限

### 安全特性

✅ **Session 隔离**：每个页面实例独立认证，刷新页面后需重新 link  
✅ **Key 轮换**：支持手动刷新 API Key，使所有已认证页面失效  
✅ **Tab 绑定**：Session 与 Tab ID 绑定，Tab 关闭自动清理  
✅ **双重验证**：验证 `sessionId` 存在 + `key` 匹配  
✅ **权限最小化**：只有已认证的 session 才能调用高权限 API

### CSP 绕过

- 使用 `chrome.scripting.executeScript({ world: 'MAIN' })` 在目标 tab 的主世界执行代码
- 绕过了 Isolated World 的 CSP 限制，`eval` 可以正常工作

## 开发流程

### 安装依赖

```bash
npm install
```

### 启动开发模式

```bash
npm run dev
```

- 自动打开 Chrome 浏览器并加载扩展
- 监听文件变化，自动重新构建并重载扩展
- 开发服务器地址：`http://localhost:3001`

### 构建生产版本

```bash
npm run build        # Chrome 版本
npm run build:firefox # Firefox 版本
```

### 打包发布

```bash
npm run zip          # Chrome 版本
npm run zip:firefox  # Firefox 版本
```

## 使用示例

### 1. 获取 API Key

点击浏览器工具栏的扩展图标，打开 Popup，复制显示的 API Key。

### 2. 在控制页面中认证

```javascript
// 在你的控制页面中
await pageAgentExtension.link('your-api-key-here')
// ✅ 认证成功
```

### 3. 获取所有 tabs

```javascript
const tabs = await pageAgentExtension.listTabs()
console.log(tabs)
// [{ id: 123, title: 'Google', url: 'https://google.com', ... }, ...]
```

### 4. 在目标 tab 执行脚本

```javascript
// 在 tab 123 中获取页面标题
const title = await pageAgentExtension.executeScript(123, 'document.title')
console.log(title) // "Google"

// 在 tab 123 中修改页面
await pageAgentExtension.executeScript(123, `
  document.body.style.backgroundColor = 'red';
  return 'done';
`)
```

## 测试页面

访问 `http://localhost:3001/test.html` 可以看到预置的测试页面，包含：

- 认证流程测试
- 获取 tabs 测试
- 执行脚本测试

## 调试

### 查看日志

- **Background Console**：右键扩展图标 → "检查弹出内容" → "Service Worker"
- **Content Script Console**：打开网页的开发者工具 → Console
- **Page Console**：打开网页的开发者工具 → Console

所有消息都有彩色美化输出，方便调试：

- 🚀 启动信息
- 📥 收到消息
- 📤 发送响应
- ✅ 成功操作
- ❌ 错误信息

## 技术栈

- **框架**：[WXT](https://wxt.dev/) - 现代化的浏览器扩展开发框架
- **语言**：TypeScript
- **构建工具**：Vite
- **样式**：Tailwind CSS
- **日志美化**：chalk（仅 background）+ console 样式（content/page）

## 项目结构

```bash
page-agent-ext-dev/
├── entrypoints/
│   ├── background/
│   │   └── index.ts           # Background Service Worker
│   ├── content/
│   │   └── index.ts           # Content Script (Isolated World)
│   ├── main-world.ts          # Unlisted Script (Main World)
│   └── popup/
│       ├── index.html         # Popup UI
│       └── main.ts            # Popup 逻辑
├── public/
│   └── test.html              # 测试页面
├── wxt.config.ts              # WXT 配置
├── package.json
└── README
```

## 注意事项

⚠️ **安全警告**：此扩展提供了极高的浏览器控制权限，仅供可信页面使用。请妥善保管 API Key，不要在公开场合泄露。

⚠️ **刷新行为**：页面刷新后需要重新 `link()`，这是有意设计的安全特性，防止页面跳转后被恶意利用。

⚠️ **eval 警告**：代码中使用了 `eval` 来动态执行脚本，这在 MAIN world 中是安全的，但在构建时会有警告，可以忽略。

## License

ISC
