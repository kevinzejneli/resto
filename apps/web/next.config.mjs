/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship raw TS; let Next transpile them.
  transpilePackages: ["@resto/core", "@resto/integrations", "@resto/api-client"],
};

export default nextConfig;
