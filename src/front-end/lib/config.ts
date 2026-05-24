const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/** Prefix a site-root path for GitHub Pages (`NEXT_PUBLIC_BASE_PATH`, e.g. `/meowlin`). */
export function withBasePath(path: string): string {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${basePath}${normalized}`;
}

export const config = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
    appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "local",
    basePath,
};