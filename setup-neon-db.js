// 用于设置Neon数据库的脚本
const fs = require('fs');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// 首先创建环境变量文件
const envContent = `DATABASE_URL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=a-secure-nextauth-secret-key-for-jwt-signing
NEXTAUTH_URL=http://localhost:3000
SKIP_DB_SYNC=false
POSTGRES_URL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech
POSTGRES_PASSWORD=npg_TqiB2gGU3ZyV
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require`;

// 同时创建一个给Vercel使用的生产环境配置
const prodEnvContent = `DATABASE_URL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=a-secure-nextauth-secret-key-for-jwt-signing
NEXTAUTH_URL=https://agytddgl.vercel.app
SKIP_DB_SYNC=false
POSTGRES_URL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL_NON_POOLING=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech
POSTGRES_PASSWORD=npg_TqiB2gGU3ZyV
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require
NODE_ENV=production`;

// 输出环境变量内容进行检查
console.log('DATABASE_URL:', 'postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function main() {
  try {
    // 写入环境变量文件
    fs.writeFileSync('.env', envContent);
    console.log('已创建 .env 文件，包含Neon数据库连接信息');
    fs.writeFileSync('.env.production', prodEnvContent);
    console.log('已创建 .env.production 文件，用于Vercel部署');

    // 输出环境变量文件内容进行验证
    const envFileContent = fs.readFileSync('.env', 'utf8');
    console.log('环境变量文件内容验证 - 开头部分:', envFileContent.substring(0, 50));

    // 执行数据库迁移
    console.log('执行数据库迁移...');
    try {
      // 使用--schema参数明确指定schema文件
      execSync('npx prisma migrate deploy --schema=./prisma/schema.prisma', { stdio: 'inherit' });
      console.log('数据库迁移成功完成');
    } catch (error) {
      console.error('数据库迁移失败，尝试使用db push:', error.message);
      // 明确将环境变量传递给Prisma
      const env = { ...process.env, DATABASE_URL: 'postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' };
      execSync('npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma', { stdio: 'inherit', env });
      console.log('数据库结构已通过db push创建');
    }

    // 创建管理员用户
    console.log('创建测试管理员用户...');
    // 使用明确的数据库URL创建Prisma客户端
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
        },
      },
    });
    
    try {
      // 生成密码哈希
      const password = 'Admin123!';
      console.log('管理员账号: admin@example.com');
      console.log('管理员密码: ' + password);
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建超级管理员用户
      const user = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {
          name: '管理员',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          emailVerified: new Date(),
        },
        create: {
          name: '管理员',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          emailVerified: new Date(),
        },
      });

      console.log('测试用户创建成功:', user.email);
    } catch (error) {
      console.error('创建测试用户时出错:', error);
    } finally {
      await prisma.$disconnect();
    }

    console.log('数据库设置完成！');
  } catch (error) {
    console.error('脚本执行出错:', error);
    process.exit(1);
  }
}

main(); 