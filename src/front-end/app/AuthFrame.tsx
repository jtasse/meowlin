import type { ReactNode } from "react"

import styles from "./page.module.css"

type AuthFrameProps = {
	children: ReactNode
}

export function AuthFrame({ children }: AuthFrameProps) {
	return (
		<div className={styles.pageShell}>
			<section className={styles.frame}>
				<h1 className={styles.wordArtTitle}>
					<span className={styles.wordArtLine}>
						What&apos;s that cat breed?
					</span>
				</h1>
				<div className={styles.contentPanel}>{children}</div>
			</section>
		</div>
	)
}
