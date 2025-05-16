import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // 验证用户登录
    const session = await auth();
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: "未授权" }), {
        status: 401,
      });
    }

    // 获取所有仓库
    const warehouses = await db.warehouse.findMany({
      orderBy: {
        name: "asc"
      }
    });
    
    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error('获取仓库数据失败:', error);
    return new NextResponse(JSON.stringify({ error: '获取仓库数据失败' }), {
      status: 500,
    });
  }
} 