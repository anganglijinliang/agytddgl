const fs = require('fs');
const path = require('path');

console.log('开始修复Vercel部署配置...');

// 更新vercel.json
const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
let vercelJson;

try {
  if (fs.existsSync(vercelJsonPath)) {
    vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  } else {
    vercelJson = {};
  }

  // 设置基础配置
  vercelJson.name = "angang-order-management-system";
  vercelJson.version = 2;
  
  // 设置构建配置
  vercelJson.builds = [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "buildCommand": "npm run vercel-build",
        "outputDirectory": ".next"
      }
    }
  ];
  
  // 设置环境变量
  vercelJson.env = {
    "NEXTAUTH_URL": "https://agytddgl-pypwpxpnp-anganglijinliang-s-team.vercel.app",
    "DATABASE_URL": "postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
    "NEXTAUTH_SECRET": "+P5qXGcf8ZiuXSgs4Wyv4rXHGPGJqiLAFVsgqRwp0wE=",
    "NODE_ENV": "production",
    "SKIP_DB_SYNC": "false",
    "POSTGRES_URL": "postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
    "POSTGRES_URL_NON_POOLING": "postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
    "POSTGRES_USER": "neondb_owner",
    "POSTGRES_HOST": "ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech",
    "POSTGRES_PASSWORD": "npg_TqiB2gGU3ZyV",
    "POSTGRES_DATABASE": "neondb",
    "POSTGRES_PRISMA_URL": "postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require",
    "DEBUG": "true"
  };
  
  // 设置Header策略，防止缓存问题
  vercelJson.headers = [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, max-age=0"
        },
        {
          "key": "Pragma",
          "value": "no-cache"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, no-cache, must-revalidate, proxy-revalidate"
        },
        {
          "key": "Pragma",
          "value": "no-cache"
        },
        {
          "key": "Expires",
          "value": "0"
        }
      ]
    }
  ];
  
  // 设置构建命令
  vercelJson.buildCommand = "node scripts/fix-nextauth-jwt.js && next build";
  
  // 写入更新后的vercel.json
  fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJson, null, 2));
  console.log('✅ vercel.json更新成功');
} catch (error) {
  console.error('❌ 更新vercel.json时出错:', error);
}

// 创建或更新.vercelignore
try {
  const vercelIgnorePath = path.join(process.cwd(), '.vercelignore');
  const vercelIgnoreContent = `# 本地开发文件
.env.local
.env.development
.env.development.local
.env.test
.env.test.local
node_modules
npm-debug.log
yarn-debug.log
yarn-error.log
.DS_Store
.next/cache
`;

  fs.writeFileSync(vercelIgnorePath, vercelIgnoreContent);
  console.log('✅ .vercelignore更新成功');
} catch (error) {
  console.error('❌ 更新.vercelignore时出错:', error);
}

console.log('\n配置修复完成!');
console.log('请按照以下步骤进行部署:');
console.log('1. 确保您的Vercel账户已连接到代码仓库');
console.log('2. 使用以下命令部署到Vercel:');
console.log('   vercel --prod');
console.log('或者在Vercel控制台中手动部署。');
console.log('\n对于之前的部署，请进入Vercel控制台:');
console.log('1. 进入项目设置 > Environment Variables');
console.log('2. 确保所有环境变量已正确设置');
console.log('3. 重新部署应用');
console.log('4. 清除浏览器中与应用相关的所有Cookie'); 