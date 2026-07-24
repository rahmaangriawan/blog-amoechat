import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionRole } from "@/lib/auth";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  if ((await getSessionRole()) !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status")?.trim() ?? "";
  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q } },
            { email: { contains: q } },
            { phoneNumber: { contains: q } },
            { institutionName: { contains: q } },
            { major: { contains: q } },
            { interestField: { contains: q } },
            { status: { contains: q } },
          ],
        }
      : {}),
  };

  const rows = await (prisma as any).internshipApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const header = [
    "ID",
    "Tanggal",
    "Nama",
    "WhatsApp",
    "Email",
    "Sekolah/Kampus",
    "Jurusan",
    "Jenjang",
    "Tipe Magang",
    "Bidang Minat",
    "Periode Mulai",
    "Durasi",
    "Portfolio/CV",
    "Pesan",
    "Status",
    "Sheet Synced At",
    "Sheet Sync Error",
  ];
  const lines = [
    header.map(csvCell).join(","),
    ...rows.map((item: any) =>
      [
        item.id,
        item.createdAt?.toISOString?.() ?? item.createdAt,
        item.fullName,
        item.phoneNumber,
        item.email,
        item.institutionName,
        item.major,
        item.educationLevel,
        item.internshipType,
        item.interestField,
        item.startPeriod,
        item.duration,
        item.portfolioUrl,
        item.message,
        item.status,
        item.sheetSyncedAt?.toISOString?.() ?? "",
        item.sheetSyncError,
      ].map(csvCell).join(","),
    ),
  ];

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="pendaftaran-magang.csv"`,
    },
  });
}
