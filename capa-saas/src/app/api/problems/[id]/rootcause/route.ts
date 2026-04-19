import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { why1, why2, why3, why4, why5, rootCause, category } = body;

    const existing = await prisma.rootCause.findUnique({ where: { problemId: id } });

    let result;
    if (existing) {
      result = await prisma.rootCause.update({
        where: { problemId: id },
        data: { why1, why2, why3, why4, why5, rootCause, category },
      });
    } else {
      result = await prisma.rootCause.create({
        data: { problemId: id, why1, why2, why3, why4, why5, rootCause, category },
      });
    }

    // Advance status if still in reported
    const problem = await prisma.problem.findUnique({ where: { id } });
    if (problem?.status === "reported") {
      await prisma.problem.update({
        where: { id },
        data: { status: "investigating" },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save root cause" }, { status: 500 });
  }
}
