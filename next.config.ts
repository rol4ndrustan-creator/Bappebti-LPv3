import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "export",
    basePath: "/Bappebti-LPv3",
    assetPrefix: "/Bappebti-LPv3",
    images: {
          unoptimized: true,
    },
};

export default nextConfig;
