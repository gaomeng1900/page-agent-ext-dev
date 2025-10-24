export default defineContentScript({
	matches: ['<all_urls>'],
	async main(ctx) {
		console.log('Page agent content script loaded in isolated world')

		// 注入脚本到 main world
		// injectScript 会自动调用 browser.runtime.getURL
		await injectScript('/main-world.js' as any, {
			keepInDom: true,
		})
		console.log('Injected main-world script')

		// 监听来自页面的消息并转发到 background
		window.addEventListener('message', async (event) => {
			if (event.source !== window) return
			if (event.data.type !== 'PAGE_AGENT_REQUEST') return

			const { messageId, action, payload } = event.data

			try {
				let response
				if (action === 'GET_TABS') {
					response = await chrome.runtime.sendMessage({
						type: 'GET_TABS',
					})
				} else if (action === 'EXECUTE_SCRIPT') {
					response = await chrome.runtime.sendMessage({
						type: 'EXECUTE_SCRIPT',
						payload,
					})
				} else {
					response = {
						success: false,
						error: 'Unknown action',
					}
				}

				window.postMessage(
					{
						type: 'PAGE_AGENT_RESPONSE',
						messageId,
						...response,
					},
					'*',
				)
			} catch (error) {
				window.postMessage(
					{
						type: 'PAGE_AGENT_RESPONSE',
						messageId,
						success: false,
						error:
							error instanceof Error
								? error.message
								: String(error),
					},
					'*',
				)
			}
		})
	},
})
