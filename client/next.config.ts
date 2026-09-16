import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Don't emit AGENTS.md / CLAUDE.md into the repo on every dev start.
  agentRules: false,
};

export default nextConfig;
