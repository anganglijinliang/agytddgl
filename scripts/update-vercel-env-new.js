// 此脚本用于更新Vercel环境变量
const fs = require('fs');
const path = require('path');

// 创建包含正确URL的环境变量文件
const envContent = `DATABASE_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
NEXTAUTH_SECRET=+P5qXGcf8ZiuXSgs4Wyv4rXHGPGJqiLAFVsgqRwp0wE=
NEXTAUTH_URL=https://agytddgl.vercel.app
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
NODE_ENV=production`;

// 写入.env.vercel文件
fs.writeFileSync(path.join(process.cwd(), '.env.vercel.new'), envContent);
console.log('已创建 .env.vercel.new 文件，包含更新的Vercel环境变量');

// 更新.env.production文件
fs.writeFileSync(path.join(process.cwd(), '.env.production'), envContent);
console.log('已更新 .env.production 文件');

// 输出关键信息供用户设置
console.log('\n在Vercel中设置以下关键环境变量:');
console.log('NEXTAUTH_SECRET=+P5qXGcf8ZiuXSgs4Wyv4rXHGPGJqiLAFVsgqRwp0wE=');
console.log('NEXTAUTH_URL=https://agytddgl.vercel.app');

console.log('\n操作步骤:');
console.log('1. 登录Vercel控制台');
console.log('2. 进入您的项目设置');
console.log('3. 在Environment Variables部分，添加或更新上述变量');
console.log('4. 重新部署应用');
console.log('5. 清除浏览器中与nextauth相关的所有cookie和本地存储'); 
 