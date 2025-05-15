import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// 定义操作类型
export enum LogAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  EXPORT = "EXPORT",
  IMPORT = "IMPORT",
  VIEW = "VIEW",
  CHANGE_STATUS = "CHANGE_STATUS",
  SYSTEM = "SYSTEM"
}

// 定义资源类型
export enum LogResource {
  USER = "USER",
  ORDER = "ORDER",
  SUB_ORDER = "SUB_ORDER",
  CUSTOMER = "CUSTOMER",
  PRODUCTION = "PRODUCTION",
  SHIPPING = "SHIPPING",
  MASTER_DATA = "MASTER_DATA",
  SETTING = "SETTING",
  SYSTEM = "SYSTEM"
}

// 审计日志接口
interface AuditLogData {
  action: LogAction;
  resource: LogResource;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * 创建审计日志
 * @param data 审计日志数据
 * @param headers 请求头信息，用于获取IP地址和用户代理
 */
export async function createAuditLog(
  data: AuditLogData,
  headers?: Headers
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId && data.action !== LogAction.SYSTEM) {
      console.warn("尝试在未登录状态下创建非系统级审计日志");
      return;
    }

    // 获取IP和用户代理
    let ipAddress = data.ipAddress;
    let userAgent = data.userAgent;
    
    if (headers) {
      ipAddress = ipAddress || headers.get("x-forwarded-for") || headers.get("x-real-ip") || "未知";
      userAgent = userAgent || headers.get("user-agent") || "未知";
    }

    // 创建审计日志
    await db.auditLog.create({
      data: {
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        description: data.description,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        ipAddress: ipAddress || "未知",
        userAgent: userAgent || "未知",
        userId: userId || null
      }
    });

    console.log(`审计日志已创建: ${data.action} ${data.resource} ${data.resourceId || ''}`);
  } catch (error) {
    console.error("创建审计日志失败:", error);
  }
}

/**
 * 获取资源的审计日志
 * @param resource 资源类型
 * @param resourceId 资源ID
 * @param limit 限制数量
 */
export async function getResourceAuditLogs(
  resource: LogResource,
  resourceId: string,
  limit: number = 10
) {
  try {
    return await db.auditLog.findMany({
      where: {
        resource,
        resourceId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  } catch (error) {
    console.error("获取资源审计日志失败:", error);
    return [];
  }
}

/**
 * 获取用户的审计日志
 * @param userId 用户ID
 * @param limit 限制数量
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 20
) {
  try {
    return await db.auditLog.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: limit
    });
  } catch (error) {
    console.error("获取用户审计日志失败:", error);
    return [];
  }
}

/**
 * 获取系统审计日志
 * @param filters 过滤条件
 * @param page 页码
 * @param pageSize 每页数量
 */
export async function getSystemAuditLogs({
  resource,
  action,
  userId,
  startDate,
  endDate,
  page = 1,
  pageSize = 20
}: {
  resource?: LogResource;
  action?: LogAction;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}) {
  try {
    const skip = (page - 1) * pageSize;
    
    // 构建过滤条件
    const where: any = {};
    
    if (resource) where.resource = resource;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    
    // 日期过滤
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    
    // 查询审计日志
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      }),
      db.auditLog.count({ where })
    ]);
    
    return {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error("获取系统审计日志失败:", error);
    return {
      logs: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0
    };
  }
} 