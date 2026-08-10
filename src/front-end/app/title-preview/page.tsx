import type { Metadata } from "next"

import shared from "../page.module.css"
import styles from "./page.module.css"

export const metadata: Metadata = {
	title: "Meowlin title preview",
	robots: { index: false, follow: false },
}

export default function TitlePreviewPage() {
	return (
		<main className={styles.canvas}>
			<h1 className={`${shared.wordArtTitle} ${styles.title}`}>
				<span className={`${shared.wordArtLine} ${styles.titleLine}`}>
					Meowlin
				</span>
			</h1>
		</main>
	)
}
