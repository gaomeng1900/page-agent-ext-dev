import chalk from 'chalk'

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

// 美化日志
function logMessage(
	direction: 'incoming' | 'outgoing',
	type: string,
	data?: any,
) {
	const timestamp = new Date().toLocaleTimeString()
	const arrow = direction === 'incoming' ? '📥' : '📤'
	const color = direction === 'incoming' ? chalk.cyan : chalk.green

	console.log(
		color.bold(`\n${arrow} [${timestamp}] ${direction.toUpperCase()}`),
	)
	console.log(chalk.yellow(`   Type: ${type}`))

	if (data) {
		console.log(chalk.gray('   Data:'), data)
	}
}

// 存储认证信息：sessionId -> { key: string, tabId: number }
const authenticatedSessions = new Map<
	string,
	{ key: string; tabId: number; timestamp: number }
>()

// 生成并存储 API key
let apiKey = generateUUID()

// 每次重启 background 重新生成 key
console.log('Generated new API key:', apiKey)

export default defineBackground(() => {
	console.log(chalk.magenta.bold('\n🚀 Background service worker started'))
	console.log(chalk.yellow(`   API Key: ${apiKey}\n`))

	// 监听 tab 关闭事件，清理该 tab 的所有 session
	chrome.tabs.onRemoved.addListener((tabId) => {
		for (const [sessionId, session] of authenticatedSessions.entries()) {
			if (session.tabId === tabId) {
				authenticatedSessions.delete(sessionId)
				console.log(
					chalk.red(
						`\n🗑️  Tab ${tabId} closed, cleared session ${sessionId}\n`,
					),
				)
			}
		}
	})

	// 监听来自 content script 的消息
	chrome.runtime.onMessage.addListener(
		(
			message: any,
			sender: chrome.runtime.MessageSender,
			sendResponse: (response: any) => void,
		) => {
			const handleMessage = async () => {
				try {
					// 记录收到的消息
					logMessage('incoming', message.type, {
						sessionId: message.sessionId,
						tabId: sender.tab?.id,
						payload: message.payload,
					})

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
						authenticatedSessions.clear()
						console.log(
							chalk.magenta.bold(
								`\n🔄 Refreshed API key: ${apiKey}`,
							),
						)
						console.log(
							chalk.red(
								`   Cleared ${authenticatedSessions.size} sessions\n`,
							),
						)
						return {
							success: true,
							data: apiKey,
						}
					}

					// Link 认证
					if (message.type === 'LINK') {
						const { key } = message.payload
						const { sessionId } = message
						const tabId = sender.tab?.id

						if (!tabId) {
							return {
								success: false,
								error: 'No tab ID',
							}
						}

						if (!sessionId) {
							return {
								success: false,
								error: 'No session ID',
							}
						}

						if (key === apiKey) {
							authenticatedSessions.set(sessionId, {
								key,
								tabId,
								timestamp: Date.now(),
							})
							console.log(
								chalk.green.bold(
									`\n✅ Session authenticated: ${sessionId.substring(
										0,
										12,
									)}...`,
								),
							)
							console.log(chalk.gray(`   Tab ID: ${tabId}\n`))
							return {
								success: true,
								data: { authenticated: true, sessionId },
							}
						} else {
							return {
								success: false,
								error: 'Invalid key',
							}
						}
					}

					// 验证认证状态
					const { sessionId } = message
					if (!sessionId) {
						return {
							success: false,
							error: 'No session ID',
						}
					}

					const session = authenticatedSessions.get(sessionId)
					if (!session || session.key !== apiKey) {
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
					console.log(
						chalk.red.bold('\n❌ Error processing message:'),
						error,
					)
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
			handleMessage().then((response) => {
				logMessage('outgoing', message.type, {
					success: response.success,
					data: (response as any).data,
					error: (response as any).error,
				})
				sendResponse(response)
			})
			return true // 保持消息通道开启以支持异步响应
		},
	)
})
