import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STATUS_FLOW = [
  "reported",
  "investigating",
  "action_planned",
  "in_progress",
  "pending_verification",
  "closed",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    if (!STATUS_FLOW.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "closed") {
      updateData.closedAt = new Date();
    }

    const problem = await prisma.problem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(problem);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
