// 环境变量检查脚本
console.log('======= 环境变量检查 =======');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('DATABASE_URL 已设置:', !!process.env.DATABASE_URL);
console.log('NEXTAUTH_SECRET 已设置:', !!process.env.NEXTAUTH_SECRET);
console.log('CRON_API_KEY 已设置:', !!process.env.CRON_API_KEY);
console.log('============================');

// 检查必要的环境变量
const missingVars = [];
if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL');
if (!process.env.NEXTAUTH_URL) missingVars.push('NEXTAUTH_URL');
if (!process.env.NEXTAUTH_SECRET) missingVars.push('NEXTAUTH_SECRET');

if (missingVars.length > 0) {
  console.error('警告: 缺少以下必要的环境变量:');
  missingVars.forEach(variable => console.error(`- ${variable}`));
  console.error('请在Vercel设置中添加这些环境变量');
} else {
  console.log('所有必要的环境变量都已设置');
}

// 检查NEXTAUTH_URL格式
if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.includes('${DEPLOY_URL}')) {
  console.error('错误: NEXTAUTH_URL 包含未解析的变量 ${DEPLOY_URL}');
  console.error('请在Vercel设置中检查此环境变量');
}

// 检查DATABASE_URL格式
if (process.env.DATABASE_URL) {
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
} 