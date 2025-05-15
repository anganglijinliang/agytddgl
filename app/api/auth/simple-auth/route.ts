import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";

// 设置为动态路由，因为使用了cookies()函数
export const dynamic = "force-dynamic";

// 硬编码的测试用户
const TEST_USERS = [
  {
    id: "test-admin-1",
    name: "管理员",
    email: "admin@example.com",
    // Admin123!
    password: "$2a$10$nKLESvUKFNCcqduxs8qCFOx6JWuaQLoLatOk22qcqZ0Tgp50zkaRW",
    role: "ADMIN"
  }
];

// 密钥
const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development-only";

export async function POST(request: Request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { email, password } = body;
    
    console.log("简易登录API收到请求:", { email });
    
    // 验证参数
    if (!email || !password) {
      return NextResponse.json(
        { error: "请提供邮箱和密码" }, 
        { status: 400 }
      );
    }
    
    // 查找用户
    const normalizedEmail = email.toLowerCase().trim();
    const user = TEST_USERS.find(u => u.email === normalizedEmail);
    
    if (!user) {
      console.log(`用户不存在: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "无效的用户名或密码" }, 
        { status: 401 }
      );
    }
    
    // 验证密码
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`密码错误: ${normalizedEmail}`);
      return NextResponse.json(
        { error: "无效的用户名或密码" }, 
        { status: 401 }
      );
    }
    
    // 创建JWT令牌
    const token = sign(
      { 
        id: user.id, 
        email: user.email,
        name: user.name,
        role: user.role
      }, 
      SECRET_KEY, 
      { expiresIn: "24h" }
    );
    
    // 设置Cookie
    cookies().set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1天
      path: "/"
    });
    
    console.log(`登录成功: ${normalizedEmail}`);
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error("登录处理出错:", error);
    return NextResponse.json(
      { error: "登录处理过程中出现错误" }, 
      { status: 500 }
    );
  }
} 