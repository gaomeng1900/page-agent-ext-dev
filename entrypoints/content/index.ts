export default defineContentScript({
	matches: ['<all_urls>'],
	async main(ctx) {
		console.log(
			'%c🔌 Page Agent Content Script',
			'color: #00bcd4; font-weight: bold; font-size: 14px',
		)
		console.log(
			'%c   Running in isolated world',
			'color: #999; font-size: 12px',
		)

		// 注入脚本到 main world
		// injectScript 会自动调用 browser.runtime.getURL
		await injectScript('/main-world.js' as any, {
			keepInDom: true,
		})
		console.log(
			'%c✅ Injected main-world script',
			'color: #4caf50; font-weight: bold',
		)

		// 监听来自页面的消息并转发到 background
		window.addEventListener('message', async (event) => {
			if (event.source !== window) return
			if (event.data.type !== 'PAGE_AGENT_REQUEST') return

			const { messageId, sessionId, action, payload } = event.data

			console.log(
				'%c📨 [Content] Forwarding to background',
				'color: #ff9800; font-weight: bold',
			)
			console.log(
				`%c   Action: ${action} | Session: ${sessionId?.substring(
					0,
					12,
				)}...`,
				'color: #999',
			)

			try {
				let response

				// 根据不同的 action 转发到 background
				if (action === 'LINK') {
					response = await chrome.runtime.sendMessage({
						type: 'LINK',
						sessionId,
						payload,
					})
				} else if (action === 'GET_TABS') {
					response = await chrome.runtime.sendMessage({
						type: 'GET_TABS',
						sessionId,
					})
				} else if (action === 'EXECUTE_SCRIPT') {
					response = await chrome.runtime.sendMessage({
						type: 'EXECUTE_SCRIPT',
						sessionId,
						payload,
					})
				} else if (action === 'OPEN_TAB') {
					response = await chrome.runtime.sendMessage({
						type: 'OPEN_TAB',
						sessionId,
						payload,
					})
				} else if (action === 'CLOSE_TAB') {
					response = await chrome.runtime.sendMessage({
						type: 'CLOSE_TAB',
						sessionId,
						payload,
					})
				} else {
					response = {
						success: false,
						error: 'Unknown action',
					}
				}

				console.log(
					'%c📬 [Content] Response from background',
					'color: #4caf50; font-weight: bold',
				)
				console.log(`%c   Success: ${response.success}`, 'color: #999')

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
