import type { ReactNode } from "react"

import styles from "./page.module.css"

type AuthFrameProps = {
	description?: string
	children: ReactNode
}

export function AuthFrame({ description, children }: AuthFrameProps) {
	return (
		<div className={styles.pageShell}>
			<section className={styles.frame}>
				<h1 className={styles.wordArtTitle}>
					<span className={styles.wordArtLine}>
						What&apos;s that cat breed?
					</span>
				</h1>
				{description && (
					<p className={styles.frameDescription}>{description}</p>
				)}
				<div className={styles.contentPanel}>{children}</div>
			</section>
		</div>
	)
}
