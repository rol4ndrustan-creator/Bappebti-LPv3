import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "export",
    basePath: "/Bappebti-LPv3",
    assetPrefix: "/Bappebti-LPv3",
    // Dipakai komponen untuk aset statis di public/ (mis. logo instansi).
    env: { NEXT_PUBLIC_BASE_PATH: "/Bappebti-LPv3" },
    images: {
          unoptimized: true,
    },
};

export default nextConfig;
