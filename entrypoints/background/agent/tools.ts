/**
 * Agent Tools - 浏览器控制工具集
 *
 * 与 page-agent 的区别：
 * - page-agent 在页面内运行，无法跨 tab 操作
 * - 本实现在 background 运行，可以控制所有 tabs
 * - 使用截图代替 DOM 清洗，让 LLM 直接"看到"页面
 */

export interface Tool {
	name: string
	description: string
	parameters: {
		type: 'object'
		properties: Record<
			string,
			{
				type: string
				description: string
				enum?: string[]
			}
		>
		required: string[]
	}
}

/**
 * 打开新标签页
 */
export const openTabTool: Tool = {
	name: 'open_tab',
	description: 'Open a new tab with the specified URL',
	parameters: {
		type: 'object',
		properties: {
			url: {
				type: 'string',
				description: 'The URL to open. Must be a valid http/https URL.',
			},
			active: {
				type: 'boolean',
				description:
					'Whether to make the new tab active (focused). Default is true.',
			},
		},
		required: ['url'],
	},
}

export async function openTab(args: {
	url: string
	active?: boolean
}): Promise<string> {
	try {
		const tab = await chrome.tabs.create({
			url: args.url,
			active: args.active !== false,
		})
		return `✅ Opened new tab (ID: ${tab.id}) with URL: ${args.url}`
	} catch (error: any) {
		return `❌ Failed to open tab: ${error.message}`
	}
}

/**
 * 切换到指定标签页
 */
export const activeTabTool: Tool = {
	name: 'active_tab',
	description: 'Switch to (activate/focus) a specific tab by ID',
	parameters: {
		type: 'object',
		properties: {
			tabId: {
				type: 'number',
				description: 'The ID of the tab to activate',
			},
		},
		required: ['tabId'],
	},
}

export async function activeTab(args: { tabId: number }): Promise<string> {
	try {
		await chrome.tabs.update(args.tabId, { active: true })
		const tab = await chrome.tabs.get(args.tabId)
		return `✅ Activated tab (ID: ${args.tabId}): ${tab.title}`
	} catch (error: any) {
		return `❌ Failed to activate tab: ${error.message}`
	}
}

/**
 * 关闭标签页
 */
export const closeTabTool: Tool = {
	name: 'close_tab',
	description: 'Close a specific tab by ID',
	parameters: {
		type: 'object',
		properties: {
			tabId: {
				type: 'number',
				description: 'The ID of the tab to close',
			},
		},
		required: ['tabId'],
	},
}

export async function closeTab(args: { tabId: number }): Promise<string> {
	try {
		await chrome.tabs.remove(args.tabId)
		return `✅ Closed tab (ID: ${args.tabId})`
	} catch (error: any) {
		return `❌ Failed to close tab: ${error.message}`
	}
}

/**
 * 重新加载标签页
 */
export const reloadTabTool: Tool = {
	name: 'reload_tab',
	description: 'Reload a specific tab',
	parameters: {
		type: 'object',
		properties: {
			tabId: {
				type: 'number',
				description:
					'The ID of the tab to reload. If not provided, reload the active tab.',
			},
			bypassCache: {
				type: 'boolean',
				description:
					'Whether to bypass the cache (hard reload). Default is false.',
			},
		},
		required: [],
	},
}

export async function reloadTab(args: {
	tabId?: number
	bypassCache?: boolean
}): Promise<string> {
	try {
		let tabId = args.tabId
		if (!tabId) {
			// Get active tab
			const [activeTab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			})
			if (!activeTab?.id) {
				return '❌ No active tab found'
			}
			tabId = activeTab.id
		}

		await chrome.tabs.reload(tabId, { bypassCache: args.bypassCache })
		return `✅ Reloaded tab (ID: ${tabId})${
			args.bypassCache ? ' (bypassed cache)' : ''
		}`
	} catch (error: any) {
		return `❌ Failed to reload tab: ${error.message}`
	}
}

/**
 * 滚动页面
 */
