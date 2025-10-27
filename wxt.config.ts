import { defineConfig } from 'wxt'
import tailwindcss from '@tailwindcss/vite'

// See https://wxt.dev/api/config.html
export default defineConfig({
	modules: ['@wxt-dev/module-react'],
	vite: () => ({
		plugins: [tailwindcss()],
	}),
	manifest: {
		permissions: [
			'tabs',
			'activeTab',
			'scripting',
			// 注意：截图权限需要 <all_urls> 或具体 host 权限
		],
		host_permissions: [
			'<all_urls>', // 需要这个才能截图和跨域脚本执行
		],
		action: {
			// 默认 popup
			default_popup: 'popup/index.html',
		},
		web_accessible_resources: [
			{
				resources: ['main-world.js'],
				matches: ['<all_urls>'],
			},
		],
	},
})
