/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
  images: { dangerouslyAllowSVG: true, remotePatterns: [] },
  serverActions: { bodySizeLimit: '10mb' },
};
export default nextConfig;
