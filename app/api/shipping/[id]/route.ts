import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { createAuditLog } from "@/lib/create-audit-log";

// PATCH /api/shipping/[id] - u66f4u65b0u53d1u8d27u8bb0u5f55
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // u83b7u53d6u5f53u524du7528u6237
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "u672au6388u6743" },
        { status: 401 }
      );
    }

    const shippingId = params.id;
    const body = await request.json();

    // u9a8cu8bc1u6570u636e
    if (!shippingId) {
      return NextResponse.json(
        { success: false, error: "u53d1u8d27u8bb0u5f55IDu4e0du80fdu4e3au7a7a" },
        { status: 400 }
      );
    }

    // u83b7u53d6u5f53u524du53d1u8d27u8bb0u5f55
    const currentShipping = await db.shipping.findUnique({
      where: { id: shippingId },
      include: {
        subOrder: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!currentShipping) {
      return NextResponse.json(
        { success: false, error: "u53d1u8d27u8bb0u5f55u4e0du5b58u5728" },
        { status: 404 }
      );
    }

    // u5c06u5b57u7b26u4e32u65e5u671fu8f6cu6362u4e3aDateu5bf9u8c61
    const shippingDate = body.shippingDate ? new Date(body.shippingDate) : undefined;
    const estimatedArrival = body.estimatedArrival ? new Date(body.estimatedArrival) : undefined;

    // u66f4u65b0u53d1u8d27u8bb0u5f55
    const updatedShipping = await db.shipping.update({
      where: { id: shippingId },
      data: {
        quantity: body.quantity,
        shippingDate,
        transportType: body.transportType,
        shippingNumber: body.shippingNumber || null,
        destinationInfo: body.destinationInfo || '',
        carrierName: body.carrierName || null,
        driverInfo: body.driverInfo || '',
        vehicleInfo: body.vehicleInfo || '',
        notes: body.notes || null,
        warehouseId: body.warehouseId || currentShipping.warehouseId,
      },
    });

    // u8bb0u5f55u5ba1u8ba1u65e5u5fd7
    await createAuditLog({
      action: "UPDATE",
      resource: "SHIPPING",
      resourceId: shippingId,
      description: `u66f4u65b0u4e86u53d1u8d27u8bb0u5f55: ${currentShipping.subOrder.order.orderNumber}, u6570u91cf: ${body.quantity}`,
      metadata: JSON.stringify({
        before: currentShipping,
        after: updatedShipping,
      }),
    });

    return NextResponse.json({ success: true, data: updatedShipping });
  } catch (error: any) {
    console.error("u66f4u65b0u53d1u8d27u8bb0u5f55u5931u8d25:", error);
    return NextResponse.json(
      { success: false, error: `u66f4u65b0u53d1u8d27u8bb0u5f55u5931u8d25: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/shipping/[id] - u5220u9664u53d1u8d27u8bb0u5f55
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // u83b7u53d6u5f53u524du7528u6237
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "u672au6388u6743" },
        { status: 401 }
      );
    }

    const shippingId = params.id;

    // u9a8cu8bc1u6570u636e
    if (!shippingId) {
      return NextResponse.json(
        { success: false, error: "u53d1u8d27u8bb0u5f55IDu4e0du80fdu4e3au7a7a" },
        { status: 400 }
      );
    }

    // u83b7u53d6u5f53u524du53d1u8d27u8bb0u5f55uff08u7528u4e8eu5ba1u8ba1u65e5u5fd7uff09
    const currentShipping = await db.shipping.findUnique({
      where: { id: shippingId },
      include: {
        subOrder: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!currentShipping) {
      return NextResponse.json(
        { success: false, error: "u53d1u8d27u8bb0u5f55u4e0du5b58u5728" },
        { status: 404 }
      );
    }

    // u5220u9664u53d1u8d27u8bb0u5f55
    await db.shipping.delete({
      where: { id: shippingId },
    });

    // u8bb0u5f55u5ba1u8ba1u65e5u5fd7
    await createAuditLog({
      action: "DELETE",
      resource: "SHIPPING",
      resourceId: shippingId,
      description: `u5220u9664u4e86u53d1u8d27u8bb0u5f55: ${currentShipping.subOrder.order.orderNumber}, u6570u91cf: ${currentShipping.quantity}`,
      metadata: JSON.stringify(currentShipping),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("u5220u9664u53d1u8d27u8bb0u5f55u5931u8d25:", error);
    return NextResponse.json(
      { success: false, error: `u5220u9664u53d1u8d27u8bb0u5f55u5931u8d25: ${error.message}` },
      { status: 500 }
    );
  }
} 