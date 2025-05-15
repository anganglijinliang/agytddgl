import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 动态路由 - 处理favicon.ico请求
export async function GET() {
  try {
    // 获取favicon.ico文件路径
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    
    // 读取文件
    const fileBuffer = await fs.promises.readFile(faviconPath);
    
    // 返回响应，设置正确的Content-Type和缓存
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('无法读取favicon.ico文件:', error);
    return new NextResponse(null, { status: 404 });
  }
}

// 强制服务器端渲染
export const dynamic = 'force-dynamic'; 