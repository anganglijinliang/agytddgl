"use server";

import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";
import { orderBaseSchema, subOrderSchema } from "@/lib/request-schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface GetOrdersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export async function getOrders({
  page = 1,
  pageSize = 10,
  search = "",
  status = "",
}: GetOrdersParams) {
  try {
    const skip = (page - 1) * pageSize;
    
    // 构建查询条件
    const where: any = {};
    
    // 搜索条件：订单号或客户名
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    // 状态筛选
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status;
    }
    
    // 查询订单总数
    const totalCount = await db.order.count({ where });
    
    // 查询订单列表，按创建时间降序排序
    const orders = await db.order.findMany({
      where,
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    });
    
    // 计算总页数
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return {
      orders,
      totalCount,
      totalPages,
    };
  } catch (error) {
    console.error("获取订单列表失败:", error);
    throw new Error("获取订单列表失败，请稍后重试");
  }
}

export async function getAllCustomers() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        contactName: true,
        phone: true,
        email: true,
        address: true,
      },
    });
    
    return { customers };
  } catch (error) {
    console.error("获取客户列表失败:", error);
    throw new Error("获取客户列表失败，请稍后重试");
  }
}

export async function getOrderById(id: string) {
  try {
    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        subOrders: {
          include: {
            productionLine: true,
            warehouse: true,
          },
        },
      },
    });
    
    if (!order) {
      throw new Error("订单不存在");
    }
    
    return { order };
  } catch (error) {
    console.error("获取订单详情失败:", error);
    throw new Error("获取订单详情失败，请稍后重试");
  }
}

// 生成订单编号 - 格式: AG-YYYYMMDD-XXXX
function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // 生成4位随机数
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  return `AG-${dateStr}-${randomNum}`;
}

// 创建订单
export async function createOrder(data: z.infer<typeof orderBaseSchema>) {
  try {
    // 验证数据
    const validData = orderBaseSchema.parse(data);
    
    // 获取当前用户会话
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "用户未登录" };
    }
    
    // 生成订单编号
    const orderNumber = generateOrderNumber();
    
    // 创建订单
    const order = await db.order.create({
      data: {
        ...validData,
        orderNumber,
        userId: session.user.id,
        status: OrderStatus.DRAFT,
      },
    });
    
    // 记录审计日志
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        resource: "ORDER",
        resourceId: order.id,
        description: `创建了订单 ${orderNumber}`,
      },
    });
    
    // 重新验证订单列表页面
    revalidatePath("/dashboard/orders");
    
    return { success: true, id: order.id };
  } catch (error) {
    console.error("创建订单失败:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "表单数据验证失败" };
    }
    return { success: false, error: "创建订单失败，请稍后重试" };
  }
}

