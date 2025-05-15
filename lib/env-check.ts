// 此函数用于验证必需的环境变量是否都已设置
export function checkRequiredEnvVars() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];
  
  const missingEnvVars = requiredEnvVars.filter(
    envVar => !process.env[envVar]
  );
  
  if (missingEnvVars.length > 0) {
    console.error(`缺少必需的环境变量: ${missingEnvVars.join(', ')}`);
    console.error('请确保在环境中或.env文件中设置这些变量');
    
    if (process.env.NODE_ENV === 'production') {
      console.error('在生产环境中，请在Vercel中配置这些环境变量');
    }
    
    return false;
  }
  
  return true;
} 