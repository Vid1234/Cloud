import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, type, priority, dueDate, assigneeId } = body;

    if (!title || !description || !type || !assigneeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const action = await prisma.action.create({
      data: {
        problemId: id,
        title,
        description,
        type,
        priority: priority ?? "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId,
        status: "open",
      },
      include: {
        assignee: { select: { id: true, name: true, department: true } },
      },
    });

    // Advance status if in investigating
    const problem = await prisma.problem.findUnique({ where: { id } });
    if (problem?.status === "investigating") {
      await prisma.problem.update({
        where: { id },
        data: { status: "action_planned" },
      });
    }

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create action" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { actionId, status } = body;

    const updateData: Record<string, unknown> = { status };
    if (status === "completed") {
      updateData.completedAt = new Date();
    }

    const action = await prisma.action.update({
      where: { id: actionId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    // Check if all actions are completed → advance to pending_verification
    const allActions = await prisma.action.findMany({ where: { problemId: id } });
    const allDone = allActions.every((a) => a.status === "completed" || a.status === "verified");

    if (allDone && allActions.length > 0) {
      const problem = await prisma.problem.findUnique({ where: { id } });
      if (problem?.status === "in_progress" || problem?.status === "action_planned") {
        await prisma.problem.update({
          where: { id },
          data: { status: "pending_verification" },
        });
      }
    } else {
      const problem = await prisma.problem.findUnique({ where: { id } });
      if (problem?.status === "action_planned") {
        await prisma.problem.update({
          where: { id },
          data: { status: "in_progress" },
        });
      }
    }

    return NextResponse.json(action);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update action" }, { status: 500 });
  }
}
