/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['*.loca.lt', 'localhost:3000'],
    },
  },
};

export default nextConfig;