// 更新订单
export async function updateOrder(
  id: string,
  data: z.infer<typeof orderBaseSchema>
) {
  try {
    // 验证数据
    const validData = orderBaseSchema.parse(data);
    
    // 获取当前用户会话
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "用户未登录" };
    }
    
    // 检查订单是否存在
    const existingOrder = await db.order.findUnique({
      where: { id },
      select: { orderNumber: true },
    });
    
    if (!existingOrder) {
      return { success: false, error: "订单不存在" };
    }
    
    // 更新订单
    await db.order.update({
      where: { id },
      data: validData,
    });
    
    // 记录审计日志
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        resource: "ORDER",
        resourceId: id,
        description: `更新了订单 ${existingOrder.orderNumber} 的基本信息`,
      },
    });
    
    // 重新验证订单列表页面
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${id}`);
    
    return { success: true };
  } catch (error) {
    console.error("更新订单失败:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "表单数据验证失败" };
    }
    return { success: false, error: "更新订单失败，请稍后重试" };
  }
}

// 创建子订单
export async function createSubOrder(
  orderId: string,
  data: z.infer<typeof subOrderSchema>
) {
  try {
    console.log("开始创建子订单，订单ID:", orderId);
    console.log("子订单数据:", JSON.stringify(data, null, 2));
    
    // 验证数据
    const validData = subOrderSchema.parse(data);
    console.log("数据验证通过");
    
    // 获取当前用户会话
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("用户未登录");
      return { success: false, error: "用户未登录" };
    }
    console.log("当前用户ID:", session.user.id);
    
    // 检查订单是否存在
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true, status: true },
    });
    
    if (!existingOrder) {
      console.error("订单不存在, 订单ID:", orderId);
      return { success: false, error: "订单不存在" };
    }
    console.log("找到订单:", existingOrder.orderNumber);
    
    // 计算总重量
    const totalWeight = validData.plannedQuantity * validData.unitWeight;
    console.log("计算总重量:", totalWeight);
    
    // 创建子订单
    console.log("开始创建子订单...");
    const subOrder = await db.subOrder.create({
      data: {
        ...validData,
        orderId,
        totalWeight,
      },
    }).catch(error => {
      console.error("创建子订单数据库操作失败:", error);
      throw error;
    });
    console.log("子订单创建成功, ID:", subOrder.id);
    
    // 如果订单仍然是草稿状态，更新为已确认状态
    if (existingOrder.status === OrderStatus.DRAFT) {
      console.log("更新订单状态为已确认");
      await db.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED },
      }).catch(error => {
        console.error("更新订单状态失败:", error);
        // 不抛出错误，因为子订单已创建成功
      });
    }
    
    // 记录审计日志
    console.log("创建审计日志");
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        resource: "SUB_ORDER", 
        resourceId: subOrder.id,
        description: `为订单 ${existingOrder.orderNumber} 添加了子订单，规格：${validData.specification}，数量：${validData.plannedQuantity}`,
      },
    }).catch(error => {
      console.error("创建审计日志失败:", error);
      // 不抛出错误，因为子订单已创建成功
    });
    
    // 重新验证相关页面
    revalidatePath(`/dashboard/orders/${orderId}`);
    
    console.log("子订单创建流程完成");
    return { success: true, id: subOrder.id };
  } catch (error) {
    console.error("创建子订单失败:", error);
    if (error instanceof z.ZodError) {
      console.error("表单数据验证失败:", JSON.stringify(error.errors, null, 2));
      return { success: false, error: "表单数据验证失败" };
    }
    if (error instanceof Error) {
      return { success: false, error: `创建子订单失败: ${error.message}` };
    }
    return { success: false, error: "创建子订单失败，请稍后重试" };
  }
}

// 获取下拉数据
export async function getDropdownData() {
  try {
    // 获取规格数据
    const specifications = await db.specification.findMany({
      select: { id: true, value: true },
      orderBy: { value: 'asc' },
    });
    
    // 获取级别数据
    const grades = await db.grade.findMany({
      select: { id: true, value: true },
      orderBy: { value: 'asc' },
    });
    
    // 获取接口形式数据
    const interfaceTypes = await db.interfaceType.findMany({
      select: { id: true, value: true },
      orderBy: { value: 'asc' },
    });
    
    // 获取内衬数据
    const linings = await db.lining.findMany({
      select: { id: true, value: true },
      orderBy: { value: 'asc' },
    });
    
    // 获取长度数据
    const lengths = await db.length.findMany({
      select: { id: true, value: true },
      orderBy: { value: 'asc' },
    });
    
    // 获取防腐数据
    const anticorrosions = await db.anticorrosion.findMany({
      select: { id: true, value: true },
      orderBy: { value: 'asc' },
    });
    
    // 获取生产线数据
    const productionLines = await db.productionLine.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }).then(lines => lines.map(line => ({
      id: line.id,
      value: line.name,
    })));
    
    // 获取仓库数据
    const warehouses = await db.warehouse.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }).then(warehouses => warehouses.map(warehouse => ({
      id: warehouse.id,
      value: warehouse.name,
    })));
    
    return {
      specifications,
      grades,
      interfaceTypes,
      linings,
      lengths,
      anticorrosions,
      productionLines,
      warehouses,
    };
  } catch (error) {
    console.error("获取下拉数据失败:", error);
    throw new Error("获取下拉数据失败，请稍后重试");
  }
} 