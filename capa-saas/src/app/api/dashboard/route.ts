import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalProblems,
      openProblems,
      overdueProblems,
      closedThisMonth,
      byStatus,
      bySeverity,
      byCategory,
      recentProblems,
    ] = await Promise.all([
      prisma.problem.count(),
      prisma.problem.count({ where: { status: { not: "closed" } } }),
      prisma.problem.count({
        where: {
          status: { not: "closed" },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.problem.count({
        where: {
          status: "closed",
          closedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.problem.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.problem.groupBy({
        by: ["severity"],
        _count: true,
      }),
      prisma.problem.groupBy({
        by: ["category"],
        _count: true,
      }),
      prisma.problem.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: { select: { name: true } },
          assignee: { select: { name: true } },
        },
      }),
    ]);

    // Build monthly trend (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [opened, closed] = await Promise.all([
        prisma.problem.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.problem.count({ where: { closedAt: { gte: start, lte: end } } }),
      ]);

      months.push({
        month: start.toLocaleString("en-US", { month: "short" }),
        opened,
        closed,
      });
    }

    return NextResponse.json({
      stats: {
        total: totalProblems,
        open: openProblems,
        overdue: overdueProblems,
        closedThisMonth,
        closureRate: totalProblems > 0 ? Math.round(((totalProblems - openProblems) / totalProblems) * 100) : 0,
      },
      byStatus,
      bySeverity,
      byCategory,
      trend: months,
      recentProblems,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
