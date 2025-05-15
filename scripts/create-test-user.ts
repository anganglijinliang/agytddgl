import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // 生成密码哈希
    const hashedPassword = await hash('Admin123!', 10);

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

    console.log('测试用户创建成功:', user);
  } catch (error) {
    console.error('创建测试用户时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 