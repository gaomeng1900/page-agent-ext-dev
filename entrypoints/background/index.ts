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
