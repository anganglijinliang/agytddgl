import { db } from "@/lib/db";

export const dynamic = 'force-dynamic';

export default async function HealthCheckPage() {
  let dbStatus = "未检查";
  let nextAuthConfig = "未检查";

  try {
    // 测试数据库连接
    await db.$queryRaw`SELECT 1`;
    dbStatus = "连接成功";
  } catch (error) {
    dbStatus = `连接失败: ${error instanceof Error ? error.message : String(error)}`;
  }

  // 检查NextAuth配置
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET ? "已设置" : "未设置";

  // 格式化为JSON以便显示
  nextAuthConfig = JSON.stringify({
    NEXTAUTH_URL: nextAuthUrl,
    NEXTAUTH_SECRET: nextAuthSecret,
  }, null, 2);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">系统健康检查</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">数据库状态</h2>
        <pre className="bg-gray-100 p-4 rounded">{dbStatus}</pre>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">NextAuth配置</h2>
        <pre className="bg-gray-100 p-4 rounded">{nextAuthConfig}</pre>
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">环境变量</h2>
        <pre className="bg-gray-100 p-4 rounded">
          NODE_ENV: {process.env.NODE_ENV}
        </pre>
      </div>
    </div>
  );
} 