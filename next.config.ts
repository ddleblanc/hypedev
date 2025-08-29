import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
       {
        protocol: "https",
        hostname: "www.fiercepc.co.uk",
      },
      {
        protocol: "https",
        hostname: "image.civitai.com",
      },
    ],
  },
};

export default nextConfig;
