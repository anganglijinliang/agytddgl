import { NextResponse } from "next/server";

export type ApiErrorResponse = {
  error: string;
  status: number;
  timestamp: string;
  message: string;
  path?: string;
};

/**
 * 创建一个标准格式的API错误响应
 */
export function createErrorResponse(
  message: string,
  status = 500,
  path?: string
): NextResponse<ApiErrorResponse> {
  console.error(`API错误 [${status}]: ${message} ${path ? `在 ${path}` : ""}`);
  
  const errorResponse: ApiErrorResponse = {
    error: getErrorStatusText(status),
    status,
    timestamp: new Date().toISOString(),
    message,
    path,
  };

  return NextResponse.json(errorResponse, { status });
}

/**
 * 获取HTTP状态码对应的文本信息
 */
function getErrorStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    409: "Conflict",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };

  return statusTexts[status] || "Unknown Error";
}

/**
 * 处理常见错误的助手函数
 */
export function handleApiError(error: unknown, path?: string): NextResponse {
  console.error(`处理API错误:`, error);
  
  let message = "服务器处理请求时出错";
  let status = 500;

  if (error instanceof Error) {
    message = error.message;
    
    // 处理一些常见的错误类型
    if (message.includes("Unauthorized") || message.includes("权限")) {
      status = 401;
    } else if (message.includes("not found") || message.includes("不存在")) {
      status = 404;
    } else if (message.includes("Validation") || message.includes("验证")) {
      status = 400;
    }
  }

  return createErrorResponse(message, status, path);
} 