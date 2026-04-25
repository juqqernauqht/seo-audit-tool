import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const job = getJob(params.id);

  if (!job) {
    return NextResponse.json({ error: "İş bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(job);
}
