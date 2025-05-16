import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDropdownData } from "@/app/(dashboard)/dashboard/shipping/actions";

export async function GET() {
  try {
    // 验证用户登录
    const session = await auth();
    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: "未授权" }), {
        status: 401,
      });
    }

    // 使用actions中的函数获取下拉数据
    const dropdownData = await getDropdownData();
    
    return NextResponse.json(dropdownData);
  } catch (error) {
    console.error('获取下拉数据失败:', error);
    return new NextResponse(JSON.stringify({ error: '获取下拉数据失败' }), {
      status: 500,
    });
  }
} 