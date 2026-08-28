import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/norra-plan" : "",
  trailingSlash: true,
};

export default nextConfig;
