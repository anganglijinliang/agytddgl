import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

// 设置为动态路由
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

// 处理GET请求
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for login." },
    { status: 405 }
  );
}

// 处理PUT请求
export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for login." },
    { status: 405 }
  );
}

// 处理DELETE请求
export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for login." },
    { status: 405 }
  );
}

// 处理POST请求
export async function POST(request: Request) {
  const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  const timestamp = new Date().toISOString();
  console.log(`[${requestId}][${timestamp}] 开始处理登录请求`);
  
  try {
    // 解析请求体
    const body = await request.json().catch(error => {
      console.error(`[${requestId}] 请求体解析失败:`, error);
      throw new Error('无效的请求格式');
    });
    
    const { email, password } = body;
    
    console.log(`[${requestId}] 收到登录请求: ${email}, 时间: ${timestamp}`);
    
    // 验证参数
    if (!email || !password) {
      console.warn(`[${requestId}] 参数缺失: email=${!!email}, password=${!!password}`);
      return NextResponse.json({ 
        success: false, 
        error: "请提供邮箱和密码",
        requestId
      }, { status: 400 });
    }
    
    // 标准化邮箱地址
    const normalizedEmail = email.toLowerCase().trim();
    
    // 尝试查找用户
    let user;
    let dbConnected = false;
    
    try {
      // 先尝试从数据库查找
      try {
        console.log(`[${requestId}] 尝试连接数据库...`);
        await db.$queryRaw`SELECT 1`;
        console.log(`[${requestId}] 数据库连接成功`);
        dbConnected = true;
        
        user = await db.user.findUnique({
          where: { email: normalizedEmail },
        });
        
        if (user) {
          console.log(`[${requestId}] 在数据库中找到用户 ${normalizedEmail}`);
        } else {
          console.log(`[${requestId}] 在数据库中未找到用户 ${normalizedEmail}`);
        }
      } catch (dbError) {
        console.error(`[${requestId}] 数据库访问出错:`, dbError);
      }
      
      // 如果数据库中未找到，尝试使用测试用户
      if (!user && normalizedEmail === "admin@example.com") {
        console.log(`[${requestId}] 使用测试用户`);
        user = TEST_USERS[0];
      }
    } catch (findError) {
      console.error(`[${requestId}] 查找用户时出错:`, findError);
      // 如果是管理员，使用测试账户
      if (normalizedEmail === "admin@example.com") {
        user = TEST_USERS[0];
        console.log(`[${requestId}] 回退到测试用户`);
      }
    }
    
    // 用户不存在
    if (!user) {
      console.warn(`[${requestId}] 用户不存在: ${normalizedEmail}`);
      return NextResponse.json({ 
        success: false, 
        error: "用户不存在",
        requestId
      }, { status: 401 });
    }
    
    // 验证密码
    try {
      // 确保user.password存在且为字符串
      if (!user.password) {
        console.error(`[${requestId}] 用户密码配置错误: ${normalizedEmail}`);
        return NextResponse.json({ 
          success: false, 
          error: "账户配置错误",
          requestId 
        }, { status: 500 });
      }
      
      console.log(`[${requestId}] 开始验证密码`);
      const isPasswordValid = await compare(password, user.password);
      
      if (!isPasswordValid) {
        console.warn(`[${requestId}] 密码错误: ${normalizedEmail}`);
        return NextResponse.json({ 
          success: false, 
          error: "密码错误",
          requestId
        }, { status: 401 });
      }
      
      console.log(`[${requestId}] 密码验证成功`);
    } catch (compareError) {
      console.error(`[${requestId}] 密码比较出错:`, compareError);
      return NextResponse.json({ 
        success: false, 
        error: "认证过程中出现错误",
        requestId
      }, { status: 500 });
    }
    
    // 创建JWT令牌
    const tokenPayload = { 
      id: user.id, 
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24小时有效期
    };
    
    console.log(`[${requestId}] 创建JWT令牌, 用户ID: ${user.id}, 角色: ${user.role}`);
    
    try {
      const token = sign(tokenPayload, SECRET_KEY);
      
      // 设置Cookie
      const cookieStore = cookies();
      cookieStore.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1天
        path: "/",
        sameSite: "lax"
      });
      
      // 添加调试日志
      console.log(`[${requestId}] Cookie设置成功, Cookie名称: auth-token`);
      console.log(`[${requestId}] Cookie安全属性: secure=${process.env.NODE_ENV === "production"}, httpOnly=true, maxAge=86400`);
      
      // 返回成功响应
      console.log(`[${requestId}] 登录成功, 用户: ${user.email}, 角色: ${user.role}`);
      
      return NextResponse.json({
        success: true,
        requestId,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });
    } catch (tokenError) {
      console.error(`[${requestId}] 创建或设置令牌失败:`, tokenError);
      return NextResponse.json({ 
        success: false, 
        error: "认证令牌创建失败",
        requestId
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error(`[${requestId}] 登录处理时出错:`, error);
    return NextResponse.json({ 
      success: false, 
      error: "服务器内部错误",
      requestId,
      message: error instanceof Error ? error.message : "未知错误"
    }, { status: 500 });
  }
} 