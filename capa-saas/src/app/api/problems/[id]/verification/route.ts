import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isEffective, notes, method, verifiedById } = await request.json();

    const existing = await prisma.verification.findUnique({ where: { problemId: id } });

    let result;
    const data = {
      isEffective,
      notes,
      method,
      verifiedById: verifiedById || null,
      verifiedAt: new Date(),
    };

    if (existing) {
      result = await prisma.verification.update({ where: { problemId: id }, data });
    } else {
      result = await prisma.verification.create({ data: { problemId: id, ...data } });
    }

    if (isEffective === true) {
      await prisma.problem.update({
        where: { id },
        data: { status: "closed", closedAt: new Date() },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save verification" }, { status: 500 });
  }
}
