import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { emitNotification } from "@/lib/notifications";
import { syncInternshipApplicationToSheet } from "@/lib/internship-sheets";
import { isTrustedMutationRequest } from "@/lib/request-security";

const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Nama minimal 2 karakter").max(150),
  email: z.string().trim().email("Email tidak valid").max(150),
  phoneNumber: z.string().trim().regex(/^[0-9+\s-]{8,20}$/, "Nomor WhatsApp tidak valid"),
  institutionName: z.string().trim().min(2, "Asal sekolah/kampus wajib diisi").max(150),
  major: z.string().trim().max(150).optional(),
  educationLevel: z.enum(["SMK", "D3", "D4", "S1", "UMUM"]),
  internshipType: z.enum(["ONSITE", "REMOTE", "HYBRID"]),
  interestField: z.string().trim().min(2, "Bidang minat wajib diisi").max(150),
  startPeriod: z.string().trim().max(64).optional(),
  duration: z.string().trim().max(64).optional(),
  portfolioUrl: z.string().trim().url("URL portfolio/CV tidak valid").max(500).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional(),
});

export async function POST(req: Request) {
  try {
    if (!isTrustedMutationRequest(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const limit = rateLimit({
      key: `internship:${getClientIp(req)}`,
      limit: 6,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak pendaftaran dari koneksi ini. Coba lagi nanti." },
        { status: 429 },
      );
    }

    const payload = await req.json();
    const validation = applicationSchema.safeParse(payload);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Data tidak valid.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = validation.data;
    const application = await (prisma as any).internshipApplication.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        institutionName: data.institutionName,
        major: data.major || null,
        educationLevel: data.educationLevel,
        internshipType: data.internshipType,
        interestField: data.interestField,
        startPeriod: data.startPeriod || null,
        duration: data.duration || null,
        portfolioUrl: data.portfolioUrl || null,
        message: data.message || null,
      },
    });

    await emitNotification({
      type: "INTERNSHIP_NEW",
      title: "Pendaftaran Magang Baru",
      message: `${application.fullName} mendaftar magang bidang ${application.interestField}.`,
      link: `/dashboard/internship-applications?q=${encodeURIComponent(application.phoneNumber)}`,
      entityType: "internshipApplication",
      entityId: application.id,
    });

    try {
      const syncResult = await syncInternshipApplicationToSheet(application);
      if (syncResult.ok) {
        await (prisma as any).internshipApplication.update({
          where: { id: application.id },
          data: { sheetSyncedAt: new Date(), sheetSyncError: null },
        });
      } else if (syncResult.reason) {
        await (prisma as any).internshipApplication.update({
          where: { id: application.id },
          data: { sheetSyncError: syncResult.reason },
        });
      }
    } catch (error: any) {
      await (prisma as any).internshipApplication.update({
        where: { id: application.id },
        data: { sheetSyncError: error?.message || "Gagal sync ke Google Sheets." },
      });
    }

    return NextResponse.json({ ok: true, id: application.id }, { status: 201 });
  } catch (error) {
    console.error("Internship application error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." },
      { status: 500 },
    );
  }
}
