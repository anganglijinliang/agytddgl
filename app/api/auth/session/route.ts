import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { verify, JwtPayload } from "jsonwebtoken";

// 强制动态路由
export const dynamic = "force-dynamic";

// 密钥
const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only";

// 自定义JWT接口
interface CustomJwtPayload extends JwtPayload {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  picture?: string;
  image?: string;
  sub?: string;
}

export async function GET(request: Request) {
  try {
    // 尝试从NextAuth获取令牌
    const nextAuthToken = await getToken({ 
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // 尝试从自定义Cookie获取令牌
    let customToken = null;
    const cookieStore = cookies();
    const authCookie = cookieStore.get("auth-token");
    
    if (authCookie?.value) {
      try {
        customToken = verify(authCookie.value, SECRET_KEY) as CustomJwtPayload;
      } catch (error) {
        console.error("验证自定义令牌失败:", error);
      }
    }
    
    // 使用任一有效的令牌
    const token = (nextAuthToken || customToken) as CustomJwtPayload;
    
    if (!token) {
      return NextResponse.json({ user: null });
    }
    
    // 返回用户信息
    return NextResponse.json({ 
      user: {
        id: token.id || token.sub,
        name: token.name,
        email: token.email,
        role: token.role,
        image: token.picture || token.image,
      } 
    });
  } catch (error) {
    console.error("获取session信息时出错:", error);
    return NextResponse.json({ user: null });
  }
} 