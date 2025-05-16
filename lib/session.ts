import { auth } from "./auth";
import { db } from "./db";

/**
 * 获取当前登录用户信息
 */
export async function getCurrentUser() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return null;
    }
    
    const user = await db.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
      },
    });
    
    return user;
  } catch (error) {
    console.error("获取当前用户失败:", error);
    return null;
  }
} 