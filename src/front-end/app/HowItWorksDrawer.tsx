"use client"

import { useId, useState } from "react"

import styles from "./page.module.css"

export function HowItWorksDrawer() {
	const [isOpen, setIsOpen] = useState(true)
	const panelId = useId()

	return (
		<section
			className={`${styles.howItWorksDrawer} ${isOpen ? styles.howItWorksDrawerOpen : ""}`}
			aria-labelledby="how-it-works"
		>
			<button
				type="button"
				id="how-it-works"
				className={styles.howItWorksTrigger}
				aria-expanded={isOpen}
				aria-controls={panelId}
				onClick={() => setIsOpen((open) => !open)}
			>
				<span>How it works</span>
				<span className={styles.howItWorksChevron} aria-hidden="true" />
			</button>
			<div
				id={panelId}
				className={styles.howItWorksPanel}
				role="region"
				aria-label="How it works"
				aria-hidden={!isOpen}
			>
				<div className={styles.howItWorksPanelInner}>
					<p className={styles.howItWorksText}>
						Upload meow audio and see if Meowlin can identify the breed.
					</p>
					<aside className={styles.howItWorksNote}>
						<p>
							<strong>NOTE</strong>: breed ID results are mocked—the audio
							you select won&apos;t change the outcome
						</p>
					</aside>
				</div>
			</div>
		</section>
	)
}
