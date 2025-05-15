import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "客户查询 | 安钢集团永通球墨铸铁管订单管理系统",
  description: "通过订单号查询订单状态",
};

export default function CustomerPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex justify-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-search"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-center text-2xl font-bold">订单查询</CardTitle>
            <CardDescription className="text-center">
              输入订单号查询订单的生产和发运进度
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="orderNumber">
                订单号
              </label>
              <Input
                id="orderNumber"
                placeholder="请输入订单号，例如 AG230610001"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <p className="text-center text-xs text-gray-500">
              您也可以扫描订单二维码进行查询
            </p>
            <Button className="w-full bg-brand-600 hover:bg-brand-700">
              查询订单
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-sm text-brand-600 hover:text-brand-700"
        >
          返回首页
        </Link>
      </div>

      <div className="mt-12 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} 安钢集团永通球墨铸铁管有限责任公司
      </div>
    </main>
  );
} 