// Popup 主逻辑
async function loadApiKey() {
	const response = await chrome.runtime.sendMessage({ type: 'GET_API_KEY' })
	if (response.success) {
		document.getElementById('apiKey')!.textContent = response.data
	}
}

// 复制 Key
document.getElementById('copyBtn')!.addEventListener('click', async () => {
	const keyElement = document.getElementById('apiKey')!
	const key = keyElement.textContent

	try {
		await navigator.clipboard.writeText(key || '')
		showStatus('Key 已复制到剪贴板！', 'success')
	} catch (err) {
		showStatus('复制失败', 'error')
	}
})

// 刷新 Key
document.getElementById('refreshBtn')!.addEventListener('click', async () => {
	const response = await chrome.runtime.sendMessage({
		type: 'REFRESH_API_KEY',
	})
	if (response.success) {
		document.getElementById('apiKey')!.textContent = response.data
		showStatus('Key 已刷新！所有已认证的页面需重新认证。', 'success')
	} else {
		showStatus('刷新失败', 'error')
	}
})

function showStatus(message: string, type: 'success' | 'error') {
	const statusEl = document.getElementById('status')!
	statusEl.textContent = message
	statusEl.className = `status ${type}`

	setTimeout(() => {
		statusEl.className = 'status'
	}, 3000)
}

// 初始化
loadApiKey()
