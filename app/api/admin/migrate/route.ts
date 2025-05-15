import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { auth } from "@/lib/auth";
import { UserRole } from "@/types";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    // 验证管理员身份
    const session = await auth();
    if (!session?.user || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    
    // 获取API密钥（双重安全措施）
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "无效的API密钥" }, { status: 401 });
    }
    
    // 执行Prisma生成和迁移
    console.log("📝 开始数据库迁移...");

    const { stdout: generateOut, stderr: generateErr } = await execAsync("npx prisma generate");
    if (generateErr) {
      console.error("❌ Prisma Client生成失败:", generateErr);
      throw new Error(generateErr);
    }
    console.log("✅ Prisma Client生成成功:", generateOut);
    
    const { stdout: migrateOut, stderr: migrateErr } = await execAsync("npx prisma migrate deploy");
    if (migrateErr) {
      console.error("❌ 数据库迁移失败:", migrateErr);
      throw new Error(migrateErr);
    }
    console.log("✅ 数据库迁移成功:", migrateOut);
    
    return NextResponse.json({ 
      success: true,
      message: "数据库迁移成功",
      details: {
        generate: generateOut,
        migrate: migrateOut
      }
    });
  } catch (error) {
    console.error("❌ 数据库迁移API错误:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: typeof error === 'object' && error !== null 
          ? (error as any).message || String(error) 
          : String(error)
      },
      { status: 500 }
    );
  }
} 