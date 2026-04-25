"use client";

import type { AuditReport } from "@/lib/types";
import Sidebar from "./Sidebar";

interface Props {
  report: AuditReport;
  children: React.ReactNode;
}

export default function AppShell({ report, children }: Props) {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar report={report} />
      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
}
