import { NextResponse } from "next/server";
import { verify, JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";

// 自定义JWT接口
interface CustomJwtPayload extends JwtPayload {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

// 密钥
const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only";

// 设置为动态路由，因为使用了cookies()和headers()函数
export const dynamic = "force-dynamic";

// 创建一个本地Prisma客户端，仅用于诊断
let prisma: PrismaClient;
try {
  prisma = new PrismaClient();
} catch (error) {
  console.error("创建Prisma客户端时出错:", error);
}

export async function GET() {
  try {
    // 收集环境信息
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.split("://")[0] : null,
      serverTime: new Date().toISOString(),
    };
    
    // 检查会话
    let sessionInfo = null;
    try {
      const session = await getServerSession();
      sessionInfo = {
        exists: !!session,
        user: session?.user ? {
          name: session.user.name,
          email: session.user.email,
          // 不返回敏感数据
        } : null,
      };
    } catch (sessionError) {
      sessionInfo = { error: "获取会话时出错", message: (sessionError as Error).message };
    }
    
    // 检查Cookie
    const cookieInfo = {
      allCookieNames: cookies().getAll().map(c => c.name),
      hasSessionToken: !!cookies().get("next-auth.session-token"),
      hasCustomToken: !!cookies().get("auth-token"),
    };
    
    // 检查数据库连接
    let dbInfo = null;
    try {
      if (prisma) {
        await prisma.$queryRaw`SELECT 1`;
        
        // 检查用户表
        const userCount = await prisma.user.count();
        
        dbInfo = {
          connectionStatus: "已连接",
          userTableStatus: "可访问",
          userCount,
        };
      } else {
        dbInfo = { connectionStatus: "Prisma客户端初始化失败" };
      }
    } catch (dbError) {
      dbInfo = { 
        connectionStatus: "连接失败", 
        error: (dbError as Error).message,
        // 如果是ConnectionError，可能有其他字段
        code: (dbError as any).code,
      };
    }
    
    // 返回所有诊断信息
    return NextResponse.json({
      environment: environmentInfo,
      session: sessionInfo,
      cookies: cookieInfo,
      database: dbInfo,
    });
    
  } catch (error) {
    console.error("生成诊断信息时出错:", error);
    return NextResponse.json(
      { error: "生成诊断信息时出错", message: (error as Error).message }, 
      { status: 500 }
    );
  } finally {
    // 确保关闭Prisma连接
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch (e) {
        console.error("断开Prisma连接时出错:", e);
      }
    }
  }
} 