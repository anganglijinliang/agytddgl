import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { importAllMasterData } from "./customers/import-data";
import { revalidatePath } from "next/cache";

export const metadata = {
  title: "基础数据管理 | 安钢集团永通球墨铸铁管订单管理系统",
};

export default function MasterDataPage() {
  async function handleImportData() {
    "use server";
    await importAllMasterData();
    revalidatePath("/dashboard/master-data");
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title="基础数据管理"
          description="管理系统基础数据"
        />
      </div>
      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>客户数据</CardTitle>
            <CardDescription>
              管理系统中的客户基础数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              客户数据用于订单创建过程中，包含客户的名称、联系人、地址等信息。
            </p>
          </CardContent>
          <CardFooter>
            <Button
              asChild
              className="w-full"
            >
              <a href="/dashboard/master-data/customers">
                管理客户数据
              </a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>产品规格数据</CardTitle>
            <CardDescription>
              管理球墨铸铁管产品规格数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              产品规格数据包含管道的规格、级别、接口形式、内衬等基础信息。
            </p>
          </CardContent>
          <CardFooter>
            <Button
              asChild
              className="w-full"
            >
              <a href="/dashboard/master-data/specifications">
                管理规格数据
              </a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>生产线与仓库</CardTitle>
            <CardDescription>
              管理生产线和仓库基础信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              包含工厂的生产线信息和仓库信息，用于生产管理和发运管理。
            </p>
          </CardContent>
          <CardFooter>
            <Button
              asChild
              className="w-full"
            >
              <a href="/dashboard/master-data/facilities">
                管理设施数据
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>数据初始化</CardTitle>
          <CardDescription>
            为系统导入初始测试数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            此功能将为系统导入初始测试数据，包括示例客户、产品规格等基础数据。仅在系统初始部署时使用。
          </p>
          <form action={handleImportData}>
            <Button type="submit" variant="outline">
              导入初始测试数据
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 