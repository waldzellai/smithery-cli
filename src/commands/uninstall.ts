import chalk from "chalk"
import inquirer from "inquirer"
import { ServerManager } from "../utils/server-manager.js"
import { VALID_CLIENTS, type ValidClient } from "../constants.js"

const serverManager = new ServerManager()

export async function uninstall(
	serverId: string,
	client: ValidClient,
): Promise<void> {
	try {
		// ensure client is valid
		if (client && !VALID_CLIENTS.includes(client as ValidClient)) {
			console.error(
				chalk.red(
					`Invalid client: ${client}\nValid clients are: ${VALID_CLIENTS.join(", ")}`,
				),
			)
			process.exit(1)
		}

		// If no server name provided, show error
		if (!serverId) {
			console.error(chalk.red("Error: Server ID is required"))
			console.log("Usage: @smithery/cli uninstall <server-id>")
			process.exit(1)
		}

		// Confirm uninstallation
		const { confirmUninstall } = await inquirer.prompt<{
			confirmUninstall: boolean
		}>([
			{
				type: "confirm",
				name: "confirmUninstall",
				message: `Are you sure you want to uninstall ${serverId}?`,
				default: false,
			},
		])

		if (!confirmUninstall) {
			console.log("Uninstallation cancelled.")
			return
		}

		// Perform uninstallation
		await serverManager.uninstallServer(serverId, client)
		console.log(
			chalk.green(`\nSuccessfully uninstalled ${serverId} for ${client}`),
		)
		if (client === "claude") {
			console.log(
				chalk.yellow(
					"\nNote: Please restart Claude for the changes to take effect.",
				),
			)
		}
	} catch (error) {
		console.error(chalk.red("Failed to uninstall server:"))
		console.error(
			chalk.red(error instanceof Error ? error.message : String(error)),
		)
		process.exit(1)
	}
}
