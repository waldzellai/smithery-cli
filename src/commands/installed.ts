import inquirer from "inquirer"
import chalk from "chalk"
import { fetchServers } from "../utils/registry-utils.js"
import type { ResolvedServer } from "../types/registry.js"
import AutocompletePrompt from "inquirer-autocomplete-prompt"
import { handleServerAction } from "../utils/server-actions.js"
import { ConfigManager } from "../utils/config-manager.js"
import {
	displayServerDetails,
	printServerListHeader,
	createListChoices,
} from "../utils/server-display.js"

inquirer.registerPrompt("autocomplete", AutocompletePrompt)

let installedServersCache: ResolvedServer[] | null = null

export async function listInstalledServers(): Promise<void> {
	const installedIds = ConfigManager.getInstalledServerIds()

	if (installedIds.length === 0) {
		console.log(chalk.yellow("\nNo MCP servers are currently installed."))
		return
	}

	const denormalizedIds = installedIds.map((id) =>
		ConfigManager.denormalizeServerId(id),
	)
	if (
		!installedServersCache ||
		!areArraysEqual(
			denormalizedIds,
			installedServersCache.map((server) => server.id),
		)
	) {
		installedServersCache = await fetchServers(undefined, denormalizedIds)
		installedServersCache.forEach((server) => {
			server.isInstalled = true
		})
	}

	printServerListHeader(installedServersCache.length, "installed")

	const prompt = {
		type: "list",
		name: "selectedServer",
		message: "Search and select a server:",
		choices: createListChoices(installedServersCache, false, true),
	}
	const answer = await inquirer.prompt<{
		selectedServer: ResolvedServer | "exit"
	}>([prompt])

	if (!answer.selectedServer || answer.selectedServer === "exit") {
		return
	}

	const action = await displayServerDetails(answer.selectedServer)
	await handleServerAction(answer.selectedServer, action, {
		onUninstall: () => listInstalledServers(),
		onBack: listInstalledServers,
	})
}

function areArraysEqual(arr1: string[], arr2: string[]): boolean {
	return (
		arr1.length === arr2.length &&
		arr1.every((value, index) => value === arr2[index])
	)
}
