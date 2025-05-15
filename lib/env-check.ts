import { PrismaClient } from "@prisma/client";

// 检查环境变量配置
export function checkRequiredEnvVars(): void {
  const prismaEnvs = ["DATABASE_URL"];
  const authEnvs = ["NEXTAUTH_SECRET", "NEXTAUTH_URL"];
  const missingEnvs: string[] = [];

  // 检查必要的Prisma环境变量
  prismaEnvs.forEach((env) => {
    if (!process.env[env]) {
      // 仅在生产环境中记录警告
      if (process.env.NODE_ENV === "production") {
        console.warn(`警告: 缺少环境变量 ${env}`);
      }
      missingEnvs.push(env);
    }
  });

  // 检查认证环境变量
  authEnvs.forEach((env) => {
    if (!process.env[env]) {
      if (env === "NEXTAUTH_SECRET" && process.env.NODE_ENV === "production") {
        console.warn(`警告: 未设置 ${env}，将使用默认值`);
        process.env.NEXTAUTH_SECRET = "fallback-secret-key-for-" + process.env.NODE_ENV;
      } else if (env === "NEXTAUTH_URL" && process.env.NODE_ENV === "production") {
        const defaultUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';
        console.warn(`警告: 未设置 ${env}，将使用默认值: ${defaultUrl}`);
        process.env.NEXTAUTH_URL = defaultUrl;
      } else if (process.env.NODE_ENV === "production") {
        console.warn(`警告: 缺少环境变量 ${env}`);
      }
    }
  });

  // 仅在开发环境中抛出错误
  if (missingEnvs.length > 0 && process.env.NODE_ENV === "development") {
    throw new Error(
      `缺少必要的环境变量: ${missingEnvs.join(
        ", "
      )}. 请检查.env或.env.local文件`
    );
  }
}

// 检查数据库连接
export async function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL) return false;

  try {
    console.log("测试数据库连接...");
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();
    console.log("成功连接到数据库");
    return true;
  } catch (error) {
    console.error("数据库连接失败:", error);
    return false;
  }
} 