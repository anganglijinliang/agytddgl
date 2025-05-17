import "@/app/globals.css";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { checkRequiredEnvVars } from "@/lib/env-check";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "安钢集团永通球墨铸铁管订单管理系统",
    template: "%s | 安钢集团永通球墨铸铁管订单管理系统"
  },
  description: "安钢集团永通球墨铸铁管订单管理系统 - 专业的生产和发货流程管理平台",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: [
      { url: "/favicon.ico" }
    ],
    shortcut: [
      { url: "/favicon.ico" }
    ],
    apple: [
      { url: "/apple-touch-icon.png" }
    ]
  }
};

// 应用启动时验证环境变量
checkRequiredEnvVars();

if (process.env.NODE_ENV === "development") {
  // 仅在开发环境中动态导入迁移检查模块
  import("@/lib/db-migrate").then(({ checkDatabaseMigration }) => {
    checkDatabaseMigration()
      .then(({ success }) => {
        if (success) {
          console.log("🚀 应用启动: 数据库迁移检查完成");
        } else {
          console.warn("⚠️ 应用启动: 数据库迁移检查失败，但应用将继续运行");
        }
      })
      .catch((err) => {
        console.error("❌ 应用启动: 数据库迁移检查错误", err);
      });
  });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
} 