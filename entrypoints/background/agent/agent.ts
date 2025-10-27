/**
 * Browser Agent - 跨 Tab 的浏览器控制 Agent
 *
 * 架构参考 page-agent，但针对浏览器扩展场景优化：
 * - 使用截图代替 DOM 清洗（更直观，支持 Canvas/Video 等）
 * - 在 background 运行，可以控制所有 tabs
 * - 每次决策时提供：tab 列表 + 当前 tab 截图 + 工具集
 */

import chalk from 'chalk'
import { LLMClient, type LLMConfig, type Message } from './llm'
import { allTools, toolExecutors } from './tools'

export interface AgentConfig extends LLMConfig {
	maxSteps?: number
	systemPrompt?: string
}

export interface TabInfo {
	id: number
	title: string
	url: string
	active: boolean
	windowId: number
}

export interface AgentStep {
	stepNumber: number
	timestamp: number
	context: {
		tabs: TabInfo[]
		activeTab: TabInfo
		screenshot: string // data URL
	}
	llmRequest: {
		messages: Message[]
		tools: typeof allTools
	}
	llmResponse: {
		reasoning?: string
		toolCalls?: Array<{
			id: string
			name: string
			arguments: any
		}>
		content?: string
	}
	toolResults?: Array<{
		toolCallId: string
		toolName: string
		result: string
	}>
	usage?: {
		prompt_tokens: number
		completion_tokens: number
		total_tokens: number
	}
}

export interface AgentResult {
	success: boolean
	finalResult?: string
	error?: string
	steps: AgentStep[]
	totalSteps: number
	totalTokens: number
}

export class BrowserAgent {
	private config: AgentConfig
	private llm: LLMClient
	private messages: Message[] = []
	private steps: AgentStep[] = []
	private totalTokens = 0
	private currentStep = 0

	constructor(config: AgentConfig) {
		this.config = {
			maxSteps: 20,
			systemPrompt: this.getDefaultSystemPrompt(),
			...config,
		}
		this.llm = new LLMClient(config)

		// Initialize with system prompt
		this.messages.push(
			LLMClient.createTextMessage('system', this.config.systemPrompt!),
		)
	}

	/**
	 * 执行任务
	 */
	async execute(task: string): Promise<AgentResult> {
		console.log(chalk.magenta.bold(`\n🤖 Agent started task: "${task}"\n`))

		this.messages.push(
			LLMClient.createTextMessage(
				'user',
				`Task: ${task}\n\nPlease complete this task step by step. Use the provided tools to interact with the browser.`,
			),
		)

		try {
			while (this.currentStep < this.config.maxSteps!) {
				this.currentStep++
				console.log(
					chalk.cyan.bold(
						`\n📍 Step ${this.currentStep}/${this.config.maxSteps}\n`,
					),
				)

				// 收集当前上下文（tabs + 截图）
				const context = await this.collectContext()

				// 构建当前消息（带上下文）
				const contextMessage = this.buildContextMessage(context)
				const currentMessages = [...this.messages, contextMessage]

				// 调用 LLM
				const llmResponse = await this.llm.chat(
					currentMessages,
					allTools,
					'auto',
				)

				// 记录步骤
				const step: AgentStep = {
					stepNumber: this.currentStep,
					timestamp: Date.now(),
					context,
					llmRequest: {
						messages: currentMessages,
						tools: allTools,
					},
					llmResponse: {
						content: llmResponse.message.content || undefined,
						toolCalls: llmResponse.message.tool_calls?.map(
							(tc) => ({
								id: tc.id,
								name: tc.function.name,
								arguments: JSON.parse(tc.function.arguments),
							}),
						),
					},
					usage: llmResponse.usage,
				}

				if (llmResponse.usage) {
					this.totalTokens += llmResponse.usage.total_tokens
				}

				// 添加 assistant 消息到历史
				this.messages.push({
					role: 'assistant',
					content: llmResponse.message.content || '',
					tool_calls: llmResponse.message.tool_calls,
				} as any)

				// 如果有工具调用，执行工具
				if (llmResponse.message.tool_calls) {
					console.log(
						chalk.yellow(
							`   🔧 Executing ${llmResponse.message.tool_calls.length} tool(s)...\n`,
						),
					)

					step.toolResults = []

					for (const toolCall of llmResponse.message.tool_calls) {
						const toolName = toolCall.function.name
						const toolArgs = JSON.parse(toolCall.function.arguments)

						console.log(
							chalk.blue(
								`      → ${toolName}(${JSON.stringify(
									toolArgs,
								)})`,
							),
						)

						// 执行工具
						const executor = toolExecutors[toolName]
						if (!executor) {
							const errorMsg = `❌ Tool not found: ${toolName}`
							console.log(chalk.red(`      ${errorMsg}`))
							step.toolResults.push({
								toolCallId: toolCall.id,
								toolName,
								result: errorMsg,
							})
							this.messages.push(
								LLMClient.createToolMessage(
									toolCall.id,
									toolName,
									errorMsg,
								),
							)
							continue
						}

						try {
							const result = await executor(toolArgs)
							console.log(chalk.green(`      ${result}`))

							step.toolResults.push({
								toolCallId: toolCall.id,
								toolName,
								result,
							})

							// 添加工具结果到历史
							this.messages.push(
								LLMClient.createToolMessage(
									toolCall.id,
									toolName,
									result,
								),
							)

							// 如果是 done 工具，任务完成
							if (toolName === 'done') {
								this.steps.push(step)
								return {
									success: true,
									finalResult: toolArgs.result,
									steps: this.steps,
									totalSteps: this.currentStep,
									totalTokens: this.totalTokens,
								}
							}
						} catch (error: any) {
							const errorMsg = `❌ Tool execution error: ${error.message}`
							console.log(chalk.red(`      ${errorMsg}`))

							step.toolResults.push({
								toolCallId: toolCall.id,
								toolName,
								result: errorMsg,
							})

							this.messages.push(
								LLMClient.createToolMessage(
									toolCall.id,
									toolName,
									errorMsg,
								),
							)
						}
					}
				} else if (llmResponse.message.content) {
					// 没有工具调用，只有文本回复
					console.log(
						chalk.yellow(
							`   💬 Assistant: ${llmResponse.message.content}`,
						),
					)
				}

				this.steps.push(step)
			}

			// 达到最大步数
			return {
				success: false,
				error: `Reached maximum steps (${this.config.maxSteps})`,
				steps: this.steps,
				totalSteps: this.currentStep,
				totalTokens: this.totalTokens,
			}
		} catch (error: any) {
			console.error(
				chalk.red.bold(`\n❌ Agent error: ${error.message}\n`),
			)
			return {
				success: false,
				error: error.message,
				steps: this.steps,
				totalSteps: this.currentStep,
				totalTokens: this.totalTokens,
			}
		}
	}

