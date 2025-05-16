// 重置迁移历史记录脚本
// 用于修复失败的迁移

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function resetMigrations() {
  console.log('开始重置迁移历史记录...');
  
  if (!process.env.DATABASE_URL) {
    console.error('错误: 未设置 DATABASE_URL 环境变量');
    process.exit(1);
  }
  
  console.log('1. 连接数据库...');
  const prisma = new PrismaClient();
  
  try {
    // 先检查_prisma_migrations表是否存在
    console.log('2. 检查迁移表...');
    try {
      const tableExists = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '_prisma_migrations'
        );
      `;
      
      if (!tableExists[0].exists) {
        console.log('迁移表不存在，无需重置');
        return;
      }
    } catch (error) {
      console.error('检查迁移表时出错:', error.message);
      console.log('继续尝试重置...');
    }
    
    // 检查失败的迁移
    console.log('3. 查找失败的迁移...');
    const failedMigrations = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" 
      WHERE applied_steps_count = 0
    `;
    
    if (failedMigrations.length === 0) {
      console.log('未发现失败的迁移记录');
    } else {
      console.log(`发现 ${failedMigrations.length} 条失败的迁移记录:`);
      failedMigrations.forEach(migration => {
        console.log(`- ${migration.migration_name} (开始于: ${migration.started_at})`);
      });
      
      // 删除失败的迁移记录
      console.log('4. 删除失败的迁移记录...');
      for (const migration of failedMigrations) {
        await prisma.$executeRawUnsafe(`
          DELETE FROM "_prisma_migrations" 
          WHERE migration_name = '${migration.migration_name}'
        `);
        console.log(`删除了迁移记录: ${migration.migration_name}`);
      }
    }
    
    // 确保数据库结构与schema一致
    console.log('5. 推送数据库结构...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    
    console.log('6. 重新应用迁移...');
    execSync('npx prisma migrate resolve --applied 20230101000000_init', { stdio: 'inherit' });
    
    console.log('7. 测试迁移...');
    execSync('npx prisma migrate status', { stdio: 'inherit' });
    
    console.log('迁移重置完成！');
  } catch (error) {
    console.error('迁移重置过程中出错:', error);
  } finally {
    // 断开数据库连接
    await prisma.$disconnect();
  }
}

resetMigrations()
  .then(() => console.log('迁移脚本执行完成'))
  .catch(error => console.error('执行迁移脚本时出错:', error)); 