const fs = require('fs');

const envContent = `DATABASE_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
NEXTAUTH_SECRET=a-secure-nextauth-secret-key-for-jwt-signing
NEXTAUTH_URL=http://localhost:3000
SKIP_DB_SYNC=true
POSTGRES_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
SUPABASE_URL=https://mrvvwmqtyeoasbmlxtpw.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://mrvvwmqtyeoasbmlxtpw.supabase.co
POSTGRES_URL_NON_POOLING=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
SUPABASE_JWT_SECRET=2Zld6JaS84KjdEwH+4DX+b7BryMAK1eO1ZT5qdtp95znhTMlDaappVQ6Nbh/dHrxwKINaxt1ZFyjgA4/tS5VQA==
POSTGRES_USER=postgres
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydnZ3bXF0eWVvYXNibWx4dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNzY1ODksImV4cCI6MjA2Mjg1MjU4OX0.nf9dJSsbhr-lq_CpiyjfRIRkJ_61xUqLVJle15KRFLQ
POSTGRES_PASSWORD=Ml05ZmoiEXfna4y6
POSTGRES_DATABASE=postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydnZ3bXF0eWVvYXNibWx4dHB3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI3NjU4OSwiZXhwIjoyMDYyODUyNTg5fQ.P8DVc2_JnGHOXwMpEBbjoC4ypp4pcHFBJmxG9WSKJIU
POSTGRES_HOST=db.mrvvwmqtyeoasbmlxtpw.supabase.co`;

fs.writeFileSync('.env', envContent);
console.log('已创建 .env 文件，包含所有环境变量');

// 也创建一个生产环境变量文件，用于Vercel部署
const prodEnvContent = `DATABASE_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require
NEXTAUTH_SECRET=a-secure-nextauth-secret-key-for-jwt-signing
NEXTAUTH_URL=https://agytddgl.vercel.app
SKIP_DB_SYNC=true
POSTGRES_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
SUPABASE_URL=https://mrvvwmqtyeoasbmlxtpw.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://mrvvwmqtyeoasbmlxtpw.supabase.co
POSTGRES_URL_NON_POOLING=postgres://postgres.mrvvwmqtyeoasbmlxtpw:Ml05ZmoiEXfna4y6@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
SUPABASE_JWT_SECRET=2Zld6JaS84KjdEwH+4DX+b7BryMAK1eO1ZT5qdtp95znhTMlDaappVQ6Nbh/dHrxwKINaxt1ZFyjgA4/tS5VQA==
POSTGRES_USER=postgres
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydnZ3bXF0eWVvYXNibWx4dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyNzY1ODksImV4cCI6MjA2Mjg1MjU4OX0.nf9dJSsbhr-lq_CpiyjfRIRkJ_61xUqLVJle15KRFLQ
POSTGRES_PASSWORD=Ml05ZmoiEXfna4y6
POSTGRES_DATABASE=postgres
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ydnZ3bXF0eWVvYXNibWx4dHB3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzI3NjU4OSwiZXhwIjoyMDYyODUyNTg5fQ.P8DVc2_JnGHOXwMpEBbjoC4ypp4pcHFBJmxG9WSKJIU
POSTGRES_HOST=db.mrvvwmqtyeoasbmlxtpw.supabase.co
NODE_ENV=production`;

fs.writeFileSync('.env.production', prodEnvContent);
console.log('已创建 .env.production 文件，用于Vercel部署'); 