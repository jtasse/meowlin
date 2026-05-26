export const MOBILE_FOCUS_MAX_WIDTH_PX = 768
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_FOCUS_MAX_WIDTH_PX}px)`

export type ScrollStepIntoViewOptions = {
	block?: ScrollLogicalPosition
}

export function isMobileViewport(): boolean {
	if (typeof globalThis.matchMedia !== "function") return false
	return globalThis.matchMedia(MOBILE_MEDIA_QUERY).matches
}

function prefersReducedMotion(): boolean {
	if (typeof globalThis.matchMedia !== "function") return false
	return globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function isFocusableControl(element: HTMLElement): boolean {
	const control = element as HTMLButtonElement
	if (control.getAttribute?.("aria-disabled") === "true") return false
	if (control.disabled) return false
	return typeof control.focus === "function"
}

/** Scroll a step or result region into view (mobile and desktop). */
export function scrollStepIntoView(
	scrollTarget: HTMLElement | null,
	options: ScrollStepIntoViewOptions = {},
): void {
	if (!scrollTarget) return

	const { block = "center" } = options

	scrollTarget.scrollIntoView({
		behavior: prefersReducedMotion() ? "auto" : "smooth",
		block,
	})
}

/**
 * On narrow viewports, scroll the next step into view and optionally focus its control.
 */
export function focusNextOnMobile(
	scrollTarget: HTMLElement | null,
	focusTarget?: HTMLElement | null,
	options?: ScrollStepIntoViewOptions,
): void {
	if (!scrollTarget || !isMobileViewport()) return

	scrollStepIntoView(scrollTarget, options)

	if (focusTarget && isFocusableControl(focusTarget)) {
		focusTarget.focus({ preventScroll: true })
	}
}
