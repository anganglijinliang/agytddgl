import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();
  
  // 创建安全的环境变量对象，仅显示非敏感信息
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : 0,
    DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 10) + '...' : null,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
  };
  
  // 安全的会话对象，不包含敏感数据
  const safeSession = session ? {
    user: session.user ? {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      // 不包含image避免过长响应
    } : null,
    expires: session.expires,
  } : null;
  
  const requestInfo = {
    headers: {
      cookie: req.headers.get('cookie') ? '已存在' : '不存在',
      host: req.headers.get('host'),
      referer: req.headers.get('referer'),
      userAgent: req.headers.get('user-agent')?.substring(0, 50) + '...',
    }
  };
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: safeEnv,
    session: safeSession,
    request: requestInfo,
  });
} 