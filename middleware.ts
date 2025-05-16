import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { jwtVerify, createRemoteJWKSet } from "jose"; // 使用jose替代jsonwebtoken

// 固定的安全密钥，当环境变量未设置时使用
const FALLBACK_SECRET_KEY = "a-secure-nextauth-secret-key-for-jwt-signing-must-be-at-least-32-chars";

// 密钥 - 使用Edge兼容的方式
const getSecretKey = () => {
  const secret = process.env.NEXTAUTH_SECRET || FALLBACK_SECRET_KEY;
  return new TextEncoder().encode(secret);
};

// 中间件函数，处理每个请求
export async function middleware(req: NextRequest) {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const { pathname } = req.nextUrl;
  
  // 特殊处理静态资源和favicon.ico请求 - 直接跳过中间件处理
  if (
    pathname === "/favicon.ico" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/images/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  
  console.log(`[${requestId}] 中间件处理请求: ${pathname}`);
  // 记录Cookie，但不记录完整值以避免安全问题
  const cookieKeys = Array.from(req.cookies.getAll()).map(c => c.name);
  console.log(`[${requestId}] Cookies: [${cookieKeys.join(', ')}]`);
  
  // 1. 尝试从NextAuth获取令牌
  console.log(`[${requestId}] 尝试获取NextAuth令牌...`);
  let nextAuthToken = null;
  try {
    nextAuthToken = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET || FALLBACK_SECRET_KEY,
      secureCookie: process.env.NODE_ENV === 'production',
      cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
    });
    
    if (nextAuthToken) {
      console.log(`[${requestId}] 成功获取NextAuth令牌，用户: ${nextAuthToken.email || 'unknown'}`);
    } else {
      // 尝试备用cookie名称
      const backupCookieName = process.env.NODE_ENV === 'production' ? 'next-auth.session-token' : '__Secure-next-auth.session-token';
      console.log(`[${requestId}] 尝试使用备用cookie名称: ${backupCookieName}`);
      
      nextAuthToken = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET || FALLBACK_SECRET_KEY,
        cookieName: backupCookieName
      });
      
      if (nextAuthToken) {
        console.log(`[${requestId}] 使用备用cookie名称成功获取NextAuth令牌`);
      } else {
        console.log(`[${requestId}] 未找到NextAuth令牌`);
      }
    }
  } catch (error) {
    console.error(`[${requestId}] 获取NextAuth令牌出错:`, typeof error === 'object' ? JSON.stringify(error) : error);
  }
  
  // 2. 尝试从自定义Cookie获取令牌 - 使用Edge兼容方式
  console.log(`[${requestId}] 尝试获取自定义令牌...`);
  let customUserInfo = null;
  const authCookie = req.cookies.get("auth-token");
  
  if (authCookie?.value) {
    try {
      // 使用jose库验证JWT，这在Edge Runtime中是支持的
      const secretKey = await getSecretKey();
      const { payload } = await jwtVerify(authCookie.value, secretKey, {
        algorithms: ["HS256"],
      });
      
      customUserInfo = {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role
      };
      
      console.log(`[${requestId}] 成功获取自定义令牌，用户: ${customUserInfo.email || 'unknown'}`);
    } catch (error) {
      console.error(`[${requestId}] 自定义令牌验证失败:`, error);
    }
  } else {
    console.log(`[${requestId}] 未找到自定义令牌cookie`);
  }
  
  // 使用任一有效的令牌
  const userInfo = nextAuthToken || customUserInfo;
  const isAuthenticated = !!userInfo;

  console.log(`[${requestId}] 认证状态: ${isAuthenticated ? '已认证' : '未认证'}`);

  // 获取角色（不同认证方式可能有不同的字段格式）
  const role = userInfo ? (
    nextAuthToken?.role || // NextAuth格式
    customUserInfo?.role || // 自定义JWT格式
    'guest'
  ) : 'guest';

  // 放行 API 路由
  if (pathname.startsWith("/api/")) {
    console.log(`[${requestId}] 放行API路由: ${pathname}`);
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
    "/auth-debug",
    "/health-check",
    "/order/track" // 添加订单追踪页面为公开路由
  ];
  
  // 检查路径是否为公开路由或是否以公开路径开头
  const isPublicPath = publicPaths.some(path => 
    pathname === path || 
    pathname.startsWith(`${path}/`)
  );
  
  // 如果路径是公开路由 
  if (isPublicPath || pathname === "/") {
    // 如果已登录并访问登录页，重定向到面板
    if (isAuthenticated && (pathname === "/login" || pathname === "/" || pathname === "/simple-login" || pathname === "/test-login")) {
      console.log(`[${requestId}] 已认证用户访问登录页，重定向到dashboard`);
      const redirectUrl = new URL("/dashboard", req.url);
      
      // 确保设置正确的响应头，防止缓存
      const redirectResponse = NextResponse.redirect(redirectUrl, {
        // 使用302重定向，确保浏览器重定向过程正确
        status: 302,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Pragma": "no-cache",
          "Expires": "0",
          "x-middleware-cache": "no-cache",
          "Location": redirectUrl.toString()
        }
      });
      
      return redirectResponse;
    }
    
    console.log(`[${requestId}] 放行公开路由: ${pathname}`);
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("x-middleware-cache", "no-cache");
    return response;
  }

  // 需要认证但未认证的路由，重定向到登录页
  if (!isAuthenticated) {
    console.log(`[${requestId}] 未认证用户访问受保护路由: ${pathname}，重定向到登录页`);
    const redirectUrl = new URL("/login", req.url);
    // 添加原始URL作为查询参数，以便登录后重定向回来
    redirectUrl.searchParams.set("callbackUrl", pathname);
    
    const redirectResponse = NextResponse.redirect(redirectUrl, {
      // 使用302重定向，确保浏览器重定向过程正确
      status: 302,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Pragma": "no-cache", 
        "Expires": "0",
        "x-middleware-cache": "no-cache",
        "Location": redirectUrl.toString()
      }
    });
    
    return redirectResponse;
  }

  // 已认证用户，继续请求
  console.log(`[${requestId}] 用户: ${userInfo.email || 'unknown'}, 角色: ${role}`);
  
  const response = NextResponse.next();
  // 设置更多防缓存响应头
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("x-middleware-cache", "no-cache");
  
  return response;
}

// 配置中间件匹配的路由，排除静态资源
export const config = {
  matcher: [
    /*
     * 匹配除了静态资源以外的所有路由
     * - 匹配所有路径
     * - 排除以下路径:
     *   - _next/static (静态文件)
     *   - _next/image (图片优化API)
     *   - favicon.ico (浏览器图标)
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
}; 