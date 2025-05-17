import { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录 | 安钢集团永通球墨铸铁管有限责任公司",
  description: "登录到订单管理系统",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 