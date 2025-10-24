// 这个脚本会被注入到页面的 main world
export default defineUnlistedScript(() => {
	console.log('Page agent API injecting into main world...')

	// 使用 window.postMessage 与 content script 通信
	;(window as any).getTabs = async function () {
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
					messageId: messageId,
					action: 'GET_TABS',
				},
				'*',
			)
		})
	}
	;(window as any).execute = async function (tabId: number, code: string) {
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
					messageId: messageId,
					action: 'EXECUTE_SCRIPT',
					payload: { tabId, code },
				},
				'*',
			)
		})
	}

	console.log('Page agent API injected: getTabs(), execute()')
})
