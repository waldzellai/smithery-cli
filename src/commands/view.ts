import chalk from "chalk"
import { resolveServer } from "../utils/registry-utils.js"
import { handleServerAction } from "../utils/server-actions.js"
import { displayServerDetails } from "../utils/server-display.js"

export async function get(serverId: string) {
	try {
		const server = await resolveServer(serverId)

		if (!server) {
			console.log(chalk.yellow(`No server found with ID: ${serverId}`))
			return
		}

		const action = await displayServerDetails(server, false)
		await handleServerAction(server, action, {})
	} catch (error) {
		console.error(chalk.red("Error loading server:"))
		if (error instanceof Error && error.message.includes("fetch")) {
			console.error(
				chalk.red(
					"Failed to connect to the registry. Please check your internet connection.",
				),
			)
		} else {
			console.error(
				chalk.red(error instanceof Error ? error.message : String(error)),
			)
		}
		process.exit(1)
	}
}
