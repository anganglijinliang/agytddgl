const fs = require('fs');

// 创建.env文件内容
const envContent = `DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMjViZmE4NzUtZTE3Ni00NTdjLThkNjQtNzFmMjI4NTY3ODgxIiwidGVuYW50X2lkIjoiMTI4MDQ1MjNmM2Y2NDcwMzA5YWQ1YTMyMzE0ZGU3OTRkYjAxYTk4YThlZGFlNTU5YTQ3ZDMwODY4NTQyOTk0OCIsImludGVybmFsX3NlY3JldCI6ImE2OWQwNjM1LTY4ZjMtNDBlMy05OTQ1LTIwZmIwZTdlNTk0ZSJ9.a2Hf2jXYvD8VhgmxtiW78lp8z7akO2WU1YhrjGMHWQ8"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"`;

// 确保写入之前文件是空的
fs.writeFileSync('.env', envContent);

console.log('.env文件已创建成功！');
console.log('提示: 我们已经移除了DIRECT_URL配置，现在使用Prisma Accelerate URL应该可以直接工作了'); 