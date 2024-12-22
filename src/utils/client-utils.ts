import { exec } from "node:child_process"
import { promisify } from "node:util"
import inquirer from "inquirer"

const execAsync = promisify(exec)

async function isClientRunning(client?: string): Promise<boolean> {
	if (!client) return false

	try {
		const platform = process.platform
		// Map of supported clients to their process names
		// Currently only Claude is officially supported
		// Other entries are placeholders for future integrations
		const clientProcess =
			{
				claude: "Claude",
				// jan: "Jan",  // Placeholder for future client integration
				// Add more clients here as they become supported
			}[client] || client

		if (platform === "win32") {
			const { stdout } = await execAsync(
				`tasklist /FI "IMAGENAME eq ${clientProcess}.exe" /NH`,
			)
			return stdout.includes(`${clientProcess}.exe`)
		} else if (platform === "darwin") {
			const { stdout } = await execAsync(`pgrep -x "${clientProcess}"`)
			return !!stdout.trim()
		} else if (platform === "linux") {
			const { stdout } = await execAsync(
				`pgrep -f "${clientProcess.toLowerCase()}"`,
			)
			return !!stdout.trim()
		}
		return false
	} catch (error) {
		// If the command fails, assume client is not running
		return false
	}
}

async function restartClient(client: string): Promise<void> {
	const clientProcess =
		{
			claude: "Claude",
			jan: "Jan",
			// Add more clients here
		}[client] || client

	try {
		const platform = process.platform
		if (platform === "win32") {
			await execAsync(
				`taskkill /F /IM "${clientProcess}.exe" && start "" "${clientProcess}.exe"`,
			)
		} else if (platform === "darwin") {
			await execAsync(
				`killall "${clientProcess}" && open -a "${clientProcess}"`,
			)
		} else if (platform === "linux") {
			await execAsync(
				`pkill -f "${clientProcess.toLowerCase()}" && ${clientProcess.toLowerCase()}`,
			)
		}

		// Wait a moment for the app to close before reopening
		await new Promise((resolve) => setTimeout(resolve, 2000))

		// Reopen the app
		if (platform === "win32") {
			await execAsync(`start "" "${clientProcess}.exe"`)
		} else if (platform === "darwin") {
			await execAsync(`open -a "${clientProcess}"`)
		} else if (platform === "linux") {
			await execAsync(clientProcess.toLowerCase())
		}

		console.log(`${clientProcess} has been restarted.`)
	} catch (error) {
		console.error(`Failed to restart ${clientProcess}:`, error)
	}
}

export async function promptForRestart(client?: string): Promise<boolean> {
	if (!client) return false

	// Check if client is running first
	const isRunning = await isClientRunning(client)
	if (!isRunning) {
		return false
	}

	const { shouldRestart } = await inquirer.prompt<{ shouldRestart: boolean }>([
		{
			type: "confirm",
			name: "shouldRestart",
			message: `Would you like to restart the ${client} app to apply changes?`,
			default: true,
		},
	])

	if (shouldRestart) {
		console.log(`Restarting ${client} app...`)
		await restartClient(client)
	}

	return shouldRestart
}
