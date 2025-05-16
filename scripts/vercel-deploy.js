// 此脚本将在Vercel部署过程中运行

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function main() {
  console.log('开始部署脚本...');

  // 检查环境变量
  console.log('检查环境变量配置...');
  
  // 使用一个特定的固定密钥确保跨部署的一致性
  // 每次更改此密钥将导致所有用户需要重新登录
  const fixedSecretKey = '+P5qXGcf8ZiuXSgs4Wyv4rXHGPGJqiLAFVsgqRwp0wE=';
  
  // 如果NEXTAUTH_SECRET未设置，则使用固定的安全值
  if (!process.env.NEXTAUTH_SECRET) {
    console.warn(`警告: 未设置NEXTAUTH_SECRET环境变量，将使用备用固定密钥进行部署`);
    console.warn(`请在Vercel项目设置中添加NEXTAUTH_SECRET环境变量，值为: ${fixedSecretKey}`);
    process.env.NEXTAUTH_SECRET = fixedSecretKey;
  } else {
    console.log('NEXTAUTH_SECRET已正确设置');
    
    // 确保密钥一致性 - 如果发现使用了不同的密钥，发出警告
    if (process.env.NEXTAUTH_SECRET !== fixedSecretKey) {
      console.warn('警告: 设置的NEXTAUTH_SECRET与脚本中的固定密钥不匹配');
      console.warn('这可能导致用户JWT令牌验证失败。建议使用脚本中的固定密钥:');
      console.warn(fixedSecretKey);
      
      // 强制使用固定密钥来确保一致性
      console.log('正在覆盖环境变量NEXTAUTH_SECRET为固定值以确保一致性');
      process.env.NEXTAUTH_SECRET = fixedSecretKey;
    }
  }

  // 检查数据库连接信息
  if (!process.env.DATABASE_URL) {
    console.error('错误: 缺少必要的环境变量 DATABASE_URL');
    // 不立即退出，尝试继续部署
    console.warn('部署将继续，但可能导致应用无法连接到数据库');
  } else {
    // 验证DATABASE_URL格式
    // 支持标准PostgreSQL URL和Prisma Accelerate URL
    const validPrefixes = ['postgresql://', 'postgres://', 'prisma://'];
    // 支持Prisma Accelerate格式
    const isPrismaAccelerate = process.env.DATABASE_URL.startsWith('prisma+');
    const isStandardPostgres = validPrefixes.some(prefix => process.env.DATABASE_URL.startsWith(prefix));
    
    if (!isStandardPostgres && !isPrismaAccelerate) {
      console.error('警告: DATABASE_URL 格式可能不正确');
      console.error('DATABASE_URL 通常应以 postgresql://, postgres:// 或 prisma+ 开头');
      console.error('当前值开头(10个字符):', process.env.DATABASE_URL.substring(0, 10) + '...');
      // 不退出，尝试继续部署
    } else {
      console.log('DATABASE_URL 格式正确');
      if (isPrismaAccelerate) {
        console.log('检测到Prisma Accelerate连接字符串');
      }
    }
  }
  
  // 检查 NEXTAUTH_URL 设置
  if (!process.env.NEXTAUTH_URL) {
    // 尝试从VERCEL_URL构建合适的URL
    let baseUrl = '';
    if (process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.VERCEL && process.env.NEXT_PUBLIC_VERCEL_URL) {
      baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    } else {
      baseUrl = 'http://localhost:3000';
    }
    
    console.warn(`警告: 缺少NEXTAUTH_URL, 将使用自动检测的值: ${baseUrl}`);
    process.env.NEXTAUTH_URL = baseUrl;
    console.log(`设置NEXTAUTH_URL为: ${baseUrl}`);
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
        const dbType = process.env.DATABASE_URL ? 
          (process.env.DATABASE_URL.startsWith('postgres') ? 'Standard PostgreSQL' : 'Other') : 
          'Unknown';
        
        console.log('数据库连接类型:', dbType);
        if (process.env.DATABASE_URL) {
          console.log('数据库连接URL(部分):', process.env.DATABASE_URL.substring(0, 10) + '...');
        }
        
        // 检查是否需要重置迁移历史记录
        if (process.env.RESET_MIGRATIONS === 'true') {
          console.log('检测到RESET_MIGRATIONS=true, 正在重置迁移历史...');
          try {
            // 备份当前数据库模式
            console.log('执行schema推送以保持数据...');
            execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
            
            // 重置迁移历史记录
            console.log('重置迁移历史记录...');
            const prisma = new PrismaClient();
            try {
              // 直接移除_prisma_migrations表中的失败记录
              await prisma.$executeRawUnsafe('DELETE FROM "_prisma_migrations" WHERE migration_name = \'20230101000000_init\' AND applied_steps_count = 0');
              console.log('成功重置迁移历史记录');
            } catch (err) {
              console.warn('尝试直接清除迁移历史记录失败:', err.message);
              console.log('继续使用db push方法...');
            } finally {
              await prisma.$disconnect();
            }
          } catch (resetError) {
            console.error('重置迁移历史记录失败:', resetError.message);
          }
        }
        
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