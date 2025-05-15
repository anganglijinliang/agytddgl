import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// 检查数据库迁移状态并应用必要的迁移
export async function checkDatabaseMigration() {
  try {
    // 检查数据库连接
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ 数据库连接成功");
    
    // 仅在开发环境中自动运行迁移
    if (process.env.NODE_ENV === "development") {
      try {
        // 尝试运行迁移状态检查
        const { stdout: statusOut } = await execAsync("npx prisma migrate status");
        console.log("数据库迁移状态:", statusOut);
        
        // 检查是否需要应用迁移
        if (statusOut.includes("have not been applied") || statusOut.includes("需要应用")) {
          console.log("🔄 正在应用数据库迁移...");
          const { stdout } = await execAsync("npx prisma migrate deploy");
          console.log("✅ 数据库迁移成功应用:", stdout);
        } else {
          console.log("✓ 数据库迁移已是最新");
        }
      } catch (execError) {
        console.error("⚠️ 迁移状态检查失败:", execError);
        // 如果状态检查失败，尝试强制迁移
        try {
          console.log("🔄 尝试强制应用数据库迁移...");
          const { stdout } = await execAsync("npx prisma migrate deploy");
          console.log("✅ 数据库迁移成功应用:", stdout);
        } catch (migrateError) {
          console.error("❌ 数据库迁移失败:", migrateError);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("❌ 数据库连接或迁移检查失败:", error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
} 