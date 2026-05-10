/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
