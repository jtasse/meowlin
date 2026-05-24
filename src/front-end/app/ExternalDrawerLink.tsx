import type { ReactNode } from "react"

import styles from "./page.module.css"

type ExternalDrawerLinkProps = {
	href: string
	children: ReactNode
}

export function ExternalDrawerLink({ href, children }: ExternalDrawerLinkProps) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className={styles.aboutDrawerLink}
		>
			<span className={styles.aboutDrawerLinkLabel}>{children}</span>
			<span className={styles.aboutDrawerExternalIcon} aria-hidden="true">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M14 5h5v5M10 14L19 5M15 5h4v4M5 10v9h9"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</span>
		</a>
	)
}
