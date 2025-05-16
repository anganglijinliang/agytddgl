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
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (error) {
    console.error('无法读取favicon.ico文件:', error);
    
    // 如果无法读取文件，尝试返回一个基本的空图标
    return new NextResponse(Buffer.from([0,0,1,0,1,0,16,16,0,0,1,0,24,0,24,8,0,0,22,0,0,0]), {
      status: 200,
      headers: {
        'Content-Type': 'image/x-icon',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }
}

// 使用静态生成而非强制动态
export const dynamic = 'force-static';

// 设置路由段配置
export const runtime = 'nodejs';

// 使用边缘兼容处理
export const preferredRegion = 'auto'; 