/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  transpilePackages: ["lucide-react"],
  // 注意：不要在这里硬编码环境变量
  // 请在Vercel中配置这些环境变量
};

export default nextConfig; 