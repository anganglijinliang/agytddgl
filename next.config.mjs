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
  
  // 添加自定义headers，改善缓存控制
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // 禁用中间件缓存，解决认证问题
  skipMiddlewareUrlNormalize: true,
  
  // 优化输出配置
  output: 'standalone',
  
  // 明确设置distDir
  distDir: '.next',
  
  // 图像优化配置
  images: {
    domains: ['*'],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig; 