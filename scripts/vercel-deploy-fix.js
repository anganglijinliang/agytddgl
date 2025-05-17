// 此脚本用于修复Vercel部署中的NextAuth和环境变量问题
const fs = require('fs');
const path = require('path');

console.log('开始修复Vercel部署问题...');

// 使用一个固定的密钥确保跨部署的一致性
const FIXED_SECRET_KEY = '+P5qXGcf8ZiuXSgs4Wyv4rXHGPGJqiLAFVsgqRwp0wE=';
const VERCEL_URL = 'https://agytddgl.vercel.app';

// 创建包含修复内容的环境变量文件
const envContent = `DATABASE_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
NEXTAUTH_SECRET=${FIXED_SECRET_KEY}
NEXTAUTH_URL=${VERCEL_URL}
SKIP_DB_SYNC=true
POSTGRES_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
SUPABASE_URL=https://mrvvwmqtyeoasbmlxtpw.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://mrvvwmqtyeoasbmlxtpw.supabase.co
POSTGRES_URL_NON_POOLING=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
SUPABASE_JWT_SECRET=2Zld6JaS84KjdEwH+4DX+b7BryMAK1eO1ZT5qdtp95znhTMlDaappVQ6Nbh/dHrxwKINaxt1ZFyjgA4/tS5VQA==
POSTGRES_USER=postgres
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydnZ3bXF0eWVvYXNibWx4dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNzY1ODksImV4cCI6MjA2Mjg1MjU4OX0.nf9dJSsbhr-lq_CpiyjfRIRkJ_61xUqLVJle15KRFLQ
POSTGRES_PASSWORD=Ml05ZmoiEXfna4y6
POSTGRES_DATABASE=postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydnZ3bXF0eWVvYXNibWx4dHB3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI3NjU4OSwiZXhwIjoyMDYyODUyNTg5fQ.P8DVc2_JnGHOXwMpEBbjoC4ypp4pcHFBJmxG9WSKJIU
POSTGRES_HOST=db.mrvvwmqtyeoasbmlxtpw.supabase.co
NODE_ENV=production
DEBUG=true
NEXT_DEBUG=true
NEXT_PUBLIC_DEBUG=true`;

// 写入.env.production文件
try {
  fs.writeFileSync(path.join(process.cwd(), '.env.production'), envContent);
  console.log('已更新 .env.production 文件');

  // 也写入.env文件以便本地开发使用
  const localEnvContent = envContent.replace(VERCEL_URL, 'http://localhost:3000');
  fs.writeFileSync(path.join(process.cwd(), '.env'), localEnvContent);
  console.log('已更新本地 .env 文件');

  // 创建vercel.env文件
  fs.writeFileSync(path.join(process.cwd(), 'vercel.env'), envContent);
  console.log('已创建 vercel.env 文件');

  // 在Vercel中设置环境变量的说明
  console.log('\n重要: 在Vercel项目设置中配置以下环境变量:');
  console.log(`NEXTAUTH_SECRET=${FIXED_SECRET_KEY}`);
  console.log(`NEXTAUTH_URL=${VERCEL_URL}`);
  console.log('NODE_ENV=production');
  console.log('DEBUG=true');

  // 添加调试信息
  console.log('\n为解决服务器端异常(Application error: 4179838142)，请执行以下操作:');
  console.log('1. 确保已设置正确的环境变量');
  console.log('2. 进入Vercel项目设置，点击"Redeploy"');
  console.log('3. 清除浏览器cookie和本地存储');
  console.log('4. 尝试使用无痕模式访问网站');
  console.log('5. 如果依然出错，查看Vercel部署日志以获得更多信息');
} catch (error) {
  console.error('执行过程中出错:', error);
} 