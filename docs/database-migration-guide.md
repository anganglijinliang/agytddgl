# 数据库迁移问题处理指南

本文档介绍了如何处理 Prisma 数据库迁移过程中可能遇到的问题，特别是在 Vercel 部署环境中。

## 常见问题

### 1. 迁移失败 (Error P3009)

当您看到类似以下的错误信息时，表示迁移失败：

```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
```

这通常发生在之前的迁移未成功完成的情况下。

## 解决方案

### 方案1：使用 RESET_MIGRATIONS 环境变量

1. 在 Vercel 项目设置中添加环境变量 `RESET_MIGRATIONS=true`
2. 重新部署项目
3. 部署完成后，将环境变量删除或设置为 `false`

这将在部署过程中尝试修复失败的迁移记录。

### 方案2：手动执行迁移重置脚本

在本地环境中，可以通过以下步骤手动重置迁移：

1. 确保已设置正确的数据库连接环境变量：
   ```
   DATABASE_URL=your_database_url
   ```

2. 运行迁移重置脚本：
   ```
   npm run prisma:reset-migrations
   ```

3. 脚本会执行以下操作：
   - 检查失败的迁移记录
   - 删除失败的迁移记录
   - 推送当前的数据库结构
   - 将初始迁移标记为已应用

### 方案3：跳过数据库同步

如果您暂时不想处理迁移问题，可以通过设置 `SKIP_DB_SYNC=true` 环境变量来跳过数据库同步步骤。

## 预防措施

为避免将来出现迁移问题：

1. 在本地开发环境中测试迁移，确保它们能够成功运行
2. 使用 `npx prisma migrate dev` 生成新的迁移文件
3. 在提交代码前，确保所有迁移都能成功应用
4. 保持 Prisma Schema 和 Migration 文件的同步

## 常用命令

```bash
# 查看迁移状态
npx prisma migrate status

# 重置数据库（危险操作，会删除所有数据）
npx prisma migrate reset

# 标记迁移为已应用
npx prisma migrate resolve --applied 迁移名称

# 强制推送数据库结构
npx prisma db push --accept-data-loss
```

## 注意事项

- 在生产环境中处理迁移问题时要特别小心，最好先备份数据库
- 使用 `--accept-data-loss` 参数可能会导致数据丢失
- 重置迁移历史不会修改数据库结构，只会更新迁移记录表 