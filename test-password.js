const bcrypt = require('bcryptjs');

// 测试密码
const passwordToTest = 'Admin123!';
const existingHash = '$2a$10$JYQqPdHVnLoQhS5JiWHNrOeBiSdZrQnqcVPE80WL4JbI3q3JvnX96';

async function testPassword() {
  console.log('测试密码哈希...');
  
  // 测试已存在的哈希是否匹配
  const isMatch = await bcrypt.compare(passwordToTest, existingHash);
  console.log(`密码 '${passwordToTest}' 与哈希 '${existingHash}' 匹配: ${isMatch}`);
  
  // 创建新的哈希
  const newHash = await bcrypt.hash(passwordToTest, 10);
  console.log(`密码 '${passwordToTest}' 的新哈希: ${newHash}`);
  
  // 验证新哈希
  const newHashMatch = await bcrypt.compare(passwordToTest, newHash);
  console.log(`密码 '${passwordToTest}' 与新哈希匹配: ${newHashMatch}`);
}

testPassword().catch(console.error); 