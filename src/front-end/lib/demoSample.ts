import { withBasePath } from "./config"

/** Display name shown in Step 1 (not the on-disk asset name). */
export const DEMO_SAMPLE_DISPLAY_NAME = "Meowlin_sample.mp3"

const DEMO_SAMPLE_ASSET_PATH = "/samples/meowlin-demo.mp3"

export async function loadDemoSampleFile(): Promise<File> {
	const response = await fetch(withBasePath(DEMO_SAMPLE_ASSET_PATH))
	if (!response.ok) {
		throw new Error("Could not load the demo audio sample. Please try again.")
	}
	const blob = await response.blob()
	const type = blob.type.startsWith("audio/") ? blob.type : "audio/mpeg"
	return new File([blob], DEMO_SAMPLE_DISPLAY_NAME, { type })
}
