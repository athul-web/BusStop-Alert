/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We can allow image domains if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
