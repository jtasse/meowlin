import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Repo root also has package-lock.json (SAM/Lambda deps). Turbopack walks up to
// that lockfile and fails with "Next.js package not found" unless root is pinned
// to this app directory where node_modules/next is installed.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
