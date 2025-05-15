import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fromDate = url.searchParams.get("from");
  const toDate = url.searchParams.get("to");

  if (!fromDate || !toDate) {
    return NextResponse.json(
      { error: "缺少必要的日期参数" },
      { status: 400 }
    );
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);

  try {
    // 获取订单状态分布
    const ordersByStatus = await db.order.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
    });

    // 获取总订单数
    const totalOrders = await db.order.count({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
    });

    // 获取已完成订单数
    const completedOrders = await db.order.count({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: from,
          lte: to,
        },
      },
    });

    // 获取生产总量
    const productions = await db.production.findMany({
      where: {
        productionDate: {
          gte: from,
          lte: to,
        },
      },
      select: {
        quantity: true,
        productionDate: true,
        subOrder: {
          select: {
            specification: true,
          },
        },
      },
    });

    const totalProduction = productions.reduce(
      (sum, prod) => sum + prod.quantity,
      0
    );

    // 按规格分组汇总生产数据
    const productionBySpec = productions.reduce((acc, prod) => {
      const date = new Date(prod.productionDate);
      const monthYear = `${date.getMonth() + 1}月`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = {};
      }
      
      const spec = prod.subOrder?.specification || "未知规格";
      
      if (!acc[monthYear][spec]) {
        acc[monthYear][spec] = 0;
      }
      
      acc[monthYear][spec] += prod.quantity;
      
      return acc;
    }, {} as Record<string, Record<string, number>>);

    // 转换为前端所需的数据格式
    const productionChartData = Object.entries(productionBySpec).map(
      ([month, specs]) => ({
        month,
        ...specs,
      })
    );

    // 获取发运数据
    const shippings = await db.shipping.findMany({
      where: {
        shippingDate: {
          gte: from,
          lte: to,
        },
      },
      select: {
        quantity: true,
        shippingDate: true,
        transportType: true,
      },
    });

    const totalShipping = shippings.reduce(
      (sum, ship) => sum + ship.quantity,
      0
    );

    // 按运输方式分组汇总发运数据
    const shippingByTransport = shippings.reduce((acc, ship) => {
      const date = new Date(ship.shippingDate);
      const monthYear = `${date.getMonth() + 1}月`;
      
      if (!acc[monthYear]) {
        acc[monthYear] = {
          汽运: 0,
          火车: 0,
          船运: 0,
          其他: 0,
        };
      }
      
      if (ship.transportType === "TRUCK") {
        acc[monthYear].汽运 += ship.quantity;
      } else if (ship.transportType === "TRAIN") {
        acc[monthYear].火车 += ship.quantity;
      } else if (ship.transportType === "SHIP") {
        acc[monthYear].船运 += ship.quantity;
      } else {
        acc[monthYear].其他 += ship.quantity;
      }
      
      return acc;
    }, {} as Record<string, { 汽运: number; 火车: number; 船运: number; 其他: number }>);

    // 转换为前端所需的数据格式
    const shippingChartData = Object.entries(shippingByTransport).map(
      ([month, transports]) => ({
        month,
        ...transports,
      })
    );

    // 计算各运输方式占比
    const transportShares = {
      汽运: 0,
      火车: 0,
      船运: 0,
      其他: 0,
    };

    if (totalShipping > 0) {
      const truckTotal = shippings
        .filter((s) => s.transportType === "TRUCK")
        .reduce((sum, s) => sum + s.quantity, 0);
      
      const trainTotal = shippings
        .filter((s) => s.transportType === "TRAIN")
        .reduce((sum, s) => sum + s.quantity, 0);
      
      const shipTotal = shippings
        .filter((s) => s.transportType === "SHIP")
        .reduce((sum, s) => sum + s.quantity, 0);
      
      const otherTotal = shippings
        .filter((s) => s.transportType === "OTHER")
        .reduce((sum, s) => sum + s.quantity, 0);

      transportShares.汽运 = parseFloat(((truckTotal / totalShipping) * 100).toFixed(1));
      transportShares.火车 = parseFloat(((trainTotal / totalShipping) * 100).toFixed(1));
      transportShares.船运 = parseFloat(((shipTotal / totalShipping) * 100).toFixed(1));
      transportShares.其他 = parseFloat(((otherTotal / totalShipping) * 100).toFixed(1));
    }

    return NextResponse.json({
      overview: {
        totalOrders,
        completedOrders,
        completionRate: totalOrders > 0 ? parseFloat(((completedOrders / totalOrders) * 100).toFixed(1)) : 0,
        totalProduction,
        totalShipping,
        shippingRate: totalProduction > 0 ? parseFloat(((totalShipping / totalProduction) * 100).toFixed(1)) : 0,
      },
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      productionData: productionChartData,
      shippingData: shippingChartData,
      transportShares,
    });
  } catch (error) {
    console.error("获取分析数据出错:", error);
    return NextResponse.json(
      { error: "获取分析数据失败" },
      { status: 500 }
    );
  }
} 