// 这个脚本会被注入到页面的 main world
export default defineUnlistedScript(() => {
	console.log(
		'%c🌐 Page Agent Extension API',
		'color: #9c27b0; font-weight: bold; font-size: 16px',
	)

	// 生成唯一的 session ID
	const sessionId =
		'session_' +
		Math.random().toString(36).substring(2) +
		Date.now().toString(36)

	console.log(
		'%c   Session ID: ' + sessionId,
		'color: #673ab7; font-weight: bold',
	)

	// 通用的消息发送函数
	function sendMessage(action: string, payload?: any): Promise<any> {
		return new Promise((resolve, reject) => {
			const messageId = Math.random().toString(36)

			console.log(
				`%c➡️  [Page → Content] ${action}`,
				'color: #2196f3; font-weight: bold',
			)
			console.log(
				`%c   Message ID: ${messageId.substring(
					0,
					8,
				)}... | Session: ${sessionId.substring(0, 12)}...`,
				'color: #999',
			)

			const listener = (event: MessageEvent) => {
				if (event.source !== window) return
				if (event.data.type !== 'PAGE_AGENT_RESPONSE') return
				if (event.data.messageId !== messageId) return

				window.removeEventListener('message', listener)

				console.log(
					`%c⬅️  [Content → Page] Response`,
					'color: #4caf50; font-weight: bold',
				)
				console.log(
					`%c   Success: ${event.data.success}`,
					'color: #999',
				)

				if (event.data.success) {
					resolve(event.data.data)
				} else {
					reject(new Error(event.data.error))
				}
			}

			window.addEventListener('message', listener)

			window.postMessage(
				{
					type: 'PAGE_AGENT_REQUEST',
					messageId,
					sessionId,
					action,
					payload,
				},
				'*',
			)
		})
	}

	// 创建 pageAgentExtension 对象
	;(window as any).pageAgentExtension = {
		/**
		 * 使用 key 进行认证
		 * @param key - 从插件弹窗获取的 API key
		 */
		async link(key: string) {
			if (!key || typeof key !== 'string') {
				throw new Error('Key must be a non-empty string')
			}
			const result = await sendMessage('LINK', { key })
			console.log('✅ Page Agent Extension authenticated')
			return result
		},

		/**
		 * 获取所有 tabs 列表
		 */
		async listTabs() {
			return await sendMessage('GET_TABS')
		},

		/**
		 * 在指定 tab 中执行 JavaScript 代码
		 * @param tabId - 目标 tab 的 ID
		 * @param script - 要执行的 JavaScript 代码字符串
		 */
		async executeScript(tabId: number, script: string) {
			if (typeof tabId !== 'number') {
				throw new Error('tabId must be a number')
			}
			if (typeof script !== 'string') {
				throw new Error('script must be a string')
			}
			return await sendMessage('EXECUTE_SCRIPT', { tabId, code: script })
		},
	}

	console.log(
		'%c✅ API Ready',
		'color: #4caf50; font-weight: bold; font-size: 14px',
	)
	console.log(
		'%c   • pageAgentExtension.link(key)\n   • pageAgentExtension.listTabs()\n   • pageAgentExtension.executeScript(tabId, script)',
		'color: #999; font-size: 12px',
	)
})
