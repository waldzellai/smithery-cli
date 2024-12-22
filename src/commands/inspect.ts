import chalk from "chalk"
import {
	createServerConnection,
	inspectServer,
} from "../utils/server-inspector.js"
import { ConfigManager } from "../utils/config-manager.js"
import { createListChoices } from "../utils/server-display.js"
import inquirer from "inquirer"

export async function inspect(): Promise<void> {
	try {
		const installedIds = ConfigManager.getInstalledServerIds()

		if (installedIds.length === 0) {
			console.log(chalk.yellow("\nNo MCP servers are currently installed."))
			return
		}

		const config = ConfigManager.readConfig()

		while (true) {
			const choices = createListChoices(
				installedIds.map((id) => ({
					id,
					name: ConfigManager.denormalizeServerId(id),
					isInstalled: true,
					connections: [],
				})),
				false,
				true,
			)

			const { selectedId } = await inquirer.prompt([
				{
					type: "list",
					name: "selectedId",
					message: "Select a server to inspect:",
					choices,
				},
			])

			if (selectedId === "exit") {
				process.exit(0)
			}

			if (!selectedId) {
				return
			}

			console.log(chalk.blue("\nConnecting to server..."))
			const connectionConfig = config.mcpServers[selectedId.id]

			if ("command" in connectionConfig) {
				const client = await createServerConnection(
					selectedId.id,
					connectionConfig,
				)
				const result = await inspectServer(client)
				if (result === "exit") {
					process.exit(0)
				}
			} else {
				throw new Error("Only stdio connections are supported")
			}
		}
	} catch (error) {
		console.error(chalk.red("Error during inspection:"))
		console.error(
			chalk.red(error instanceof Error ? error.message : String(error)),
		)
		process.exit(1)
	}
}
