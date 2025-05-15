import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100 p-4">
      <div className="container flex max-w-5xl flex-col items-center justify-center gap-8 px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-brand-600 p-3 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-box"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="text-brand-600">安钢集团永通</span>
            <br />
            球墨铸铁管订单管理系统
          </h1>

          <p className="max-w-xl text-lg text-gray-600">
            一套现代化订单管理系统，用于安钢集团永通球墨铸铁管有限责任公司球墨铸铁管生产的订单、生产和发运管理。
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="h-12 px-6">
              <Link href="/login">系统登录</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 border-brand-600 px-6 text-brand-600 hover:bg-brand-50"
            >
              <Link href="/customer">客户查询</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
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
                className="lucide lucide-clipboard-list"
              >
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
                <path d="M8 11h.01" />
                <path d="M8 16h.01" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">订单管理</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              高效管理订单信息，支持多规格组合与批量导入，实时跟踪订单状态。
            </p>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
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
                className="lucide lucide-factory"
              >
                <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M17 18h1" />
                <path d="M12 18h1" />
                <path d="M7 18h1" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">生产管理</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              按班组记录生产进度，实时计算完成率，自动更新生产状态。
            </p>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
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
                className="lucide lucide-truck"
              >
                <path d="M10 17h4V5H2v12h3" />
                <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L18 8h-5v9h2" />
                <circle cx="7.5" cy="17.5" r="2.5" />
                <circle cx="17.5" cy="17.5" r="2.5" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">发运管理</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              详细记录发运信息，跟踪发运状态，支持多种发运方式。
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} 安钢集团永通球墨铸铁管有限责任公司
          版权所有
        </div>
      </div>
    </main>
  );
} 