import { NextRequest, NextResponse } from "next/server";

// 设置为动态路由
export const dynamic = "force-dynamic";

// 处理POST请求
export async function POST(request: NextRequest) {
  try {
    // 获取日志数据
    const body = await request.json();
    
    // 简单记录到服务端控制台
    console.log("[Auth Log]", JSON.stringify(body));
    
    // 返回成功响应
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("处理认证日志时出错:", error);
    return NextResponse.json(
      { success: false, error: "日志处理错误" },
      { status: 500 }
    );
  }
}

// 处理GET请求
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for logging." },
    { status: 405 }
  );
}

// 处理PUT请求
export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for logging." },
    { status: 405 }
  );
}

// 处理DELETE请求
export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for logging." },
    { status: 405 }
  );
} 