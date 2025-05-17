const fs = require('fs');
const path = require('path');

console.log('开始修复NextAuth JWT问题...');

// 固定的安全密钥
const FIXED_SECRET_KEY = '+P5qXGcf8ZiuXSgs4Wyv4rXHGPGJqiLAFVsgqRwp0wE=';

// 读取.env.local文件
const envLocalPath = path.join(process.cwd(), '.env.local');
let envContent = '';

if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf8');
  console.log('已读取.env.local文件');
} else {
  console.log('.env.local文件不存在，将使用之前创建的文件');
}

// 确保NEXTAUTH_SECRET设置正确
if (envContent.includes('NEXTAUTH_SECRET=')) {
  envContent = envContent.replace(
    /NEXTAUTH_SECRET=.*/,
    `NEXTAUTH_SECRET=${FIXED_SECRET_KEY}`
  );
  console.log('已更新NEXTAUTH_SECRET为固定密钥');
} else {
  envContent += `\nNEXTAUTH_SECRET=${FIXED_SECRET_KEY}\n`;
  console.log('已添加NEXTAUTH_SECRET固定密钥');
}

// 保存更新后的.env.local文件
fs.writeFileSync(envLocalPath, envContent);
console.log('.env.local文件已更新');

// 更新vercel.json中的环境变量
try {
  const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
  if (fs.existsSync(vercelJsonPath)) {
    let vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    // 更新环境变量
    if (!vercelJson.env) {
      vercelJson.env = {};
    }
    
    vercelJson.env.NEXTAUTH_SECRET = FIXED_SECRET_KEY;
    vercelJson.env.NEXTAUTH_URL = 'https://agytddgl-pypwpxpnp-anganglijinliang-s-team.vercel.app';
    vercelJson.env.DATABASE_URL = 'postgres://neondb_owner:npg_TqiB2gGU3ZyV@ep-still-credit-a1jseqhu-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
    
    // 保存更新后的vercel.json
    fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJson, null, 2));
    console.log('vercel.json文件已更新');
  }
} catch (error) {
  console.error('更新vercel.json时出错:', error);
}

console.log('\n修复完成!');
console.log('重要提示:');
console.log('1. 请重启开发服务器以应用新的设置');
console.log('2. 清除浏览器中的所有Cookie和缓存');
console.log('3. 对于生产环境，请在Vercel控制台中更新环境变量'); 