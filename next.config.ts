import type { NextConfig } from "next";


const nextConfig: NextConfig = {
      // add appwrite storage domain to allowed image domains
  images: {
    domains: ["cloud.appwrite.io"],
  },
  /* config options here */
};

export default nextConfig;
