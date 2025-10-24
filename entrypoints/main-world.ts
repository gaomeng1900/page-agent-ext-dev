// 这个脚本会被注入到页面的 main world
export default defineUnlistedScript(() => {
	console.log('Page Agent Extension API initializing...')

	// 通用的消息发送函数
	function sendMessage(action: string, payload?: any): Promise<any> {
		return new Promise((resolve, reject) => {
			const messageId = Math.random().toString(36)

			const listener = (event: MessageEvent) => {
				if (event.source !== window) return
				if (event.data.type !== 'PAGE_AGENT_RESPONSE') return
				if (event.data.messageId !== messageId) return

				window.removeEventListener('message', listener)

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
		'✅ Page Agent Extension API ready: pageAgentExtension.link(key), listTabs(), executeScript()',
	)
})