export const scrollPageTool: Tool = {
	name: 'scroll_page',
	description: 'Scroll the page in the specified direction',
	parameters: {
		type: 'object',
		properties: {
			tabId: {
				type: 'number',
				description:
					'The ID of the tab to scroll. If not provided, scroll the active tab.',
			},
			direction: {
				type: 'string',
				description: 'Scroll direction',
				enum: ['up', 'down', 'top', 'bottom'],
			},
			amount: {
				type: 'number',
				description:
					'Scroll amount in pixels. Only used for "up" and "down". Default is one viewport height.',
			},
		},
		required: ['direction'],
	},
}

export async function scrollPage(args: {
	tabId?: number
	direction: 'up' | 'down' | 'top' | 'bottom'
	amount?: number
}): Promise<string> {
	try {
		let tabId = args.tabId
		if (!tabId) {
			const [activeTab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			})
			if (!activeTab?.id) {
				return '❌ No active tab found'
			}
			tabId = activeTab.id
		}

		// Execute scroll in the target tab
		const code = (() => {
			switch (args.direction) {
				case 'up':
					return `window.scrollBy(0, -(${
						args.amount || 'window.innerHeight'
					}))`
				case 'down':
					return `window.scrollBy(0, ${
						args.amount || 'window.innerHeight'
					})`
				case 'top':
					return `window.scrollTo(0, 0)`
				case 'bottom':
					return `window.scrollTo(0, document.body.scrollHeight)`
			}
		})()

		await chrome.scripting.executeScript({
			target: { tabId },
			func: (scrollCode: string) => {
				eval(scrollCode)
			},
			args: [code],
		})

		return `✅ Scrolled ${args.direction} in tab (ID: ${tabId})`
	} catch (error: any) {
		return `❌ Failed to scroll: ${error.message}`
	}
}

/**
 * 点击元素
 */
export const clickTool: Tool = {
	name: 'click',
	description: 'Click an element on the page using CSS selector',
	parameters: {
		type: 'object',
		properties: {
			tabId: {
				type: 'number',
				description:
					'The ID of the tab. If not provided, use the active tab.',
			},
			selector: {
				type: 'string',
				description:
					'CSS selector of the element to click. Examples: "button.submit", "#login", "a[href=\'/about\']"',
			},
			waitAfter: {
				type: 'number',
				description:
					'Milliseconds to wait after clicking. Default is 500ms.',
			},
		},
		required: ['selector'],
	},
}

export async function click(args: {
	tabId?: number
	selector: string
	waitAfter?: number
}): Promise<string> {
	try {
		let tabId = args.tabId
		if (!tabId) {
			const [activeTab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			})
			if (!activeTab?.id) {
				return '❌ No active tab found'
			}
			tabId = activeTab.id
		}

		const results = await chrome.scripting.executeScript({
			target: { tabId },
			func: (selector: string, waitMs: number) => {
				const element = document.querySelector(selector) as HTMLElement
				if (!element) {
					return {
						success: false,
						error: `Element not found: ${selector}`,
					}
				}

				element.click()

				// Wait after click
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve({
							success: true,
							text:
								element.innerText?.slice(0, 100) ||
								element.tagName,
						})
					}, waitMs)
				})
			},
			args: [args.selector, args.waitAfter || 500],
		})

		const result = results[0]?.result as any
		if (!result?.success) {
			return `❌ ${result?.error || 'Click failed'}`
		}

		return `✅ Clicked element "${args.selector}" (text: "${result.text}") in tab (ID: ${tabId})`
	} catch (error: any) {
		return `❌ Failed to click: ${error.message}`
	}
}

/**
 * 键盘输入
 */
export const keydownTool: Tool = {
	name: 'keydown',
	description:
		'Type text into a focused input field or send keyboard shortcuts',
	parameters: {
		type: 'object',
		properties: {
			tabId: {
				type: 'number',
				description:
					'The ID of the tab. If not provided, use the active tab.',
			},
			selector: {
				type: 'string',
				description:
					'CSS selector of the input element. If not provided, types into the currently focused element.',
			},
			text: {
				type: 'string',
				description: 'Text to type. Use "\\n" for Enter key.',
			},
		},
		required: ['text'],
	},
}

