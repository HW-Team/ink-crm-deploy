/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack root = build dir (avoids workspace-root inference across lockfiles)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
