/**
 * Browser Agent Panel - AI Agent 控制面板
 */

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'

interface AgentConfig {
	apiKey: string
	baseURL: string
	model: string
	maxSteps?: number
}

interface AgentStep {
	stepNumber: number
	timestamp: number
	context: {
		tabs: any[]
		activeTab: any
		screenshot: string
	}
	llmResponse: {
		content?: string
		toolCalls?: Array<{
			id: string
			name: string
			arguments: any
		}>
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

function App() {
	const [task, setTask] = useState('')
	const [apiKey, setApiKey] = useState('')
	const [baseURL, setBaseURL] = useState('https://api.openai.com/v1')
	const [model, setModel] = useState('gpt-4o')
	const [running, setRunning] = useState(false)
	const [agentId, setAgentId] = useState<string | null>(null)
	const [history, setHistory] = useState<AgentStep[]>([])
	const [error, setError] = useState<string | null>(null)
	const [result, setResult] = useState<string | null>(null)

	// 定时查询 agent 状态
	useEffect(() => {
		if (!running || !agentId) return

		const interval = setInterval(async () => {
			try {
				const response = await chrome.runtime.sendMessage({
					type: 'AGENT_HISTORY',
					payload: { agentId },
				})

				if (response.success && response.data) {
					setHistory(response.data.history || [])
				}
			} catch (err) {
				console.error('Failed to fetch agent history:', err)
			}
		}, 1000)

		return () => clearInterval(interval)
	}, [running, agentId])

	const handleStart = async () => {
		if (!task.trim()) {
			setError('Please enter a task')
			return
		}

		if (!apiKey.trim()) {
			setError('Please enter your OpenAI API key')
			return
		}

		setError(null)
		setResult(null)
		setHistory([])
		setRunning(true)

		const newAgentId = `agent_${Date.now()}`
		setAgentId(newAgentId)

		const config: AgentConfig = {
			apiKey,
			baseURL,
			model,
			maxSteps: 20,
		}

		try {
			const response = await chrome.runtime.sendMessage({
				type: 'AGENT_START',
				payload: {
					agentId: newAgentId,
					task,
					config,
				},
			})

			if (!response.success) {
				setError(response.error || 'Failed to start agent')
				setRunning(false)
				return
			}

			// Agent 在后台运行，等待完成
			// 可以通过定时查询状态来更新 UI
		} catch (err: any) {
			setError(err.message)
			setRunning(false)
		}
	}

	const handleStop = async () => {
		if (!agentId) return

		try {
			await chrome.runtime.sendMessage({
				type: 'AGENT_STOP',
				payload: { agentId },
			})
			setRunning(false)
		} catch (err: any) {
			setError(err.message)
		}
	}

	const formatTimestamp = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString()
	}

	return (
		<div className="app">
			<header className="header">
				<h1>🤖 Browser Agent</h1>
				<p className="subtitle">
					AI-powered browser automation with vision
				</p>
			</header>

			<div className="container">
				{/* Configuration Section */}
				<section className="section">
					<h2>⚙️ Configuration</h2>
					<div className="form-group">
						<label>API Key:</label>
						<input
							type="password"
							value={apiKey}
							onChange={(e) => setApiKey(e.target.value)}
							placeholder="sk-..."
							disabled={running}
						/>
					</div>
					<div className="form-group">
						<label>Base URL:</label>
						<input
							type="text"
							value={baseURL}
							onChange={(e) => setBaseURL(e.target.value)}
							placeholder="https://api.openai.com/v1"
							disabled={running}
						/>
					</div>
					<div className="form-group">
						<label>Model:</label>
						<input
							type="text"
							value={model}
							onChange={(e) => setModel(e.target.value)}
							placeholder="gpt-4o"
							disabled={running}
						/>
					</div>
				</section>

				{/* Task Input Section */}
				<section className="section">
					<h2>📝 Task</h2>
					<div className="form-group">
						<textarea
							value={task}
							onChange={(e) => setTask(e.target.value)}
							placeholder="Example: Open Google and search for 'AI agents'"
							rows={4}
							disabled={running}
						/>
					</div>
					<div className="button-group">
						{!running ? (
							<button
								onClick={handleStart}
								className="btn-primary"
							>
								▶️ Start Agent
							</button>
						) : (
							<button onClick={handleStop} className="btn-danger">
								⏹️ Stop Agent
							</button>
						)}
					</div>
				</section>

				{/* Error Display */}
				{error && (
					<section className="section error-section">
						<p>❌ {error}</p>
					</section>
				)}

				{/* Result Display */}
				{result && (
					<section className="section success-section">
						<h2>✅ Result</h2>
						<p>{result}</p>
					</section>
				)}

				{/* Execution History */}
				{history.length > 0 && (
					<section className="section">
						<h2>
							📊 Execution History ({history.length} step
							{history.length > 1 ? 's' : ''})
						</h2>
						<div className="history-list">
							{history.map((step) => (
								<div
									key={step.stepNumber}
									className="history-item"
								>
									<div className="history-header">
										<span className="step-number">
											Step {step.stepNumber}
										</span>
										<span className="timestamp">
											{formatTimestamp(step.timestamp)}
										</span>
										{step.usage && (
											<span className="tokens">
												{step.usage.total_tokens} tokens
											</span>
										)}
									</div>

									{/* Screenshot */}
									{step.context.screenshot && (
										<details className="history-details">
											<summary>📸 Screenshot</summary>
											<img
												src={step.context.screenshot}
												alt={`Step ${step.stepNumber}`}
												className="screenshot"
											/>
										</details>
									)}

									{/* Tool Calls */}
									{step.llmResponse.toolCalls &&
										step.llmResponse.toolCalls.length >
											0 && (
											<div className="tool-calls">
												<strong>🔧 Tool Calls:</strong>
												{step.llmResponse.toolCalls.map(
													(tc) => (
														<div
															key={tc.id}
															className="tool-call"
														>
															<code>
																{tc.name}(
																{JSON.stringify(
																	tc.arguments,
																)}
																)
															</code>
														</div>
													),
												)}
											</div>
										)}

									{/* Tool Results */}
									{step.toolResults &&
										step.toolResults.length > 0 && (
											<div className="tool-results">
												<strong>📤 Results:</strong>
												{step.toolResults.map((tr) => (
													<div
														key={tr.toolCallId}
														className="tool-result"
													>
														<code>{tr.result}</code>
													</div>
												))}
											</div>
										)}

									{/* LLM Response */}
									{step.llmResponse.content && (
										<div className="llm-content">
											<strong>💬 Response:</strong>
											<p>{step.llmResponse.content}</p>
										</div>
									)}
								</div>
							))}
						</div>
					</section>
				)}
			</div>
		</div>
	)
}

const root = document.getElementById('root')!
ReactDOM.createRoot(root).render(<App />)
