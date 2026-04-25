import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobStore";
import { exportToJSON } from "@/lib/export/json";
import { exportUrlTableCSV, exportIssuesCSV } from "@/lib/export/csv";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const format = searchParams.get("format") ?? "json";
  const type = searchParams.get("type") ?? "full"; // full | issues | urls

  if (!id) {
    return NextResponse.json({ error: "id parametresi zorunlu" }, { status: 400 });
  }

  const job = getJob(id);
  if (!job?.report) {
    return NextResponse.json({ error: "Rapor bulunamadı" }, { status: 404 });
  }

  const report = job.report;
  const domain = report.domain.replace(/[^a-z0-9]/gi, "-");
  const date = new Date(report.createdAt).toISOString().split("T")[0];

  if (format === "json") {
    const content = exportToJSON(report);
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="seo-audit-${domain}-${date}.json"`,
      },
    });
  }

  if (format === "csv") {
    const content = type === "issues"
      ? exportIssuesCSV(report)
      : exportUrlTableCSV(report);

    const filename = type === "issues"
      ? `seo-issues-${domain}-${date}.csv`
      : `seo-urls-${domain}-${date}.csv`;

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return NextResponse.json({ error: "Geçersiz format" }, { status: 400 });
}
