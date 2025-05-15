import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { UserRole } from "@prisma/client";

// 设置为动态路由，因为使用了cookies()函数
export const dynamic = "force-dynamic";

// 测试用户
const TEST_USERS = [
  {
    id: "test-admin-1",
    name: "管理员",
    email: "admin@example.com",
    password: "$2a$10$nKLESvUKFNCcqduxs8qCFOx6JWuaQLoLatOk22qcqZ0Tgp50zkaRW", // 'Admin123!'
    role: UserRole.ADMIN,
    image: null,
  }
];

// 密钥
const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only";

// 这个路由专门处理callbacks/credentials的POST请求
export async function POST(request: Request) {
  try {
    console.log("凭证回调API收到请求，时间:", new Date().toISOString());
    
    // 解析请求体
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;
    
    console.log("尝试验证凭证:", email ? email : "未提供邮箱");
    
    // 验证参数
    if (!email || !password) {
      console.error("凭证缺失");
      return NextResponse.json({ error: "邮箱和密码是必需的" }, { status: 400 });
    }
    
    // 查找用户
    const normalizedEmail = email.toLowerCase().trim();
    const user = TEST_USERS.find(u => u.email === normalizedEmail);
    
    if (!user) {
      console.error(`用户不存在: ${normalizedEmail}`);
      return NextResponse.json({ error: "无效的凭证" }, { status: 401 });
    }
    
    // 验证密码
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      console.error(`密码错误: ${normalizedEmail}`);
      return NextResponse.json({ error: "无效的凭证" }, { status: 401 });
    }
    
    // 创建令牌
    const token = sign(
      { 
        id: user.id, 
        email: user.email,
        name: user.name,
        role: user.role,
      }, 
      SECRET_KEY, 
      { expiresIn: "24h" }
    );
    
    // 设置Cookie
    cookies().set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1天
      path: "/",
    });
    
    console.log(`凭证验证成功，用户: ${normalizedEmail}`);
    
    // 返回成功响应
    return NextResponse.json({
      ok: true,
      url: "/dashboard", 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
    
  } catch (error) {
    console.error("凭证验证过程中出现错误:", error);
    return NextResponse.json(
      { error: "认证处理失败", message: (error as Error).message }, 
      { status: 500 }
    );
  }
}

// 获取请求处理
export async function GET() {
  return NextResponse.json({ message: "该API仅支持POST请求，用于验证凭证" });
} 