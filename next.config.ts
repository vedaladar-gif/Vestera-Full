import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: '/Vestera-Sponsor-One-Pager.pdf', destination: '/sponsor-one-pager.pdf', permanent: true }];
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
