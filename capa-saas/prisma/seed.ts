import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Users
  const users = await Promise.all([
    prisma.user.upsert({ where: { email: "sarah.chen@factory.com" }, update: {}, create: { name: "Sarah Chen", email: "sarah.chen@factory.com", role: "manager", department: "Quality" } }),
    prisma.user.upsert({ where: { email: "mike.johnson@factory.com" }, update: {}, create: { name: "Mike Johnson", email: "mike.johnson@factory.com", role: "engineer", department: "Production" } }),
    prisma.user.upsert({ where: { email: "emma.davis@factory.com" }, update: {}, create: { name: "Emma Davis", email: "emma.davis@factory.com", role: "engineer", department: "Maintenance" } }),
    prisma.user.upsert({ where: { email: "james.wilson@factory.com" }, update: {}, create: { name: "James Wilson", email: "james.wilson@factory.com", role: "quality", department: "Quality" } }),
    prisma.user.upsert({ where: { email: "lisa.park@factory.com" }, update: {}, create: { name: "Lisa Park", email: "lisa.park@factory.com", role: "engineer", department: "Engineering" } }),
    prisma.user.upsert({ where: { email: "carlos.rivera@factory.com" }, update: {}, create: { name: "Carlos Rivera", email: "carlos.rivera@factory.com", role: "admin", department: "Operations" } }),
  ]);

  const [sarah, mike, emma, james, lisa, carlos] = users;

  // Problem 1: Closed
  const p1 = await prisma.problem.create({
    data: {
      title: "Surface finish defects on Bracket Assembly X-201",
      description: "Multiple units from Line A exhibit rough surface finish on the mating face. 34 units affected in Batch LOT-2024-018. Customer returned 12 units citing cosmetic non-conformance.",
      severity: "high",
      status: "closed",
      category: "quality",
      area: "Line A",
      partNumber: "X-201",
      batchNumber: "LOT-2024-018",
      dueDate: new Date("2026-02-15"),
      closedAt: new Date("2026-02-12"),
      reporterId: sarah.id,
      assigneeId: mike.id,
    },
  });
  await prisma.rootCause.create({
    data: {
      problemId: p1.id,
      why1: "Surface finish is out of specification on the mating face",
      why2: "The CNC milling tool was worn beyond its service life",
      why3: "Tool change schedule was not followed — tool ran 40% past its replacement interval",
      why4: "No automated tool life monitoring system in place; relied on manual tracking spreadsheet",
      why5: "Manual spreadsheet was not updated after last production run",
      rootCause: "Lack of automated tool life monitoring led to over-used cutting tools producing defective surface finishes",
      category: "machine",
    },
  });
  const a1 = await prisma.action.createMany({
    data: [
      { problemId: p1.id, title: "Replace all worn cutting tools on Line A", description: "Immediately replace all milling tools that have exceeded 80% of rated life", type: "immediate", status: "completed", priority: "high", assigneeId: emma.id, completedAt: new Date("2026-01-28") },
      { problemId: p1.id, title: "Implement automated tool life monitoring", description: "Install and configure automated tool life tracking integrated with CNC control system", type: "corrective", status: "completed", priority: "high", assigneeId: lisa.id, completedAt: new Date("2026-02-08") },
      { problemId: p1.id, title: "Update tool change SOP and training", description: "Revise standard operating procedure for tool changes and conduct operator refresher training", type: "preventive", status: "completed", priority: "medium", assigneeId: james.id, completedAt: new Date("2026-02-10") },
    ],
  });
  await prisma.verification.create({
    data: {
      problemId: p1.id,
      isEffective: true,
      method: "testing",
      notes: "100% inspection of 50 units produced after corrective actions. All units pass surface finish specification. CMM measurements show Rz within 1.2–1.8µm vs spec of ≤2.0µm.",
      verifiedById: sarah.id,
      verifiedAt: new Date("2026-02-12"),
    },
  });

  // Problem 2: In Progress
  const p2 = await prisma.problem.create({
    data: {
      title: "Torque specification non-conformance — Assembly Station 3",
      description: "Final torque readings on fastener assembly are consistently 8-12% below specification. Affects approximately 15% of units passing through Assembly Station 3. Risk of field failure if not corrected.",
      severity: "critical",
      status: "in_progress",
      category: "process",
      area: "Assembly",
      partNumber: "ASM-440",
      dueDate: new Date("2026-04-30"),
      reporterId: james.id,
      assigneeId: mike.id,
    },
  });
  await prisma.rootCause.create({
    data: {
      problemId: p2.id,
      why1: "Fastener torque is 8–12% below specification",
      why2: "Torque wrench used on Station 3 is reading incorrectly",
      why3: "Torque wrench calibration is expired by 45 days",
      why4: "Calibration reminder was not triggered — calibration management system had an incorrect due date entered",
      rootCause: "Data entry error in calibration management system caused a missed calibration, resulting in an out-of-tolerance torque wrench being used in production",
      category: "measurement",
    },
  });
  await prisma.action.createMany({
    data: [
      { problemId: p2.id, title: "Quarantine affected units", description: "Place all units from Station 3 produced in last 30 days on hold for 100% torque verification", type: "immediate", status: "completed", priority: "high", assigneeId: mike.id, completedAt: new Date("2026-04-10") },
      { problemId: p2.id, title: "Calibrate torque wrench and verify against master", description: "Send torque wrench to calibration lab, verify reading against master torque tester", type: "corrective", status: "in_progress", priority: "high", assigneeId: emma.id, dueDate: new Date("2026-04-22") },
      { problemId: p2.id, title: "Audit all torque equipment calibration records", description: "Review calibration records for all torque tools across the facility for similar issues", type: "preventive", status: "open", priority: "medium", assigneeId: james.id, dueDate: new Date("2026-04-28") },
    ],
  });

  // Problem 3: Investigating
  const p3 = await prisma.problem.create({
    data: {
      title: "Intermittent electrical shorts in Control Module CM-77",
      description: "Quality lab reports 3 of 20 CM-77 units tested show intermittent short circuit between pins 4 and 7 on connector J2. Issue manifests at elevated temperature (>65°C). No visible defects on inspection.",
      severity: "critical",
      status: "investigating",
      category: "quality",
      area: "Quality Lab",
      partNumber: "CM-77",
      batchNumber: "LOT-2026-003",
      dueDate: new Date("2026-04-25"),
      reporterId: james.id,
      assigneeId: lisa.id,
    },
  });
  await prisma.rootCause.create({
    data: {
      problemId: p3.id,
      why1: "Intermittent short between pins 4 and 7 at elevated temperature",
      why2: "Connector J2 insulation degrades above 65°C on affected units",
      why3: "Suspect incorrect insulation material used in last batch from supplier",
      rootCause: "Under investigation — material supplier batch analysis pending",
      category: "material",
    },
  });

  // Problem 4: Reported
  await prisma.problem.create({
    data: {
      title: "Dimensional deviation on Shaft Housing SH-309",
      description: "Incoming inspection rejects 7 of 50 SH-309 units. Inner bore diameter measuring 24.18mm vs. drawing specification of 24.00 ±0.05mm. Supplier: Precision Parts Co. PO# 2026-0412.",
      severity: "high",
      status: "reported",
      category: "material",
      area: "Warehouse",
      partNumber: "SH-309",
      batchNumber: "PP-2026-0412",
      dueDate: new Date("2026-05-10"),
      reporterId: carlos.id,
    },
  });

  // Problem 5: Action Planned
  const p5 = await prisma.problem.create({
    data: {
      title: "Oil contamination on Line B conveyor system",
      description: "Visible oil drips from conveyor chain lubrication system onto finished product below. Affected 22 units with surface contamination requiring rework. First reported by Line B operator at 06:40 shift start.",
      severity: "medium",
      status: "action_planned",
      category: "equipment",
      area: "Line B",
      dueDate: new Date("2026-04-28"),
      reporterId: mike.id,
      assigneeId: emma.id,
    },
  });
  await prisma.rootCause.create({
    data: {
      problemId: p5.id,
      why1: "Oil dripping from conveyor chain onto product",
      why2: "Lubrication system over-filled during last maintenance",
      why3: "Maintenance technician used incorrect oil volume from outdated procedure sheet",
      why4: "Procedure sheet revision was not distributed after last update 3 months ago",
      rootCause: "Outdated maintenance procedure sheet caused over-lubrication of conveyor chain system",
      category: "method",
    },
  });
  await prisma.action.createMany({
    data: [
      { problemId: p5.id, title: "Clean affected conveyor and product area", description: "Halt Line B, clean all oil contamination from conveyor and surrounding area", type: "immediate", status: "completed", priority: "high", assigneeId: emma.id, completedAt: new Date("2026-04-16") },
      { problemId: p5.id, title: "Rework 22 contaminated units", description: "Degrease and re-inspect all 22 affected units; scrap if rework not possible", type: "immediate", status: "open", priority: "high", assigneeId: mike.id, dueDate: new Date("2026-04-23") },
      { problemId: p5.id, title: "Revise lubrication SOP with correct volumes", description: "Update all maintenance procedure sheets with correct lubrication volumes and distribution protocol", type: "preventive", status: "open", priority: "medium", assigneeId: james.id, dueDate: new Date("2026-04-27") },
    ],
  });

  // Problem 6: Pending Verification
  const p6 = await prisma.problem.create({
    data: {
      title: "Weld porosity on Frame Weldment FW-102",
      description: "X-ray inspection reveals porosity defects in weld joint W3 on FW-102 frames. Rejection rate 18% over last 5 days. Defects are subsurface and not detectable by visual inspection alone.",
      severity: "high",
      status: "pending_verification",
      category: "quality",
      area: "Line C",
      partNumber: "FW-102",
      dueDate: new Date("2026-04-22"),
      reporterId: sarah.id,
      assigneeId: james.id,
    },
  });
  await prisma.rootCause.create({
    data: {
      problemId: p6.id,
      why1: "Weld joint W3 has porosity defects",
      why2: "Shielding gas flow rate was insufficient during welding",
      why3: "Gas regulator on Welder #2 was faulty and delivering 30% less gas than set",
      why4: "Faulty regulator was not caught during pre-shift equipment check",
      why5: "Equipment check sheet does not include shielding gas verification step",
      rootCause: "Missing shielding gas verification in pre-shift checks allowed faulty regulator to go undetected, causing weld porosity",
      category: "machine",
    },
  });
  await prisma.action.createMany({
    data: [
      { problemId: p6.id, title: "Replace faulty gas regulator on Welder #2", description: "Immediately swap out defective gas regulator with calibrated spare unit", type: "immediate", status: "completed", priority: "high", assigneeId: emma.id, completedAt: new Date("2026-04-12") },
      { problemId: p6.id, title: "100% X-ray inspect all FW-102 from last 5 days", description: "Submit all FW-102 frames from last 5 production days for 100% X-ray inspection", type: "immediate", status: "completed", priority: "high", assigneeId: james.id, completedAt: new Date("2026-04-14") },
      { problemId: p6.id, title: "Update pre-shift checklist to include gas flow verification", description: "Add shielding gas pressure and flow rate check to daily pre-shift equipment verification", type: "preventive", status: "completed", priority: "high", assigneeId: sarah.id, completedAt: new Date("2026-04-15") },
    ],
  });

  // Add some comments
  await prisma.comment.createMany({
    data: [
      { problemId: p2.id, content: "I have quarantined all 47 units from the last 30 days. All tagged with red hold tags. Torque wrench sent to external calibration lab this morning.", userId: mike.id },
      { problemId: p2.id, content: "Calibration lab confirmed the wrench is reading 9.5% low. New calibrated wrench ordered from supplier. ETA 2 days.", userId: emma.id },
      { problemId: p3.id, content: "Sent samples to material supplier for composition analysis. Awaiting report within 5 business days. Have also requested last 3 batches of insulation material for comparison testing.", userId: lisa.id },
      { problemId: p3.id, content: "Thermal imaging on affected units shows hotspot at connector area consistent with localized resistance increase. Supports short circuit hypothesis.", userId: james.id },
      { problemId: p6.id, content: "X-ray results are in — 12 of 89 frames have porosity. All rejected. Good news is production since regulator replacement shows 0 defects in 23 frames.", userId: james.id },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log(`Created ${users.length} users and 6 sample problems`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
