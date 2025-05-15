import { createErrorResponse } from "@/lib/api-error";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 获取URL中的错误参数
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  
  // 记录错误信息
  console.error("认证错误处理路由收到错误:", error);
  
  let errorMessage = "认证过程中发生错误";
  let statusCode = 500;
  
  // 根据错误类型设置适当的错误信息和状态码
  switch (error) {
    case "CredentialsSignin":
      errorMessage = "无效的凭据";
      statusCode = 401;
      break;
    case "AccessDenied":
      errorMessage = "访问被拒绝";
      statusCode = 403;
      break;
    case "Configuration":
      errorMessage = "服务器配置错误";
      statusCode = 500;
      break;
    case "Verification":
      errorMessage = "验证失败";
      statusCode = 400;
      break;
    case "OAuthCallback":
      errorMessage = "OAuth回调错误";
      statusCode = 400;
      break;
    case "OAuthAccountNotLinked":
      errorMessage = "OAuth账号未关联";
      statusCode = 400;
      break;
    default:
      if (error) {
        errorMessage = `认证错误: ${error}`;
      }
  }
  
  return createErrorResponse(errorMessage, statusCode, "/api/auth/error");
} 