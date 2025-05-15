/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  transpilePackages: ["lucide-react"],
  // 注意：不要在这里硬编码环境变量
  // 请在Vercel中配置这些环境变量
  
  // 添加自定义路由配置，处理favicon.ico
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/public/favicon.ico',
      },
    ];
  },
  
  // 禁用中间件缓存，解决认证问题
  skipMiddlewareUrlNormalize: true,
};

export default nextConfig; 