import { config } from "dotenv"
import * as esbuild from "esbuild"

// Load environment variables into a define object
const configOutput = config().parsed
const define = {}
if (configOutput) {
	for (const k in configOutput) {
		define[`process.env.${k}`] = JSON.stringify(configOutput[k])
	}
}

await esbuild.build({
	entryPoints: ["src/index.ts"],
	bundle: true,
	platform: "node",
	target: "node18",
	minify: true,
	treeShaking: true,
	outfile: "dist/index.js",
	define,
})
