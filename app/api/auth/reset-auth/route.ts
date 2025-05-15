import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// 设置为动态路由，因为使用了cookies()函数
export const dynamic = "force-dynamic";

// 清除所有认证相关Cookie的API
export async function POST() {
  try {
    // 清除NextAuth的Cookie
    cookies().delete("next-auth.session-token");
    cookies().delete("next-auth.csrf-token");
    cookies().delete("next-auth.callback-url");
    
    // 清除自定义认证的Cookie
    cookies().delete("auth-token");
    
    // 记录清除操作
    console.log("已清除所有认证Cookie，时间:", new Date().toISOString());
    
    return NextResponse.json({
      success: true,
      message: "已清除所有认证状态",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("清除认证状态时出错:", error);
    return NextResponse.json({
      success: false,
      error: "清除认证状态时出错",
      message: (error as Error).message
    }, { status: 500 });
  }
} 