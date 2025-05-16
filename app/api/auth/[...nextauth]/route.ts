import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AuthOptions } from "next-auth";
import { UserRole } from "@prisma/client";
import { JWT } from "next-auth/jwt";

// 设置为强制动态路由，确保NextAuth可以工作
export const dynamic = "force-dynamic";

// 日志环境变量值，帮助调试
console.log('NextAuth初始化：');
console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- BASE_URL:', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.NEXTAUTH_URL);
console.log('- NEXTAUTH_SECRET长度:', process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : 0);
console.log('- 是否设置DATABASE_URL:', !!process.env.DATABASE_URL);

// 确保有基础URL，如果NEXTAUTH_URL未设置则使用VERCEL_URL
const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.NEXTAUTH_URL || 'http://localhost:3000';

// 测试用户，在数据库连接失败时使用
const TEST_USERS = [
  {
    id: "test-admin-1",
    name: "管理员",
    email: "admin@example.com",
    password: "$2a$10$nKLESvUKFNCcqduxs8qCFOx6JWuaQLoLatOk22qcqZ0Tgp50zkaRW", // 'Admin123!'
    role: UserRole.ADMIN,
    image: null,
  }
];

// 固定的安全密钥，当环境变量未设置时使用
const FALLBACK_SECRET_KEY = "a-secure-nextauth-secret-key-for-jwt-signing-must-be-at-least-32-chars";

// 处理JWT错误日志记录的辅助函数
const logJwtError = (error: Error, stage: string) => {
  console.error(`[NextAuth][JWT][${stage}] JWT错误:`, {
    name: error.name,
    message: error.message,
    stack: error.stack?.split('\n').slice(0, 3).join('\n') || '无堆栈信息'
  });
};

// 认证选项配置
const authOptions: AuthOptions = {
  // 在开发环境关闭Prisma适配器，避免数据库连接问题
  ...(process.env.NODE_ENV !== "development" && {
    adapter: PrismaAdapter(db) as any,
  }),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
        const timestamp = new Date().toISOString();
        
        try {
          console.log(`[${requestId}][${timestamp}] 开始处理NextAuth认证请求`, { email: credentials?.email });

          if (!credentials?.email || !credentials?.password) {
            console.error(`[${requestId}] 认证失败: 缺少凭据`);
            return null;
          }

          const email = credentials.email.toLowerCase().trim();
          const inputPassword = credentials.password;
          
          console.log(`[${requestId}] 尝试认证用户: ${email}，密码长度: ${inputPassword.length}`);
          
          let user;
          let dbConnected = false;
          
          // 尝试获取用户信息
          try {
            // 根据环境选择不同的认证方式
            if (process.env.NODE_ENV === "development") {
              // 开发环境使用测试账户
              user = TEST_USERS.find(u => u.email === email);
              console.log(`[${requestId}] 开发环境使用测试账户`);
            } else {
              // 生产环境使用数据库，但如果失败则回退到测试账户
              try {
                // 测试数据库连接
                await db.$queryRaw`SELECT 1`;
                console.log(`[${requestId}] 数据库连接成功`);
                dbConnected = true;
                
                user = await db.user.findUnique({
                  where: { email },
                });
                
                if (user) {
                  console.log(`[${requestId}] 在数据库中找到用户 ${email}`);
                } else {
                  console.log(`[${requestId}] 在数据库中未找到用户 ${email}`);
                  
                  // 如果是管理员邮箱但在数据库中未找到，使用测试账户
                  if (email === "admin@example.com") {
                    console.log(`[${requestId}] 在数据库中未找到admin@example.com，使用测试账户`);
                    user = TEST_USERS[0];
                  }
                }
              } catch (dbError) {
                console.error(`[${requestId}] 数据库连接失败:`, dbError);
                // 数据库连接失败时使用测试账户
                if (email === "admin@example.com") {
                  user = TEST_USERS[0];
                  console.log(`[${requestId}] 数据库连接失败，回退到测试账户`);
                }
              }
            }
          } catch (findError) {
            console.error(`[${requestId}] 查找用户失败:`, findError);
            if (email === "admin@example.com") {
              user = TEST_USERS[0];
              console.log(`[${requestId}] 用户查询出错，回退到测试账户`);
            }
          }

          if (!user || !user.password) {
            console.error(`[${requestId}] 认证失败: 用户不存在 ${email}`);
            return null;
          }

          // 验证密码
          try {
            console.log(`[${requestId}] 验证密码中...`);
            const isPasswordValid = await compare(
              inputPassword,
              user.password
            );

            if (!isPasswordValid) {
              console.error(`[${requestId}] 认证失败: 密码错误 ${email}`);
              return null;
            }
            console.log(`[${requestId}] 密码验证成功`);
          } catch (compareError) {
            console.error(`[${requestId}] 密码比较失败:`, compareError);
            return null;
          }

          console.log(`[${requestId}] 认证成功: ${email}, 角色: ${user.role}`);
          
          // 返回用户信息（不包含密码）
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error(`[${requestId}] 认证过程出现异常:`, error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1天
  },
  secret: process.env.NEXTAUTH_SECRET || FALLBACK_SECRET_KEY,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  debug: process.env.NODE_ENV === "development",
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      try {
        if (user) {
          token.id = user.id;
          token.role = user.role;
          console.log("JWT token设置成功:", { id: user.id, role: user.role });
        }
        
        // 处理会话更新
        if (trigger === "update" && session) {
          if (session.user?.role) {
            token.role = session.user.role;
          }
          console.log("JWT token通过update事件更新:", token);
        }
      } catch (error) {
        if (error instanceof Error) {
          logJwtError(error, "jwt_callback");
        } else {
          console.error("JWT回调未知错误类型:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user && token) {
          session.user.id = token.id as string;
          session.user.role = token.role as UserRole;
          console.log("Session回调设置成功");
        }
      } catch (error) {
        if (error instanceof Error) {
          logJwtError(error, "session_callback");
        } else {
          console.error("Session回调未知错误类型:", error);
        }
      }
      return session;
    },
  },
  // 显式设置cookie选项，解决部分环境的问题
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // 不设置domain，让浏览器自动处理
      },
    },
  },
  // 添加JWT自定义选项以增强安全性和兼容性
  jwt: {
    // 默认为HS256，安全且适用于大多数情况
    // 避免使用需要公钥/私钥的算法，简化部署
    maxAge: 24 * 60 * 60, // 与session.maxAge保持一致
  },
  // 设置更详细的调试信息
  logger: {
    error(code, ...message) {
      console.error(`[NextAuth][Error][${code}]`, ...message);
    },
    warn(code, ...message) {
      console.warn(`[NextAuth][Warning][${code}]`, ...message);
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[NextAuth][Debug][${code}]`, ...message);
      }
    },
  },
};

// 处理NextAuth请求
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 