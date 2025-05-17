const fs = require('fs');
const path = require('path');

// Neon数据库连接信息
const envContent = `DATABASE_URL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
PGHOST=ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech
PGHOST_UNPOOLED=ep-still-credit-a1jseqhu.ap-southeast-1.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=npg_TqiB2gGU3ZyV
POSTGRES_URL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech
POSTGRES_PASSWORD=npg_TqiB2gGU3ZyV
POSTGRES_DATABASE=neondb
POSTGRES_PRISMA_URL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
NEXTAUTH_SECRET=+P5qXGcf8ZiuXSgs4Wyv4rXHGPGJqiLAFVsgqRwp0wE=
NEXTAUTH_URL=http://localhost:3000
`;

const envLocalPath = path.join(process.cwd(), '.env.local');
const envPath = path.join(process.cwd(), '.env');

// 写入.env.local文件
fs.writeFileSync(envLocalPath, envContent);
console.log('.env.local文件已创建成功！');

// 备份并更新.env文件
if (fs.existsSync(envPath)) {
  const backupPath = path.join(process.cwd(), '.env.backup');
  fs.copyFileSync(envPath, backupPath);
  console.log('已备份原.env文件到.env.backup');
  
  fs.writeFileSync(envPath, envContent);
  console.log('.env文件已更新成功！');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('.env文件已创建成功！');
}

console.log('环境变量已更新完成。请重启应用以应用新的配置。'); 