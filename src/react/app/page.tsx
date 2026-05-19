"use client"

import { AuthFrame } from "./AuthFrame"
import { UploadControl } from "./UploadControl"
import styles from "./page.module.css"

export default function Home() {
	return (
		<AuthFrame
			eyebrow="Audio Intake"
			title="Upload a clip and let Meowlin *inspect the meows."
			description="*NOTE: Meowlin does does not actually process audio files at this time. Instead, the solution returns mocked results."
		>
			<div className="flex flex-col gap-6">
				<a
					className="inline-flex h-12 w-fit items-center justify-center rounded-md border border-zinc-200 px-5 font-medium text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-950"
					href="https://github.com/jtasse/meowlin/blob/main/README.md"
					target="_blank"
					rel="noopener noreferrer"
				>
					Read the Docs
				</a>

				<div className={styles.uploadControlOffset}>
					<UploadControl />
				</div>
			</div>
		</AuthFrame>
	)
}
