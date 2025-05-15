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
  const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const { pathname } = req.nextUrl;
  
  console.log(`[${requestId}] 中间件处理请求: ${pathname}`);
  
  // 特殊处理favicon.ico请求 - 完全跳过中间件处理
  if (pathname === "/favicon.ico") {
    console.log(`[${requestId}] 完全跳过favicon.ico请求`);
    return; // 直接返回undefined，让Next.js继续处理
  }
  
  // 1. 尝试从NextAuth获取令牌
  console.log(`[${requestId}] 尝试获取NextAuth令牌...`);
  const nextAuthToken = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
  });
  
  if (nextAuthToken) {
    console.log(`[${requestId}] 成功获取NextAuth令牌，用户: ${nextAuthToken.email || 'unknown'}`);
  } else {
    console.log(`[${requestId}] 未找到NextAuth令牌`);
  }
  
  // 2. 尝试从自定义Cookie获取令牌
  console.log(`[${requestId}] 尝试获取自定义令牌...`);
  let customToken: CustomJwtPayload | null = null;
  const authCookie = req.cookies.get("auth-token");
  
  if (authCookie?.value) {
    try {
      customToken = verify(authCookie.value, SECRET_KEY) as CustomJwtPayload;
      console.log(`[${requestId}] 成功获取自定义令牌，用户: ${customToken.email || 'unknown'}`);
    } catch (error) {
      console.error(`[${requestId}] 自定义令牌验证失败:`, error);
    }
  } else {
    console.log(`[${requestId}] 未找到自定义令牌cookie`);
    console.log(`[${requestId}] 所有可用cookies:`, Array.from(req.cookies.getAll()).map(c => c.name).join(', '));
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
  console.log(`[${requestId}] 中间件认证状态:`, { 
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
    console.log(`[${requestId}] 放行API或静态资源路由: ${pathname}`);
    const response = NextResponse.next();
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
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
      console.log(`[${requestId}] 已认证用户访问登录页，重定向到dashboard`);
      const redirectResponse = NextResponse.redirect(new URL("/dashboard", req.url));
      redirectResponse.headers.set("x-middleware-cache", "no-cache");
      return redirectResponse;
    }
    console.log(`[${requestId}] 放行公开路由: ${pathname}`);
    const response = NextResponse.next();
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }

  // 需要认证但未认证的路由，重定向到登录页
  if (!isAuthenticated) {
    console.log(`[${requestId}] 未认证用户访问受保护路由: ${pathname}，重定向到登录页`);
    const redirectResponse = NextResponse.redirect(new URL("/login", req.url));
    redirectResponse.headers.set("x-middleware-cache", "no-cache");
    return redirectResponse;
  }

  // 已认证用户，继续请求
  console.log(`[${requestId}] 已认证用户访问受保护路由: ${pathname}，放行请求`);
  const response = NextResponse.next();
  response.headers.set("x-middleware-cache", "no-cache");
  return response;
}

// 配置中间件匹配的路由
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}; 