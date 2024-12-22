import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import type { MCPConfig, StdioConnection } from "../types/registry.js"

export interface ClaudeConfig extends MCPConfig {
	[key: string]: any
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class ConfigManager {
	private static configPath: string

	static {
		if (process.platform === "win32") {
			const appData =
				process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming")
			ConfigManager.configPath = path.join(
				appData,
				"Claude",
				"claude_desktop_config.json",
			)
		} else if (process.platform === "darwin") {
			// macOS
			const homeDir = os.homedir()
			ConfigManager.configPath = path.join(
				homeDir,
				"Library",
				"Application Support",
				"Claude",
				"claude_desktop_config.json",
			)
		} else {
			// Linux
			const homeDir = os.homedir()
			const configDir =
				process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config")
			ConfigManager.configPath = path.join(
				configDir,
				"Claude",
				"claude_desktop_config.json",
			)
		}
	}

	static getConfigPath(client?: string): string {
		const baseDir = path.dirname(ConfigManager.configPath)
		// Default to Claude if no client specified or if explicitly Claude
		if (!client || client.toLowerCase() === "claude") {
			return ConfigManager.configPath
		}
		// Support for future AI clients
		// Currently only Claude is officially supported
		// 'jan' and others are placeholders for future integrations
		return path.join(
			baseDir,
			"..",
			client,
			`${client.toLowerCase()}_config.json`,
		)
	}

	static readConfig(client?: string): MCPConfig {
		try {
			const configPath = ConfigManager.getConfigPath(client)
			if (!fs.existsSync(configPath)) {
				return { mcpServers: {} }
			}
			const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf8"))

			return {
				mcpServers: rawConfig.mcpServers || {},
			}
		} catch (error) {
			return { mcpServers: {} }
		}
	}

	static writeConfig(config: MCPConfig, client?: string): void {
		const configPath = ConfigManager.getConfigPath(client)
		const configDir = path.dirname(configPath)
		if (!fs.existsSync(configDir)) {
			fs.mkdirSync(configDir, { recursive: true })
		}

		if (!config.mcpServers || typeof config.mcpServers !== "object") {
			throw new Error("Invalid config structure")
		}

		fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
	}

	static isServerInstalled(id: string, client?: string): boolean {
		const config = ConfigManager.readConfig(client)
		const normalizedId = ConfigManager.normalizeServerId(id)
		return normalizedId in config.mcpServers
	}

	static async installServer(
		id: string,
		serverConfig: StdioConnection,
		client?: string,
	): Promise<void> {
		const normalizedId = ConfigManager.normalizeServerId(id)
		const config = ConfigManager.readConfig(client)
		config.mcpServers[normalizedId] = serverConfig
		ConfigManager.writeConfig(config, client)
	}

	static async uninstallServer(id: string, client?: string): Promise<void> {
		const normalizedId = ConfigManager.normalizeServerId(id)
		const config = ConfigManager.readConfig(client)
		if (!config.mcpServers[normalizedId]) {
			console.log(`Server ${normalizedId} not found in configuration`)
			return
		}
		delete config.mcpServers[normalizedId]
		ConfigManager.writeConfig(config, client)
	}

	static getServerConfig(id: string, client?: string): StdioConnection | null {
		const config = ConfigManager.readConfig(client)
		return config.mcpServers[id] || null
	}

	static envVarsToArgs(envVars: Record<string, string>): string[] {
		return Object.entries(envVars).flatMap(([key, value]) => {
			const argName = key.toLowerCase().replace(/_/g, "-")
			return [`--${argName}`, value]
		})
	}

	static normalizeServerId(serverId: string): string {
		if (serverId.startsWith("@")) {
			const firstSlashIndex = serverId.indexOf("/")
			if (firstSlashIndex !== -1) {
				return `${serverId.substring(0, firstSlashIndex)}-${serverId.substring(firstSlashIndex + 1)}`
			}
		}
		return serverId
	}

	static denormalizeServerId(normalizedId: string): string {
		if (normalizedId.startsWith("@")) {
			const dashIndex = normalizedId.indexOf("-")
			if (dashIndex !== -1) {
				return `${normalizedId.substring(0, dashIndex)}/${normalizedId.substring(dashIndex + 1)}`
			}
		}
		return normalizedId
	}

	// get locally installed servers
	static getInstalledServerIds(client?: string): string[] {
		const config = ConfigManager.readConfig(client)
		const ids = Object.keys(config.mcpServers || {})
		return ids
	}
}
