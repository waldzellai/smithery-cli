import {
	createStatefulServer,
	type CreateServerFn as CreateStatefulServerFn,
} from "@smithery/sdk/server/stateful.js"
import cors from "cors"
import express from "express"
import type { z } from "zod"

// These will be replaced by esbuild at build time.
// @ts-ignore
import * as _entry from "virtual:user-module"

// Type declaration for the user module
interface SmitheryModule {
	configSchema?: z.ZodSchema
	// Default export (treated as stateful server)
	default?: CreateStatefulServerFn
}

const entry: SmitheryModule = _entry

async function startMcpServer() {
	try {
		const port = process.env.PORT || "8181"

		console.log(`[smithery] Starting MCP server on port ${port}`)

		let server: { app: express.Application }

		const app = express()

		// Inject cors for development
		if (process.env.NODE_ENV !== "production") {
			console.log(`[smithery] Injecting cors middleware`)
			app.use(
				cors({
					exposedHeaders: ["mcp-session-id"],
				}),
			)
		}

		if (entry.default && typeof entry.default === "function") {
			console.log(`[smithery] Setting up server.`)

			server = createStatefulServer(entry.default, {
				schema: entry.configSchema,
				app,
			})
		} else {
			throw new Error(
				"No valid server export found. Please export:\n" +
					"- export default function({ sessionId, config }) { ... }",
			)
		}

		// Start the server
		server.app.listen(Number.parseInt(port))
		console.log(`[smithery] MCP server started successfully on port ${port}`)
	} catch (error) {
		console.error(`[smithery] Failed to start MCP server:`, error)
		process.exit(1)
	}
}

// Start the server
startMcpServer()
