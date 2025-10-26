/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
  images: { dangerouslyAllowSVG: true, remotePatterns: [] }
};
export default nextConfig;
