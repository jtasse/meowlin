import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		environment: "node",
		include: ["lib/**/*.test.ts"],
		env: {
			NEXT_PUBLIC_API_BASE_URL: "https://api.test.example/prod",
			NEXT_PUBLIC_BASE_PATH: "",
			NEXT_PUBLIC_APP_ENV: "test",
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "."),
		},
	},
})
