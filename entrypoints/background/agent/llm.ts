/**
 * LLM Client - 支持视觉输入的 OpenAI 兼容客户端
 */

import type { Tool } from './tools'

export interface LLMConfig {
	apiKey: string
	baseURL?: string
	model: string
}

export interface Message {
	role: 'system' | 'user' | 'assistant' | 'tool'
	content: string | MessageContent[]
	tool_call_id?: string
	name?: string
}

export interface MessageContent {
	type: 'text' | 'image_url'
	text?: string
	image_url?: {
		url: string
		detail?: 'low' | 'high' | 'auto'
	}
}

export interface ToolCall {
	id: string
	type: 'function'
	function: {
		name: string
		arguments: string
	}
}

export interface LLMResponse {
	message: {
		role: 'assistant'
		content: string | null
		tool_calls?: ToolCall[]
	}
	usage?: {
		prompt_tokens: number
		completion_tokens: number
		total_tokens: number
	}
}

export class LLMClient {
	private config: LLMConfig

	constructor(config: LLMConfig) {
		this.config = config
	}

	/**
	 * 调用 LLM API
	 */
	async chat(
		messages: Message[],
		tools?: Tool[],
		toolChoice?: 'auto' | 'required' | 'none',
	): Promise<LLMResponse> {
		const baseURL = this.config.baseURL || 'https://api.openai.com/v1'
		const url = `${baseURL}/chat/completions`

		const requestBody: any = {
			model: this.config.model,
			messages: messages,
			temperature: 0.7,
			max_tokens: 4096,
		}

		// Add tools if provided
		if (tools && tools.length > 0) {
			requestBody.tools = tools.map((tool) => ({
				type: 'function',
				function: {
					name: tool.name,
					description: tool.description,
					parameters: tool.parameters,
				},
			}))

			if (toolChoice) {
				requestBody.tool_choice = toolChoice
			}
		}

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.config.apiKey}`,
			},
			body: JSON.stringify(requestBody),
		})

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`LLM API error (${response.status}): ${errorText}`)
		}

		const data = await response.json()

		return {
			message: {
				role: 'assistant',
				content: data.choices[0].message.content,
				tool_calls: data.choices[0].message.tool_calls,
			},
			usage: data.usage,
		}
	}

	/**
	 * 创建包含截图的用户消息
	 */
	static createVisionMessage(
		text: string,
		screenshotDataURL: string,
	): Message {
		return {
			role: 'user',
			content: [
				{
					type: 'text',
					text: text,
				},
				{
					type: 'image_url',
					image_url: {
						url: screenshotDataURL,
						detail: 'high',
					},
				},
			],
		}
	}

	/**
	 * 创建纯文本消息
	 */
	static createTextMessage(
		role: 'system' | 'user' | 'assistant',
		text: string,
	): Message {
		return {
			role,
			content: text,
		}
	}

	/**
	 * 创建工具调用结果消息
	 */
	static createToolMessage(
		toolCallId: string,
		toolName: string,
		result: string,
	): Message {
		return {
			role: 'tool',
			content: result,
			tool_call_id: toolCallId,
			name: toolName,
		}
	}
}
