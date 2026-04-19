import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_CONFIG = {
  reported: {
    label: "Reported",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
    step: 1,
  },
  investigating: {
    label: "Investigating",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    step: 2,
  },
  action_planned: {
    label: "Action Planned",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
    step: 3,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    step: 4,
  },
  pending_verification: {
    label: "Pending Verification",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    step: 5,
  },
  closed: {
    label: "Closed",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    step: 6,
  },
} as const;

export const SEVERITY_CONFIG = {
  critical: {
    label: "Critical",
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    color: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
} as const;

export const CATEGORY_OPTIONS = [
  { value: "quality", label: "Quality" },
  { value: "safety", label: "Safety" },
  { value: "process", label: "Process" },
  { value: "equipment", label: "Equipment" },
  { value: "material", label: "Material" },
  { value: "other", label: "Other" },
];

export const AREA_OPTIONS = [
  { value: "Line A", label: "Line A" },
  { value: "Line B", label: "Line B" },
  { value: "Line C", label: "Line C" },
  { value: "Assembly", label: "Assembly" },
  { value: "Warehouse", label: "Warehouse" },
  { value: "Quality Lab", label: "Quality Lab" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "Shipping", label: "Shipping" },
];

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function daysUntilDue(dueDate: string | Date | null | undefined): number | null {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
