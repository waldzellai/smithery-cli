import type { ResolvedServer } from "../types/registry.js"
import { ConfigManager } from "./config-manager.js"
import type { ConnectionDetails } from "../types/registry.js"
import { getServerConfiguration } from "./registry-utils.js"
import { promptForRestart } from "./client-utils.js"
import { collectConfigValues } from "./runtime-utils.js"

export class ServerManager {
	private configManager: typeof ConfigManager

	constructor(configManager = ConfigManager) {
		this.configManager = configManager
	}

	private validateConnection(server: ResolvedServer): ConnectionDetails {
		const connection = server.connections?.[0]
		if (!connection) {
			throw new Error("No connection configuration found")
		}
		return connection
	}

	async installServer(server: ResolvedServer): Promise<void> {
		const connection = this.validateConnection(server)
		const values = await collectConfigValues(connection)
		const serverConfig = await getServerConfiguration(
			server.id,
			values,
			connection.type,
		)

		if (!serverConfig) {
			throw new Error(
				`Unable to fetch server configuration for server ${server.id}`,
			)
		}

		await this.configManager.installServer(
			server.id,
			serverConfig,
			server.client,
		)
		await promptForRestart(server.client)
	}

	async uninstallServer(serverId: string, client?: string): Promise<void> {
		try {
			await this.configManager.uninstallServer(serverId, client)
			console.log(`\nUninstalled ${serverId}`)
			await promptForRestart(client)
		} catch (error) {
			console.error("Failed to uninstall server:", error)
			throw error
		}
	}
}
