"use client"
import styles from "./page.module.css"

function UploadButton() {
	function handleClick() {
		alert("You started an upload!")
	}

	return (
		<button onClick={handleClick} className={styles.uploadButton}>
			Upload audio file
		</button>
	)
}

export default function Home() {
	return (
		<div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
			<main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
				<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
					<h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
						Welcome to Meowlin!
					</h1>
					<h2>Click the button below to upload an audio file.</h2>
					<div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
						<UploadButton />
						<a
							className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
							href="https://github.com/jtasse/meowlin/blob/main/README.md"
							target="_blank"
							rel="noopener noreferrer"
						>
							Documentation
						</a>
					</div>
				</div>
			</main>
		</div>
	)
}
