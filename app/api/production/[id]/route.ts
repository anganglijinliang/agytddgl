import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createAuditLog } from "@/lib/create-audit-log";

// PATCH /api/production/[id] - 更新生产记录
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "未授权", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const productionId = params.id;
    const body = await request.json();

    // 验证数据
    if (!productionId) {
      return NextResponse.json(
        { success: false, message: "生产记录ID不能为空" },
        { status: 400 }
      );
    }

    // 获取当前生产记录
    const currentProduction = await db.production.findUnique({
      where: { id: productionId },
      include: {
        subOrder: {
          include: {
            order: true,
            production: true,
          },
        },
      },
    });

    if (!currentProduction) {
      return NextResponse.json(
        { success: false, message: "生产记录不存在" },
        { status: 404 }
      );
    }

    // 将字符串日期转换为Date对象
    const startTime = body.startTime ? new Date(body.startTime) : null;
    const endTime = body.endTime ? new Date(body.endTime) : null;
    const productionDate = body.productionDate ? new Date(body.productionDate) : new Date();

    // 更新生产记录
    const updatedProduction = await db.production.update({
      where: { id: productionId },
      data: {
        team: body.team,
        shift: body.shift,
        quantity: body.quantity,
        productionDate,
        startTime,
        endTime,
        qualityNotes: body.qualityNotes,
        materialUsage: body.materialUsage,
        notes: body.notes,
      },
    });

    // 记录审计日志
    await createAuditLog({
      action: "UPDATE",
      resource: "PRODUCTION",
      resourceId: productionId,
      description: `更新了生产记录: ${currentProduction.subOrder.specification}, 数量: ${body.quantity}`,
      metadata: JSON.stringify({
        before: currentProduction,
        after: updatedProduction,
      }),
    });

    return NextResponse.json({ success: true, data: updatedProduction });
  } catch (error: any) {
    console.error("更新生产记录失败:", error);
    return NextResponse.json(
      { success: false, message: `更新生产记录失败: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/production/[id] - 删除生产记录
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "未授权", error: "Unauthorized" },
        { status: 401 }
      );
    }

    const productionId = params.id;

    // 验证数据
    if (!productionId) {
      return NextResponse.json(
        { success: false, message: "生产记录ID不能为空" },
        { status: 400 }
      );
    }

    // 获取当前生产记录（用于审计日志）
    const currentProduction = await db.production.findUnique({
      where: { id: productionId },
      include: {
        subOrder: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!currentProduction) {
      return NextResponse.json(
        { success: false, message: "生产记录不存在" },
        { status: 404 }
      );
    }

    // 删除生产记录
    await db.production.delete({
      where: { id: productionId },
    });

    // 记录审计日志
    await createAuditLog({
      action: "DELETE",
      resource: "PRODUCTION",
      resourceId: productionId,
      description: `删除了生产记录: ${currentProduction.subOrder.specification}, 数量: ${currentProduction.quantity}`,
      metadata: JSON.stringify(currentProduction),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("删除生产记录失败:", error);
    return NextResponse.json(
      { success: false, message: `删除生产记录失败: ${error.message}` },
      { status: 500 }
    );
  }
} 