/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the browser on this LAN IP to load Next.js dev assets from the local server.
  // If the machine's IP changes, update this hostname here and in serverActions.allowedOrigins.
  allowedDevOrigins: ['192.168.1.100'],
  experimental: {
    serverActions: {
      allowedOrigins: ['*.loca.lt', 'localhost:3000', '192.168.1.100:3000'],
    },
  },
};

export default nextConfig;
