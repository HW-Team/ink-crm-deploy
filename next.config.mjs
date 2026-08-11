import path from 'node:path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack root = build dir (avoids workspace-root inference across lockfiles)
  turbopack: {
    root: process.cwd(),
    // Explicit @/* alias — Turbopack in the CI container did NOT pick up
    // tsconfig "paths" (37× "Can't resolve '@/lib/…'"). resolveAlias is the
    // documented Next 16 mechanism and works regardless of tsconfig handling.
    resolveAlias: {
      '@/*': path.join(process.cwd(), 'src/*'),
    },
  },
};

export default nextConfig;
