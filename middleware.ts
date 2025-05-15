import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verify, JwtPayload } from "jsonwebtoken";

// 秘钥
const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only";

// 自定义JWT接口
interface CustomJwtPayload extends JwtPayload {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

// 中间件函数，处理每个请求
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 特殊处理favicon.ico请求
  if (pathname === "/favicon.ico") {
    // 由于我们已经在根目录放置了favicon.ico，直接放行这个请求
    return NextResponse.next();
  }
  
  // 1. 尝试从NextAuth获取令牌
  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // 2. 尝试从自定义Cookie获取令牌
  let customToken: CustomJwtPayload | null = null;
  const authCookie = req.cookies.get("auth-token");
  
  if (authCookie?.value) {
    try {
      customToken = verify(authCookie.value, SECRET_KEY) as CustomJwtPayload;
      console.log("自定义令牌验证成功:", customToken);
    } catch (error) {
      console.error("自定义令牌验证失败:", error);
    }
  }
  
  // 使用任一有效的令牌
  const token = nextAuthToken || customToken;
  const isAuthenticated = !!token;

  // 获取角色（不同认证方式可能有不同的字段格式）
  const role = token ? (
    nextAuthToken?.role || // NextAuth格式
    (customToken as CustomJwtPayload)?.role || // 自定义JWT格式
    'guest'
  ) : 'guest';

  // 调试日志
  console.log("中间件处理:", { 
    path: pathname, 
    isAuthenticated, 
    tokenType: nextAuthToken ? "nextauth" : (customToken ? "custom" : "none"),
    role,
    isApiRoute: pathname.includes('/api/') 
  });

  // 放行 API 路由和其他不需要权限的路由
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/images/") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 公开路由，无需认证
  const publicPaths = [
    "/login", 
    "/register", 
    "/forgot-password", 
    "/reset-password", 
    "/test-login", 
    "/simple-login",
    "/auth-debug"
  ];
  if (publicPaths.includes(pathname) || pathname === "/") {
    // 如果已登录并访问登录页，重定向到面板
    if (isAuthenticated && (pathname === "/login" || pathname === "/" || pathname === "/simple-login" || pathname === "/test-login")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 需要认证但未认证的路由，重定向到登录页
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 已认证用户，继续请求
  return NextResponse.next();
}

// 配置中间件匹配的路由
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}; 