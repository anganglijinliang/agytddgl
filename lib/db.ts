import { PrismaClient, Prisma } from "@prisma/client";

declare global {
  var cachedPrisma: PrismaClient;
}

export let db: PrismaClient;

// 检查是否使用Prisma Accelerate
const isPrismaAccelerate = process.env.DATABASE_URL?.startsWith('prisma+');

// 打印DATABASE_URL信息，但不泄露敏感信息
console.log('数据库连接类型:', isPrismaAccelerate ? 'Prisma Accelerate' : 'Standard PostgreSQL');
console.log('数据库连接URL(部分):', process.env.DATABASE_URL?.substring(0, 10) + '...');

// 配置Prisma客户端选项
const prismaOptions: Prisma.PrismaClientOptions = {
  log: [
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' }
  ],
  errorFormat: 'pretty',
};

if (process.env.NODE_ENV === "production") {
  console.log('生产环境: 创建新的Prisma客户端实例');
  db = new PrismaClient(prismaOptions);
} else {
  console.log('开发环境: 使用缓存的Prisma客户端实例');
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient(prismaOptions);
  }
  db = global.cachedPrisma;
}

// 立即测试数据库连接
db.$connect()
  .then(() => {
    console.log('成功连接到数据库');
    if (isPrismaAccelerate) {
      console.log('成功连接到Prisma Accelerate数据库');
    }
  })
  .catch((e) => {
    console.error('数据库连接失败:');
    console.error(e);
    // 输出有关连接错误的更多信息
    if (e.message?.includes('querying the database')) {
      console.error('请检查您的数据库连接字符串和数据库服务是否正常运行');
    }
    if (isPrismaAccelerate && e.message?.includes('validation')) {
      console.error('Prisma Accelerate连接失败，请检查API密钥是否正确');
    }
  });