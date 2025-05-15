// 此脚本将在Vercel部署过程中运行

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('开始部署脚本...');

  // 检查环境变量
  console.log('检查环境变量配置...');
  if (!process.env.DATABASE_URL) {
    console.error('错误: 缺少必要的环境变量 DATABASE_URL');
    process.exit(1);
  }
  
  // 验证DATABASE_URL格式
  // 支持标准PostgreSQL URL和Prisma Accelerate URL
  const validPrefixes = ['postgresql://', 'postgres://', 'prisma://'];
  // 支持Prisma Accelerate格式
  const isPrismaAccelerate = process.env.DATABASE_URL.startsWith('prisma+');
  const isStandardPostgres = validPrefixes.some(prefix => process.env.DATABASE_URL.startsWith(prefix));
  
  if (!isStandardPostgres && !isPrismaAccelerate) {
    console.error('错误: DATABASE_URL 格式不正确');
    console.error('DATABASE_URL 必须以 postgresql://, postgres:// 或 prisma+ 开头');
    console.error('当前值开头(10个字符):', process.env.DATABASE_URL.substring(0, 10) + '...');
    process.exit(1);
  } else {
    console.log('DATABASE_URL 格式正确');
    if (isPrismaAccelerate) {
      console.log('检测到Prisma Accelerate连接字符串');
    }
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('错误: 缺少必要的环境变量 NEXTAUTH_SECRET');
    process.exit(1);
  }
  
  if (!process.env.NEXTAUTH_URL) {
    console.error('警告: 缺少 NEXTAUTH_URL, 将使用默认值');
  } else {
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  }

  try {
    // 检查是否跳过数据库同步
    if (process.env.SKIP_DB_SYNC === 'true') {
      console.log('检测到SKIP_DB_SYNC=true，跳过数据库同步步骤...');
    } else {
      // 1. 运行数据库迁移
      console.log('执行数据库同步...');
      try {
        console.log('数据库连接类型:', isStandardPostgres ? 'Standard PostgreSQL' : 'Prisma Accelerate');
        console.log('数据库连接URL(部分):', process.env.DATABASE_URL.substring(0, 15) + '...');
        
        // 使用Prisma migrate deploy来应用迁移，这更适合生产环境
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
        console.log('数据库迁移已成功应用');
      } catch (error) {
        console.error('数据库迁移失败，尝试使用db push:', error.message);
        try {
          // 如果migrate deploy失败，尝试使用db push
          execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
          console.log('数据库结构已通过db push创建');
        } catch (pushError) {
          console.error('数据库同步失败:', pushError.message);
          // 记录错误但继续部署，避免部署失败
          console.log('继续部署过程，但可能需要手动设置数据库...');
        }
      }
    }
    
    // 2. 创建测试用户
    console.log('创建测试管理员用户...');
    const prisma = new PrismaClient();
    
    try {
      // 生成密码哈希
      const password = 'Admin123!';
      console.log('测试账号密码:', password);
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('密码哈希生成成功');

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
      
      // 验证用户是否正确创建
      const createdUser = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
        select: { id: true, email: true, role: true }
      });
      
      if (createdUser) {
        console.log('验证用户创建成功:', createdUser);
      } else {
        console.error('警告: 无法验证用户是否创建成功');
      }
    } catch (error) {
      console.error('创建测试用户时出错:', error);
      // 不抛出错误，让部署继续
      console.log('继续部署过程...');
    } finally {
      await prisma.$disconnect();
    }

    console.log('部署脚本执行完成');
  } catch (error) {
    console.error('部署脚本执行错误:', error);
    // 不退出进程，让部署继续
    console.log('尽管有错误，继续部署过程...');
  }
}

main(); 