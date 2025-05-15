// 修复环境变量的脚本
const fs = require('fs');
const path = require('path');

// 创建一个更新的环境文件内容
const envContent = `# 数据库连接
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/angang_orders?schema=public"

# NextAuth配置
NEXTAUTH_SECRET="a-secure-nextauth-secret-key-for-jwt-signing"
NEXTAUTH_URL="http://localhost:3000"

# 应用配置
NODE_ENV="development"
`;

// 写入.env.local文件
const envPath = path.join(process.cwd(), '.env.local');
fs.writeFileSync(envPath, envContent);
console.log(`已创建本地环境文件: ${envPath}`);

// 写入测试用户凭据提示
console.log('\n要使用测试环境，请确保您已设置以下内容:');
console.log('1. 确保您正在运行 PostgreSQL 数据库服务器');
console.log('2. 确保数据库 "angang_orders" 已创建');
console.log('3. 使用以下凭据登录:');
console.log('   - 用户名: admin@example.com');
console.log('   - 密码: Admin123!');
console.log('\n重新启动应用后再尝试登录。'); 