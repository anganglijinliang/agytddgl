import { db } from "./db";
import { getCurrentUser } from "./session";

/**
 * 创建审计日志
 */
export async function createAuditLog({
  action,
  resource,
  resourceId,
  description,
  metadata,
}: {
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  metadata?: string;
}) {
  try {
    const user = await getCurrentUser();
    const userId = user?.id;
    
    // 获取客户端信息 - 在服务器端可以为空
    let ipAddress = "";
    let userAgent = "";
    
    if (typeof window !== "undefined") {
      // 用户代理
      userAgent = window.navigator.userAgent;
    }
    
    await db.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        description,
        metadata,
        ipAddress,
        userAgent,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error("创建审计日志失败:", error);
    return { success: false, error: "创建审计日志失败" };
  }
} 