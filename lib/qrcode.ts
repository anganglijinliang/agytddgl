import QRCode from 'qrcode';

/**
 * 生成订单查询二维码的数据URL
 * @param orderId 订单ID
 * @param baseUrl 基础URL，默认为当前环境的NEXTAUTH_URL
 * @returns 返回包含二维码的数据URL
 */
export async function generateOrderQrCode(
  orderId: string,
  baseUrl: string = process.env.NEXTAUTH_URL || "https://agytddgl.vercel.app"
): Promise<string> {
  try {
    // 构建完整的URL，将引导到订单查询页面
    const url = `${baseUrl}/customer/order/${orderId}`;
    
    // 生成QR码为数据URL
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H' // 高容错率
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('生成订单二维码失败:', error);
    throw new Error('生成二维码失败');
  }
}

/**
 * 生成短链接URL
 * 注意：实际项目中应当集成第三方短链接服务，这里仅做示例
 * @param orderId 订单ID
 * @returns 返回短链接代码
 */
export function generateShortCode(orderId: string): string {
  // 简单实现：从订单ID生成6位字母数字代码
  // 实际生产中应使用专业短链接服务
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const codeLength = 6;
  let shortCode = '';
  
  // 使用订单ID的部分字符作为种子
  const seed = orderId.substring(0, 8);
  
  for (let i = 0; i < codeLength; i++) {
    // 简单的哈希算法，仅作演示
    const charIndex = (seed.charCodeAt(i % seed.length) + i) % characters.length;
    shortCode += characters.charAt(charIndex);
  }
  
  return shortCode;
} 