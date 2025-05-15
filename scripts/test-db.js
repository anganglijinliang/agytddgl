// 简单的数据库连接测试脚本
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('正在测试数据库连接...');
  
  try {
    // 获取环境变量
    console.log('环境变量:');
    console.log('- NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '已设置' : '未设置');
    console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- DATABASE_URL:', process.env.DATABASE_URL ? `已设置 (${process.env.DATABASE_URL.substring(0, 20)}...)` : '未设置');
    
    // 创建Prisma客户端
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    console.log('正在连接到数据库...');
    
    // 测试连接
    await prisma.$connect();
    console.log('数据库连接成功!');
    
    // 查询用户表
    console.log('尝试查询用户表...');
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    });
    
    console.log(`找到 ${users.length} 个用户:`);
    console.log(JSON.stringify(users, null, 2));
    
    // 关闭连接
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('数据库连接测试失败:', error);
  }
}

// 执行测试
testDatabaseConnection(); 