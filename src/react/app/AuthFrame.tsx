import Image from "next/image"
import type { ReactNode } from "react"

import styles from "./page.module.css"

type AuthFrameProps = {
	eyebrow: string
	title: string
	description: string
	children: ReactNode
}

export function AuthFrame({
	eyebrow,
	title,
	description,
	children,
}: AuthFrameProps) {
	return (
		<div className={styles.pageShell}>
			<section className={styles.frame}>
				<div className={styles.brandPanel}>
					<div className={styles.brandBadge}>{eyebrow}</div>
					<div className={styles.brandCopy}>
						<h1 className={styles.brandTitle}>{title}</h1>
						<p className={styles.brandDescription}>{description}</p>
					</div>
					<div className={styles.artPanel}>
						<Image
							src="/meowlin-small.png"
							alt="Illustrated Meowlin cat mascot"
							width={596}
							height={496}
							className={styles.brandImage}
							priority
						/>
					</div>
				</div>

				<div className={styles.contentPanel}>{children}</div>
			</section>
		</div>
	)
}
