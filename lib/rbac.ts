import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

// 定义资源类型
export type Resource = 
  | "dashboard"
  | "orders"
  | "production"
  | "shipping"
  | "master-data"
  | "statistics"
  | "settings"
  | "users"
  | "inventory"
  | "analytics"
  | "orders:create"
  | "production:scheduling"
  | "users:manage"
  | "audit:view";

// 定义操作类型
export type Action = "view" | "create" | "update" | "delete" | "export" | "import" | "read" | "write" | "manage";

// 角色权限映射表
const rolePermissions: Record<UserRole, Record<Resource, Action[]>> = {
  SUPER_ADMIN: {
    dashboard: ["view", "read"],
    orders: ["view", "create", "update", "delete", "export", "import", "read", "write", "manage"],
    "orders:create": ["create", "read", "write"],
    production: ["view", "create", "update", "delete", "export", "import", "read", "write", "manage"],
    "production:scheduling": ["view", "create", "update", "read", "write", "manage"],
    shipping: ["view", "create", "update", "delete", "export", "import", "read", "write", "manage"],
    "master-data": ["view", "create", "update", "delete", "export", "import", "read", "write", "manage"],
    statistics: ["view", "export", "read"],
    settings: ["view", "update", "read", "write", "manage"],
    users: ["view", "create", "update", "delete", "read", "write", "manage"],
    "users:manage": ["view", "create", "update", "delete", "read", "write", "manage"],
    inventory: ["view", "create", "update", "delete", "export", "import", "read", "write", "manage"],
    analytics: ["view", "export", "read"],
    "audit:view": ["view", "read"]
  },
  ADMIN: {
    dashboard: ["view", "read"],
    orders: ["view", "create", "update", "delete", "export", "import", "read", "write", "manage"],
    "orders:create": ["create", "read", "write"],
    production: ["view", "create", "update", "delete", "export", "import", "read", "write", "manage"],
    "production:scheduling": ["view", "create", "update", "read", "write", "manage"],
    shipping: ["view", "create", "update", "delete", "export", "import", "read", "write", "manage"],
    "master-data": ["view", "create", "update", "delete", "export", "import", "read", "write", "manage"],
    statistics: ["view", "export", "read"],
    settings: ["view", "update", "read", "write", "manage"],
    users: ["view", "create", "update", "read", "write", "manage"],
    "users:manage": ["view", "create", "update", "read", "write", "manage"],
    inventory: ["view", "create", "update", "delete", "export", "import", "read", "write", "manage"],
    analytics: ["view", "export", "read"],
    "audit:view": ["view", "read"]
  },
  ORDER_SPECIALIST: {
    dashboard: ["view", "read"],
    orders: ["view", "create", "update", "export", "import", "read", "write"],
    "orders:create": ["create", "read", "write"],
    production: ["view", "read"],
    "production:scheduling": ["view", "read"],
    shipping: ["view", "read"],
    "master-data": ["view", "read"],
    statistics: ["view", "export", "read"],
    settings: ["view", "read"],
    users: [],
    "users:manage": [],
    inventory: ["view", "read"],
    analytics: ["view", "read"],
    "audit:view": []
  },
  PRODUCTION_STAFF: {
    dashboard: ["view", "read"],
    orders: ["view", "read"],
    "orders:create": [],
    production: ["view", "create", "update", "export", "read", "write"],
    "production:scheduling": ["view", "create", "update", "read", "write"],
    shipping: ["view", "read"],
    "master-data": ["view", "read"],
    statistics: ["view", "read"],
    settings: [],
    users: [],
    "users:manage": [],
    inventory: ["view", "read"],
    analytics: ["view", "read"],
    "audit:view": []
  },
  SHIPPING_STAFF: {
    dashboard: ["view", "read"],
    orders: ["view", "read"],
    "orders:create": [],
    production: ["view", "read"],
    "production:scheduling": ["view", "read"],
    shipping: ["view", "create", "update", "export", "read", "write"],
    "master-data": ["view", "read"],
    statistics: ["view", "read"],
    settings: [],
    users: [],
    "users:manage": [],
    inventory: ["view", "update", "read", "write"],
    analytics: ["view", "read"],
    "audit:view": []
  },
  READ_ONLY: {
    dashboard: ["view", "read"],
    orders: ["view", "read"],
    "orders:create": [],
    production: ["view", "read"],
    "production:scheduling": ["view", "read"],
    shipping: ["view", "read"],
    "master-data": ["view", "read"],
    statistics: ["view", "read"],
    settings: [],
    users: [],
    "users:manage": [],
    inventory: ["view", "read"],
    analytics: ["view", "read"],
    "audit:view": []
  }
};

// 检查用户是否有权限执行特定资源的操作
export async function checkPermission(resource: Resource, action: Action): Promise<boolean> {
  const session = await auth();
  
  // 未登录用户没有权限
  if (!session || !session.user) {
    return false;
  }
  
  const userRole = session.user.role as UserRole;
  
  // 检查角色是否存在
  if (!rolePermissions[userRole]) {
    return false;
  }
  
  // 检查资源是否存在
  if (!rolePermissions[userRole][resource]) {
    return false;
  }
  
  // 检查操作是否被允许
  return rolePermissions[userRole][resource].includes(action);
}

// 用于服务器组件的权限检查高阶函数
export async function withPermission(
  resource: Resource, 
  action: Action, 
  redirectTo: string = "/dashboard"
) {
  const hasPermission = await checkPermission(resource, action);
  
  if (!hasPermission) {
    redirect(redirectTo);
  }
}

// 客户端权限检查
export const hasPermissionClient = (
  userRole: UserRole | undefined,
  resource: Resource,
  action: Action
): boolean => {
  if (!userRole || !rolePermissions[userRole]) {
    return false;
  }
  
  if (!rolePermissions[userRole][resource]) {
    return false;
  }
  
  return rolePermissions[userRole][resource].includes(action);
};

// 客户端访问权限检查 - 简化版本，用于导航等场景
export const canAccess = (
  userRole: UserRole | undefined,
  resource: string,
  action: Action = "read"
): boolean => {
  if (!userRole) return false;
  
  // 处理资源名称，支持子资源格式（如 "orders:create"）
  const resourceKey = resource as Resource;
  
  if (!rolePermissions[userRole]) {
    return false;
  }
  
  // 检查是否存在对应的资源权限配置
  if (rolePermissions[userRole][resourceKey]) {
    return rolePermissions[userRole][resourceKey].includes(action);
  }
  
  // 如果是子资源格式，尝试检查父资源权限
  if (resource.includes(':')) {
    const parentResource = resource.split(':')[0] as Resource;
    if (rolePermissions[userRole][parentResource]) {
      return rolePermissions[userRole][parentResource].includes(action);
    }
  }
  
  return false;
}; 