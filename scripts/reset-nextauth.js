// 此脚本用于清理和重置NextAuth会话
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');
const path = require('path');

console.log('开始重置NextAuth会话配置...');

// 生成新的密钥
const generateNewSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// 准备新的环境变量值
const newSecret = generateNewSecret();
console.log(`生成新的NEXTAUTH_SECRET: ${newSecret}`);

// 更新Vercel环境变量(如果是在Vercel环境中)
try {
  if (process.env.VERCEL) {
    console.log('检测到Vercel环境，尝试更新项目环境变量...');
    console.log('请手动在Vercel管理界面设置NEXTAUTH_SECRET为以下值:');
    console.log(newSecret);
  } else {
    // 本地环境，更新.env文件
    console.log('在本地环境更新.env文件...');
    
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    try {
      // 尝试读取现有的.env文件
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
        
        // 替换NEXTAUTH_SECRET的值
        if (envContent.includes('NEXTAUTH_SECRET=')) {
          envContent = envContent.replace(
            /NEXTAUTH_SECRET=.*/,
            `NEXTAUTH_SECRET=${newSecret}`
          );
          console.log('已替换NEXTAUTH_SECRET值');
        } else {
          // 如果不存在，则添加
          envContent += `\nNEXTAUTH_SECRET=${newSecret}\n`;
          console.log('已添加NEXTAUTH_SECRET值');
        }
      } else {
        // 如果.env文件不存在，创建新的
        envContent = `NEXTAUTH_SECRET=${newSecret}\n`;
        console.log('已创建新的.env文件');
      }
      
      // 写回.env文件
      fs.writeFileSync(envPath, envContent);
      console.log('成功更新.env文件');
      
      // 同时更新.env.local (如果存在)
      const envLocalPath = path.join(process.cwd(), '.env.local');
      if (fs.existsSync(envLocalPath)) {
        let envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
        
        if (envLocalContent.includes('NEXTAUTH_SECRET=')) {
          envLocalContent = envLocalContent.replace(
            /NEXTAUTH_SECRET=.*/,
            `NEXTAUTH_SECRET=${newSecret}`
          );
        } else {
          envLocalContent += `\nNEXTAUTH_SECRET=${newSecret}\n`;
        }
        
        fs.writeFileSync(envLocalPath, envLocalContent);
        console.log('成功更新.env.local文件');
      }
    } catch (error) {
      console.error('更新环境变量文件时出错:', error);
    }
  }
  
  // 提示用户清理浏览器cookie
  console.log('\n重要提示: 请完成以下步骤来彻底重置NextAuth会话:');
  console.log('1. 确保环境变量已更新 (在Vercel上手动更新，或本地文件已更新)');
  console.log('2. 清理所有浏览器cookie (尤其是next-auth相关的cookie)');
  console.log('3. 重新部署应用或重启开发服务器');
  
} catch (error) {
  console.error('重置NextAuth会话时出错:', error);
} 