import chalk from "chalk"
import type { ResolvedServer } from "../types/registry.js"
import inquirer from "inquirer"

export interface ServerChoice {
	name: string
	value: ResolvedServer | "exit" | "back"
	short: string
}

export function formatServerChoice(
	server: ResolvedServer,
	showInstallStatus = false,
): ServerChoice {
	const prefix = showInstallStatus ? (server.isInstalled ? "✓ " : "  ") : ""
	return {
		name: `${prefix}${server.name} | ${server.id}`,
		value: server,
		short: server.name,
	}
}

export function createListChoices(
	servers: ResolvedServer[],
	includeBack = true,
	includeExit = true,
) {
	const choices: (ServerChoice | inquirer.Separator)[] = servers.map((server) =>
		formatServerChoice(server, true),
	)

	if (includeBack || includeExit) {
		choices.push(new inquirer.Separator())
	}
	if (includeBack) {
		choices.push({
			name: chalk.yellow("↩ Back"),
			value: "back",
			short: "Back",
		})
	}
	if (includeExit) {
		choices.push({
			name: chalk.red("✖ Exit"),
			value: "exit",
			short: "Exit",
		})
	}
	return choices
}

export function printServerListHeader(
	count: number,
	type: "all" | "installed" = "all",
) {
	console.log(
		chalk.bold.cyan(
			`\n📦 ${type === "installed" ? "Installed Servers" : "Available Servers"}`,
		),
	)
	console.log(
		chalk.gray(
			`Found ${count} ${type === "installed" ? "installed " : ""}servers\n`,
		),
	)
}

export async function displayServerDetails(
	server: ResolvedServer,
	includeBack = true,
): Promise<"install" | "uninstall" | "back" | "exit"> {
	console.log(`\n${chalk.bold.cyan("Server Details:")}`)
	console.log(chalk.bold("ID:          ") + server.id)
	console.log(chalk.bold("Name:        ") + server.name)

	const choices = [
		{
			name: server.isInstalled
				? chalk.yellow("🔄 Reinstall this server")
				: chalk.yellow("📦 Install this server"),
			value: "install",
		},
		...(server.isInstalled
			? [
					{
						name: chalk.yellow("🗑️  Uninstall this server"),
						value: "uninstall",
					},
				]
			: []),
		...(includeBack
			? [{ name: chalk.yellow("↩ Back to list"), value: "back" }]
			: []),
		{ name: chalk.red("✖ Exit"), value: "exit" },
	]

	const { action } = await inquirer.prompt<{
		action: "install" | "uninstall" | "back" | "exit"
	}>([
		{
			type: "list",
			name: "action",
			message: "What would you like to do?",
			choices,
		},
	])

	return action
}

export async function confirmUninstall(serverName: string): Promise<boolean> {
	const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
		{
			type: "confirm",
			name: "confirm",
			message: `Are you sure you want to uninstall ${serverName}?`,
			default: false,
		},
	])
	return confirm
}
