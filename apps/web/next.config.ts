import type { NextConfig } from "next";
import path from "node:path";

const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(import.meta.dirname, "../.."),
  transpilePackages: ["@onit/core"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
