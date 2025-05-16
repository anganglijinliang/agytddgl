// 此脚本用于清理NextAuth会话表

const { PrismaClient } = require('@prisma/client');

async function clearSessions() {
  console.log('开始清理NextAuth会话数据...');
  
  const prisma = new PrismaClient();
  
  try {
    // 清理Session表
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`已删除 ${deletedSessions.count} 个会话记录`);
    
    // 清理Account表 (可选)
    // 注意：删除Account会断开用户与第三方登录的连接
    // const deletedAccounts = await prisma.account.deleteMany({});
    // console.log(`已删除 ${deletedAccounts.count} 个账号关联记录`);
    
    console.log('会话清理完成');
  } catch (error) {
    console.error('清理会话时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSessions(); 