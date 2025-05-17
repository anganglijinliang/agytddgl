// 此脚本专门用于修复Vercel中的服务器端异常问题(4179838142)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('开始修复Vercel服务器端异常问题...');

// 使用一个固定的密钥确保跨部署的一致性
const FIXED_SECRET_KEY = '+P5qXGcf8ZiuXSgs4Wyv4rXHGPGJqiLAFVsgqRwp0wE=';
const VERCEL_URL = 'https://agytddgl.vercel.app';

// 创建一个.vercelignore文件，避免上传不必要的文件
try {
  const vercelIgnoreContent = `
# Ignore unnecessary files to reduce bundle size
node_modules
.next
.git
.vercel
.DS_Store
*.log
*.lock
README.md
LICENSE
.env*
!.env.production
`;

  fs.writeFileSync(path.join(process.cwd(), '.vercelignore'), vercelIgnoreContent);
  console.log('已创建 .vercelignore 文件');
} catch (err) {
  console.error('创建 .vercelignore 文件失败:', err);
}

// 修改vercel.json配置，优化NextAuth设置
try {
  let vercelConfig = {};
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  
  // 检查是否已有vercel.json文件
  if (fs.existsSync(vercelJsonPath)) {
    try {
      const content = fs.readFileSync(vercelJsonPath, 'utf8');
      vercelConfig = JSON.parse(content);
      console.log('已读取现有的 vercel.json 文件');
    } catch (parseErr) {
      console.error('解析现有 vercel.json 失败:', parseErr);
      vercelConfig = {};
    }
  }

  // 设置环境变量
  vercelConfig.env = {
    ...(vercelConfig.env || {}),
    NEXTAUTH_SECRET: FIXED_SECRET_KEY,
    NEXTAUTH_URL: VERCEL_URL,
    NODE_ENV: 'production',
    DEBUG: 'true'
  };

  // 添加构建命令
  vercelConfig.buildCommand = 'node scripts/fix-nextauth-jwt.js && next build';
  
  // 设置头信息以解决缓存问题
  vercelConfig.headers = [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0'
        },
        {
          key: 'Pragma',
          value: 'no-cache'
        }
      ]
    },
    {
      source: '/api/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, no-cache, must-revalidate, proxy-revalidate'
        },
        {
          key: 'Pragma',
          value: 'no-cache'
        },
        {
          key: 'Expires',
          value: '0'
        }
      ]
    }
  ];

  // 写回vercel.json
  fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2));
  console.log('已更新 vercel.json 文件');
} catch (err) {
  console.error('更新 vercel.json 失败:', err);
}

// 确保.env.production文件存在且正确
const envProdContent = `DATABASE_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
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

try {
  fs.writeFileSync(path.join(process.cwd(), '.env.production'), envProdContent);
  console.log('已更新 .env.production 文件');
} catch (err) {
  console.error('更新 .env.production 失败:', err);
}

// 执行git提交
try {
  execSync('git add vercel.json .vercelignore .env.production', { stdio: 'inherit' });
  execSync('git commit -m "修复Vercel服务器端异常问题(4179838142)"', { stdio: 'inherit' });
  console.log('已提交修复到Git仓库');
} catch (err) {
  console.error('Git提交失败:', err);
}

console.log('\n修复配置完成!');
console.log('\n下一步操作:');
console.log('1. 登录Vercel控制台，进入项目设置');
console.log('2. 在Environment Variables部分确认以下环境变量:');
console.log(`   NEXTAUTH_SECRET=${FIXED_SECRET_KEY}`);
console.log(`   NEXTAUTH_URL=${VERCEL_URL}`);
console.log('   NODE_ENV=production');
console.log('   DEBUG=true');
console.log('3. 点击"Redeploy"重新部署应用');
console.log('4. 清除浏览器中所有与网站相关的cookie和本地存储');
console.log('5. 如果仍然出现问题，请在无痕模式下尝试访问'); 