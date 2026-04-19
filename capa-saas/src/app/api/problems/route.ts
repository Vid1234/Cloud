import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (severity && severity !== "all") where.severity = severity;
    if (category && category !== "all") where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { area: { contains: search } },
        { partNumber: { contains: search } },
      ];
    }

    const problems = await prisma.problem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, department: true } },
        assignee: { select: { id: true, name: true, department: true } },
        _count: { select: { actions: true, comments: true } },
      },
    });

    return NextResponse.json(problems);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch problems" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title, description, severity, category, area,
      partNumber, batchNumber, dueDate, reporterId, assigneeId,
    } = body;

    if (!title || !description || !severity || !category || !area || !reporterId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        severity,
        category,
        area,
        partNumber: partNumber || null,
        batchNumber: batchNumber || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        reporterId,
        assigneeId: assigneeId || null,
        status: "reported",
      },
      include: {
        reporter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(problem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create problem" }, { status: 500 });
  }
}
