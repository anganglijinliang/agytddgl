const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('正在验证数据库连接...');
  
  // 显示环境变量（不显示完整值以保护敏感信息）
  console.log('环境变量检查:');
  console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? '已设置 (' + process.env.DATABASE_URL.substring(0, 20) + '...)' : '未设置'}`);
  console.log(`- NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '已设置' : '未设置'}`);
  console.log(`- NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '未设置'}`);
  
  try {
    // 创建Prisma客户端
    const prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    
    console.log('尝试连接到数据库...');
    
    // 测试连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功!');
    
    // 尝试获取用户数量
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ 用户表访问成功，共有 ${userCount} 个用户`);
      
      if (userCount === 0) {
        console.log('⚠️ 警告: 用户表为空，可能需要初始化数据');
      }
    } catch (error) {
      console.error('❌ 用户表访问失败:', error);
    }
    
    // 关闭连接
    await prisma.$disconnect();
    console.log('数据库连接已关闭');
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    
    // 提供更具体的错误诊断
    if (error.message?.includes('connection') || error.message?.includes('connect')) {
      console.error('可能是网络连接问题或数据库服务器不可用');
    }
    if (error.message?.includes('authentication')) {
      console.error('可能是数据库凭据（用户名/密码）错误');
    }
    if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
      console.error('可能是数据库或用户不存在');
    }
    if (error.message?.includes('SSL')) {
      console.error('可能是SSL连接问题，尝试更改sslmode参数');
    }
    
    return false;
  }
}

// 执行测试
testDatabaseConnection(); 