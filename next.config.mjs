/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack root = build dir (avoids workspace-root inference across lockfiles)
  turbopack: {
    root: process.cwd(),
    // @/* alias resolves via tsconfig.json "paths" (now raw in repo).
    // NOTE: do NOT add resolveAlias with an absolute path — Turbopack turns it
    // into a "server relative import" which is NOT implemented ("Can't resolve
    // './app/src/…'" + "server relative imports are not implemented yet").
  },
};

export default nextConfig;
