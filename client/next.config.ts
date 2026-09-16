import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Don't emit AGENTS.md / CLAUDE.md into the repo on every dev start.
  agentRules: false,
  // The repo root also has a package-lock.json (for `concurrently`); make sure
  // Turbopack treats this folder — not the monorepo root — as the app root.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
