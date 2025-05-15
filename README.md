# 安钢集团永通球墨铸铁管订单管理系统

## 部署状态
- 最后更新: 2024-06-10
- 状态: 已修复部署脚本

## 系统重新初始化 (2024-06-10)

本系统已完成重新初始化和全面优化，修复了登录错误问题，增强了系统稳定性。此外，我们优化了部署脚本，解决了数据库同步过程中可能导致部署卡住的问题。

## 项目介绍
安钢集团永通球墨铸铁管订单管理系统是一个专为安钢集团开发的订单管理平台，用于管理球墨铸铁管的生产订单、库存和销售情况。系统提供了完整的订单生命周期管理，从询价到交付的全过程跟踪。

## 主要功能
- 用户认证与权限管理
- 订单创建与管理
- 生产计划制定与跟踪
- 库存管理
- 报表生成与数据分析
- 客户管理

## 技术栈
- 前端：Next.js 14, React, Tailwind CSS, shadcn/ui
- 后端：Next.js API Routes, Prisma ORM
- 数据库：PostgreSQL (通过Supabase托管)
- 认证：NextAuth.js
- 部署：Vercel

## 环境要求
- Node.js >= 18.x
- npm >= 9.x
- PostgreSQL >= 14 (可选，如使用本地数据库)

## 本地开发
```bash
# 安装依赖
npm install

# 设置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

## 部署
系统已配置好自动部署到Vercel，提交到main分支后会自动触发部署流程。

## 测试账号
- 管理员: admin@example.com / Admin123!
- 普通用户: user@example.com / User123!

## 版本历史
- v2.0.1 - 当前版本
  - 优化用户界面体验
  - 增强订单处理流程
  - 修复了多项安全漏洞
  
- v1.2.0
  - 增加报表导出功能
  - 优化手机端适配
  
- v1.0.0 
  - 初始版本发布

## 核心功能

- 多级别用户权限系统
- 订单管理（含子订单）
- 生产过程管理
- 发运管理
- 统计报表与查询系统
- 订单二维码生成

## 开发环境设置

1. 安装依赖

```bash
npm install
```

2. 设置环境变量

创建`.env.local`文件，添加以下内容:

```
DATABASE_URL="你的数据库连接URL"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="你的NextAuth密钥"
```

3. 初始化数据库

```bash
npx prisma migrate dev
```

4. 启动开发服务器

```bash
npm run dev
```

5. 在浏览器中访问 [http://localhost:3000](http://localhost:3000)

## 部署到Vercel

1. 在Vercel上创建新项目
2. 连接到GitHub仓库
3. 添加环境变量
4. 部署

## 许可证

版权所有 © 安钢集团永通球墨铸铁管有限责任公司 