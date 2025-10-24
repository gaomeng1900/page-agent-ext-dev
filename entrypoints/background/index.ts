// 生成随机 UUID
function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
		/[xy]/g,
		function (c) {
			const r = (Math.random() * 16) | 0
			const v = c === 'x' ? r : (r & 0x3) | 0x8
			return v.toString(16)
		},
	)
}

// 存储认证信息：tabId -> 是否已认证
const authenticatedTabs = new Map<number, boolean>()

// 生成并存储 API key
let apiKey = generateUUID()

// 每次重启 background 重新生成 key
console.log('Generated new API key:', apiKey)

export default defineBackground(() => {
	console.log('Background service worker started')

	// 监听来自 content script 的消息
	chrome.runtime.onMessage.addListener(
		(
			message: any,
			sender: chrome.runtime.MessageSender,
			sendResponse: (response: any) => void,
		) => {
			const handleMessage = async () => {
				try {
					// 获取当前 API key（用于 popup 显示）
					if (message.type === 'GET_API_KEY') {
						return {
							success: true,
							data: apiKey,
						}
					}

					// 刷新 API key
					if (message.type === 'REFRESH_API_KEY') {
						apiKey = generateUUID()
						authenticatedTabs.clear()
						console.log('Refreshed API key:', apiKey)
						return {
							success: true,
							data: apiKey,
						}
					}

					// Link 认证
					if (message.type === 'LINK') {
						const { key } = message.payload
						const tabId = sender.tab?.id

						if (!tabId) {
							return {
								success: false,
								error: 'No tab ID',
							}
						}

						if (key === apiKey) {
							authenticatedTabs.set(tabId, true)
							console.log(`Tab ${tabId} authenticated`)
							return {
								success: true,
								data: { authenticated: true },
							}
						} else {
							return {
								success: false,
								error: 'Invalid key',
							}
						}
					}

					// 验证认证状态
					const tabId = sender.tab?.id
					if (!tabId || !authenticatedTabs.get(tabId)) {
						return {
							success: false,
							error: 'Not authenticated. Call link(key) first.',
						}
					}

					if (message.type === 'GET_TABS') {
						// 获取所有 tabs
						const tabs = await chrome.tabs.query({})
						return {
							success: true,
							data: tabs.map((tab: chrome.tabs.Tab) => ({
								id: tab.id,
								title: tab.title,
								url: tab.url,
								active: tab.active,
								windowId: tab.windowId,
							})),
						}
					}

					if (message.type === 'EXECUTE_SCRIPT') {
						const { tabId, code } = message.payload

						if (!tabId || !code) {
							return {
								success: false,
								error: 'Missing tabId or code',
							}
						}

						// 在目标 tab 的 MAIN world 中执行代码
						// 这样可以绕过 isolated world 的 CSP 限制
						const results = await chrome.scripting.executeScript({
							target: { tabId },
							world: 'MAIN',
							func: (codeString: string) => {
								// 在 MAIN world 中，eval 是允许的
								// eslint-disable-next-line no-eval
								return eval(codeString)
							},
							args: [code],
						})

						return {
							success: true,
							data: results[0]?.result,
						}
					}

					return {
						success: false,
						error: 'Unknown message type',
					}
				} catch (error) {
					return {
						success: false,
						error:
							error instanceof Error
								? error.message
								: String(error),
					}
				}
			}

			// 异步处理并发送响应
			handleMessage().then(sendResponse)
			return true // 保持消息通道开启以支持异步响应
		},
	)
})