	/**
	 * 收集当前浏览器上下文
	 */
	private async collectContext(): Promise<AgentStep['context']> {
		// 获取所有 tabs
		const allTabs = await chrome.tabs.query({})
		const tabs: TabInfo[] = allTabs.map((tab) => ({
			id: tab.id!,
			title: tab.title || 'Untitled',
			url: tab.url || 'about:blank',
			active: tab.active,
			windowId: tab.windowId,
		}))

		// 获取当前活动 tab
		const [activeTab] = await chrome.tabs.query({
			active: true,
			currentWindow: true,
		})

		if (!activeTab || !activeTab.id) {
			throw new Error('No active tab found')
		}

		// 截图当前活动 tab
		const screenshot = await chrome.tabs.captureVisibleTab(
			activeTab.windowId,
			{ format: 'png' },
		)

		return {
			tabs,
			activeTab: {
				id: activeTab.id,
				title: activeTab.title || 'Untitled',
				url: activeTab.url || 'about:blank',
				active: true,
				windowId: activeTab.windowId,
			},
			screenshot,
		}
	}

	/**
	 * 构建包含上下文的消息
	 */
	private buildContextMessage(context: AgentStep['context']): Message {
		// 构建 tab 列表描述
		const tabsInfo = context.tabs
			.map(
				(tab) =>
					`- [${tab.id}] ${tab.title}${
						tab.active ? ' (ACTIVE)' : ''
					}\n  URL: ${tab.url}`,
			)
			.join('\n')

		const contextText = `
=== CURRENT BROWSER STATE ===

Active Tab: [${context.activeTab.id}] ${context.activeTab.title}
URL: ${context.activeTab.url}

All Tabs (${context.tabs.length} total):
${tabsInfo}

=== SCREENSHOT ===
The screenshot below shows the current state of the active tab.
Please analyze it carefully before deciding your next action.
`

		return LLMClient.createVisionMessage(contextText, context.screenshot)
	}

	/**
	 * 默认系统提示
	 */
	private getDefaultSystemPrompt(): string {
		return `You are a browser automation agent. Your goal is to help users complete tasks by controlling browser tabs.

You have access to the following tools:
- open_tab: Open a new tab with a URL
- active_tab: Switch to a specific tab
- close_tab: Close a tab
- reload_tab: Reload a tab
- scroll_page: Scroll the page up/down/top/bottom
- click: Click an element using CSS selector
- keydown: Type text into an input field
- wait: Wait for a specified time
- done: Mark the task as completed

On each step, you will receive:
1. A list of all open tabs with their IDs, titles, and URLs
2. Information about the currently active tab
3. A screenshot of the active tab

Think step by step:
1. Analyze the current state (tabs and screenshot)
2. Decide what action to take next
3. Use the appropriate tool
4. After each action, observe the result and plan the next step

Important guidelines:
- Use CSS selectors carefully (inspect the page structure from the screenshot)
- Wait after actions that trigger page changes (use the wait tool)
- If you're not sure about a selector, try to scroll and explore the page first
- When the task is complete, call the 'done' tool with a summary

Always be precise and efficient. Complete the task in as few steps as possible.`
	}

	/**
	 * 获取执行历史
	 */
	getHistory(): AgentStep[] {
		return this.steps
	}

	/**
	 * 获取当前使用的 token 数
	 */
	getTotalTokens(): number {
		return this.totalTokens
	}
}
