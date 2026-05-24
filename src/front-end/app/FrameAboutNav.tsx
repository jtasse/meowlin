"use client"

import {
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
	type ReactNode,
} from "react"

import { ExternalDrawerLink } from "./ExternalDrawerLink"
import styles from "./page.module.css"

const CLOSE_DELAY_MS = 2000

type DrawerId = "demo" | "author"

type AboutDrawerItemProps = {
	label: string
	isOpen: boolean
	isPinned: boolean
	onHoverStart: () => void
	onHeaderClick: () => void
	children: ReactNode
}

function AboutDrawerItem({
	label,
	isOpen,
	isPinned,
	onHoverStart,
	onHeaderClick,
	children,
}: AboutDrawerItemProps) {
	const panelId = useId()

	return (
		<div
			className={`${styles.aboutDrawer} ${isOpen ? styles.aboutDrawerOpen : ""} ${isPinned ? styles.aboutDrawerPinned : ""}`}
			onMouseEnter={onHoverStart}
		>
			<button
				type="button"
				className={styles.aboutDrawerTrigger}
				aria-expanded={isOpen}
				aria-controls={panelId}
				onClick={onHeaderClick}
			>
				<span>{label}</span>
				<span className={styles.aboutDrawerChevron} aria-hidden="true" />
			</button>
			<div
				id={panelId}
				className={styles.aboutDrawerPanel}
				role="region"
				aria-label={label}
				aria-hidden={!isOpen}
			>
				<div className={styles.aboutDrawerPanelInner}>{children}</div>
			</div>
		</div>
	)
}

export function FrameAboutNav() {
	const [openDrawer, setOpenDrawer] = useState<DrawerId | null>(null)
	const [pinnedDrawer, setPinnedDrawer] = useState<DrawerId | null>(null)
	const navRef = useRef<HTMLElement>(null)
	const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const clearCloseTimer = useCallback(() => {
		if (closeTimerRef.current) {
			clearTimeout(closeTimerRef.current)
			closeTimerRef.current = null
		}
	}, [])

	const closeNow = useCallback(() => {
		clearCloseTimer()
		setOpenDrawer(null)
		setPinnedDrawer(null)
	}, [clearCloseTimer])

	const openDrawerNow = useCallback(
		(id: DrawerId) => {
			clearCloseTimer()
			setOpenDrawer(id)
		},
		[clearCloseTimer],
	)

	const scheduleClose = useCallback(() => {
		if (pinnedDrawer) return

		clearCloseTimer()
		closeTimerRef.current = setTimeout(() => {
			setOpenDrawer(null)
			closeTimerRef.current = null
		}, CLOSE_DELAY_MS)
	}, [clearCloseTimer, pinnedDrawer])

	const handleNavMouseLeave = useCallback(() => {
		if (pinnedDrawer) {
			clearCloseTimer()
			setOpenDrawer(pinnedDrawer)
			return
		}
		scheduleClose()
	}, [pinnedDrawer, clearCloseTimer, scheduleClose])

	const handleHeaderClick = useCallback(
		(id: DrawerId) => {
			clearCloseTimer()
			if (openDrawer === id) {
				if (pinnedDrawer === id) {
					setOpenDrawer(null)
					setPinnedDrawer(null)
				} else {
					setPinnedDrawer(id)
				}
				return
			}
			setOpenDrawer(id)
			setPinnedDrawer(id)
		},
		[clearCloseTimer, openDrawer, pinnedDrawer],
	)

	useEffect(() => {
		return () => clearCloseTimer()
	}, [clearCloseTimer])

	useEffect(() => {
		if (!openDrawer) return

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				closeNow()
			}
		}

		document.addEventListener("keydown", onKeyDown)
		return () => document.removeEventListener("keydown", onKeyDown)
	}, [openDrawer, closeNow])

	return (
		<nav
			ref={navRef}
			className={styles.frameNav}
			aria-label="About"
			onMouseEnter={clearCloseTimer}
			onMouseLeave={handleNavMouseLeave}
		>
			<div className={styles.aboutNavShell}>
				<AboutDrawerItem
					label="About this demo"
					isOpen={openDrawer === "demo"}
					isPinned={pinnedDrawer === "demo"}
					onHoverStart={() => openDrawerNow("demo")}
					onHeaderClick={() => handleHeaderClick("demo")}
				>
					<p className={styles.aboutDrawerText}>
						Meowlin is a React + AWS solution that simulates the
						identification of cat breeds based on uploaded meow audio. It
						leverages AWS SAM, API Gateway, Lambda, S3, SQS, and DynamoDB to
						simulate processing them asynchronously to determine if any meows
						and corresponding cat breeds can be identified. For more info,
						check out the{" "}
						<ExternalDrawerLink href="https://github.com/jtasse/meowlin/blob/main/README.md">
							docs
						</ExternalDrawerLink>
						.
					</p>
				</AboutDrawerItem>

				<AboutDrawerItem
					label="About the author"
					isOpen={openDrawer === "author"}
					isPinned={pinnedDrawer === "author"}
					onHoverStart={() => openDrawerNow("author")}
					onHeaderClick={() => handleHeaderClick("author")}
				>
					<p className={styles.aboutDrawerText}>
						You can find me on LinkedIn at{" "}
						<ExternalDrawerLink href="https://www.linkedin.com/in/jtasse/">
							linkedin.com/in/jtasse
						</ExternalDrawerLink>
						. To see my other work, visit my{" "}
						<ExternalDrawerLink href="https://jamestasse.tech/portfolio/">
							portfolio
						</ExternalDrawerLink>{" "}
						or{" "}
						<ExternalDrawerLink href="https://github.com/jtasse">
							GitHub profile
						</ExternalDrawerLink>
						.
					</p>
				</AboutDrawerItem>
			</div>
		</nav>
	)
}
