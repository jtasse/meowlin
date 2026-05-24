const DEFAULT_ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

function parseAllowedOrigins() {
	const raw = process.env.CORS_ALLOWED_ORIGINS
	if (!raw) {
		return DEFAULT_ALLOWED_ORIGINS
	}
	return raw
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean)
}

function getRequestOrigin(event) {
	const headers = event?.headers ?? {}
	return headers.origin ?? headers.Origin ?? ""
}

/**
 * Returns CORS headers for API responses. Echoes the request Origin when it is
 * in the deploy-time allowlist; otherwise omits Access-Control-Allow-Origin.
 */
function buildCorsHeaders(event) {
	const allowedOrigins = parseAllowedOrigins()
	const requestOrigin = getRequestOrigin(event)

	const headers = {
		"Content-Type": "application/json",
		"Access-Control-Allow-Headers": "Content-Type",
		"Vary": "Origin",
	}

	if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
		headers["Access-Control-Allow-Origin"] = requestOrigin
	}

	return headers
}

module.exports = {
	buildCorsHeaders,
	parseAllowedOrigins,
}