export async function keydown(args: {
	tabId?: number
	selector?: string
	text: string
}): Promise<string> {
	try {
		let tabId = args.tabId
		if (!tabId) {
			const [activeTab] = await chrome.tabs.query({
				active: true,
				currentWindow: true,
			})
			if (!activeTab?.id) {
				return '❌ No active tab found'
			}
			tabId = activeTab.id
		}

		const results = await chrome.scripting.executeScript({
			target: { tabId },
			func: (selector: string | undefined, text: string) => {
				let element: HTMLElement | null = null

				if (selector) {
					element = document.querySelector(selector) as HTMLElement
					if (!element) {
						return {
							success: false,
							error: `Element not found: ${selector}`,
						}
					}
					element.focus()
				} else {
					element = document.activeElement as HTMLElement
					if (!element) {
						return {
							success: false,
							error: 'No focused element found',
						}
					}
				}

				// For input/textarea, set value directly
				if (
					element instanceof HTMLInputElement ||
					element instanceof HTMLTextAreaElement
				) {
					element.value = text
					element.dispatchEvent(new Event('input', { bubbles: true }))
					element.dispatchEvent(
						new Event('change', { bubbles: true }),
					)
					return { success: true, tagName: element.tagName }
				}

				// For contenteditable
				if (element.isContentEditable) {
					element.textContent = text
					element.dispatchEvent(new Event('input', { bubbles: true }))
					return { success: true, tagName: 'ContentEditable' }
				}

				// Fallback: dispatch keyboard events
				for (const char of text) {
					if (char === '\n') {
						element.dispatchEvent(
							new KeyboardEvent('keydown', {
								key: 'Enter',
								bubbles: true,
							}),
						)
						element.dispatchEvent(
							new KeyboardEvent('keypress', {
								key: 'Enter',
								bubbles: true,
							}),
						)
						element.dispatchEvent(
							new KeyboardEvent('keyup', {
								key: 'Enter',
								bubbles: true,
							}),
						)
					} else {
						element.dispatchEvent(
							new KeyboardEvent('keydown', {
								key: char,
								bubbles: true,
							}),
						)
						element.dispatchEvent(
							new KeyboardEvent('keypress', {
								key: char,
								bubbles: true,
							}),
						)
						element.dispatchEvent(
							new KeyboardEvent('keyup', {
								key: char,
								bubbles: true,
							}),
						)
					}
				}

				return { success: true, tagName: element.tagName }
			},
			args: [args.selector, args.text],
		})

		const result = results[0]?.result as any
		if (!result?.success) {
			return `❌ ${result?.error || 'Type failed'}`
		}

		const preview =
			args.text.length > 50 ? args.text.slice(0, 50) + '...' : args.text
		return `✅ Typed "${preview}" into ${
			args.selector || 'focused element'
		} (${result.tagName}) in tab (ID: ${tabId})`
	} catch (error: any) {
		return `❌ Failed to type: ${error.message}`
	}
}

/**
 * 等待（用于观察页面变化）
 */
export const waitTool: Tool = {
	name: 'wait',
	description:
		'Wait for a specified amount of time (useful for observing page changes after actions)',
	parameters: {
		type: 'object',
		properties: {
			seconds: {
				type: 'number',
				description: 'Number of seconds to wait (0.5 to 10)',
			},
		},
		required: ['seconds'],
	},
}

export async function wait(args: { seconds: number }): Promise<string> {
	const seconds = Math.max(0.5, Math.min(10, args.seconds))
	await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
	return `✅ Waited for ${seconds} seconds`
}

/**
 * 完成任务
 */
export const doneTool: Tool = {
	name: 'done',
	description: 'Mark the task as completed and return the final result',
	parameters: {
		type: 'object',
		properties: {
			result: {
				type: 'string',
				description: 'The final result or summary of the task',
			},
		},
		required: ['result'],
	},
}

export async function done(args: { result: string }): Promise<string> {
	return `✅ Task completed: ${args.result}`
}

/**
 * 所有工具列表
 */
export const allTools: Tool[] = [
	openTabTool,
	activeTabTool,
	closeTabTool,
	reloadTabTool,
	scrollPageTool,
	clickTool,
	keydownTool,
	waitTool,
	doneTool,
]

/**
 * 工具执行器映射
 */
export const toolExecutors: Record<string, (args: any) => Promise<string>> = {
	open_tab: openTab,
	active_tab: activeTab,
	close_tab: closeTab,
	reload_tab: reloadTab,
	scroll_page: scrollPage,
	click: click,
	keydown: keydown,
	wait: wait,
	done: done,
}
