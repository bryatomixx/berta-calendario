import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project is its own repository. Pin the workspace root so Next.js
  // does not infer the parent monorepo directory from sibling lockfiles.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
