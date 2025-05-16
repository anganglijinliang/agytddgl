// 此脚本用于修复NextAuth JWT加密问题
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

console.log('开始修复NextAuth JWT加密问题...');

// 使用一个固定的密钥确保跨部署的一致性
// 这个密钥必须与vercel-deploy.js中的密钥完全相同
const FIXED_SECRET_KEY = '+P5qXGcf8ZiuXSgs4Wyv4rXHGPGJqiLAFVsgqRwp0wE=';

// 读取当前环境变量
let envPath = path.join(process.cwd(), '.env');
let envContent = '';

try {
  // 检查.env文件是否存在
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('已读取.env文件');
  } else {
    console.log('.env文件不存在，将创建新文件');
    envContent = '';
  }

  // 设置固定的NEXTAUTH_SECRET
  if (envContent.includes('NEXTAUTH_SECRET=')) {
    // 替换现有的密钥
    envContent = envContent.replace(
      /NEXTAUTH_SECRET=.*/,
      `NEXTAUTH_SECRET=${FIXED_SECRET_KEY}`
    );
    console.log('已更新NEXTAUTH_SECRET为固定密钥');
  } else {
    // 添加新的密钥
    envContent += `\nNEXTAUTH_SECRET=${FIXED_SECRET_KEY}\n`;
    console.log('已添加NEXTAUTH_SECRET固定密钥');
  }

  // 确保有NEXTAUTH_URL
  if (!envContent.includes('NEXTAUTH_URL=')) {
    const baseUrl = 'https://agytddgl.vercel.app';
    envContent += `\nNEXTAUTH_URL=${baseUrl}\n`;
    console.log(`已添加NEXTAUTH_URL=${baseUrl}`);
  }

  // 写回.env文件
  fs.writeFileSync(envPath, envContent);
  console.log('成功更新.env文件');

  // 同时更新.env.production文件
  const prodEnvPath = path.join(process.cwd(), '.env.production');
  let prodEnvContent = '';
  
  if (fs.existsSync(prodEnvPath)) {
    prodEnvContent = fs.readFileSync(prodEnvPath, 'utf8');
  }
  
  // 设置相同的固定密钥
  if (prodEnvContent.includes('NEXTAUTH_SECRET=')) {
    prodEnvContent = prodEnvContent.replace(
      /NEXTAUTH_SECRET=.*/,
      `NEXTAUTH_SECRET=${FIXED_SECRET_KEY}`
    );
  } else {
    prodEnvContent += `\nNEXTAUTH_SECRET=${FIXED_SECRET_KEY}\n`;
  }
  
  // 确保有NEXTAUTH_URL
  if (!prodEnvContent.includes('NEXTAUTH_URL=')) {
    const baseUrl = 'https://agytddgl.vercel.app';
    prodEnvContent += `\nNEXTAUTH_URL=${baseUrl}\n`;
  }
  
  fs.writeFileSync(prodEnvPath, prodEnvContent);
  console.log('成功更新.env.production文件');

  // 检查是否在Vercel环境中
  if (process.env.VERCEL) {
    console.log('检测到Vercel环境');
    console.log('警告: 在Vercel部署中运行时，需要在Vercel项目设置中手动设置环境变量');
    console.log(`NEXTAUTH_SECRET=${FIXED_SECRET_KEY}`);
    console.log('NEXTAUTH_URL=https://agytddgl.vercel.app');
  } else {
    console.log('当前在本地环境运行');
    
    // 尝试在本地开启这些环境变量
    process.env.NEXTAUTH_SECRET = FIXED_SECRET_KEY;
    process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    console.log('已设置当前进程环境变量');
    console.log(`NEXTAUTH_SECRET=${FIXED_SECRET_KEY}`);
    console.log(`NEXTAUTH_URL=${process.env.NEXTAUTH_URL}`);
  }

  console.log('\n修复完成!');
  console.log('重要提示:');
  console.log('1. 确保在Vercel项目设置中环境变量已更新为以上值');
  console.log('2. 清除浏览器中所有与next-auth相关的cookie');
  console.log('3. 重新部署应用或重启开发服务器');
} catch (error) {
  console.error('修复NextAuth JWT加密问题时出错:', error);
} 