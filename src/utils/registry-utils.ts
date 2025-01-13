import dotenv from "dotenv"
import type {
	ConfiguredServer,
	ConnectionDetails,
	RegistryServer,
	ResolvedServer,
	StdioConnection,
} from "../types/registry.js"
import { ConfigManager } from "./config-manager.js"
dotenv.config()

export const REGISTRY_ENDPOINT =
	process.env.REGISTRY_ENDPOINT || "https://registry.smithery.ai"

export async function fetchServers(
	client: string,
	serverIds: string[] = [],
): Promise<ResolvedServer[]> {
	try {
		if (serverIds.length === 0) {
			return []
		}

		// Fetch all servers in parallel
		const serverPromises = serverIds.map((id) => resolveServer(id, client))
		const resolvedServers = await Promise.all(serverPromises)

		// Filter out null results
		return resolvedServers.filter(
			(server): server is ResolvedServer => server !== null,
		)
	} catch (error) {
		throw new Error(
			`Failed to resolve servers: ${error instanceof Error ? error.message : String(error)}`,
		)
	}
}

// Resolves a single servers by ID from registry or local installation
// Returns null if server cannot be found in either location
export async function resolveServer(
	serverId: string,
	client: string,
): Promise<ResolvedServer | null> {
	try {
		// Check if server is installed first
		// const config = ConfigManager.readConfig()
		const isInstalled = ConfigManager.isServerInstalled(serverId, client)

		const response = await fetch(`${REGISTRY_ENDPOINT}/servers/${serverId}`)

		if (!response.ok) {
			// If server is installed but not in registry, return basic info
			if (isInstalled) {
				return {
					id: serverId,
					name: serverId,
					connections: [],
					isInstalled: true,
					client: client,
				}
			}
			return null
		}

		const registryServer: RegistryServer = await response.json()

		const resolvedServer: ResolvedServer = {
			id: registryServer.qualifiedName,
			name: registryServer.displayName,
			connections: registryServer.connections,
			isInstalled: isInstalled, // Use the checked installation status
			client: client,
		}

		return resolvedServer
	} catch (error) {
		return null
	}
}

interface RegistryResponse {
	success: boolean
	result: StdioConnection
}

export async function getServerConfiguration(
	serverId: string,
	configValues: Record<string, unknown>,
	connectionType: ConnectionDetails["type"] = "stdio",
): Promise<ConfiguredServer | null> {
	try {
		const requestBody = {
			connectionType,
			config: configValues,
		}

		const response = await fetch(`${REGISTRY_ENDPOINT}/servers/${serverId}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestBody),
		})

		try {
			const parsed: RegistryResponse = await response.json()

			return parsed.result
		} catch (parseError: unknown) {
			const errorMessage =
				parseError instanceof Error
					? parseError.message
					: "Unknown parsing error"
			throw new Error(`Invalid JSON response from registry: ${errorMessage}`)
		}
	} catch (error) {
		console.error("Error getting server configuration:", error)
		return null
	}
}
