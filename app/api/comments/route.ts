import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isRequestBodyWithinLimit, isTrustedMutationRequest } from "@/lib/request-security";

const commentSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().email("Email tidak valid").max(150),
  body: z.string().trim().min(3, "Komentar minimal 3 karakter").max(2000, "Komentar terlalu panjang"),
  articleId: z.string().trim().min(1, "Artikel ID diperlukan").max(50),
});

// GET: Fetch comments for an article
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json({ error: "Artikel ID diperlukan" }, { status: 400 });
    }

    const comments = await (prisma as any).comment.findMany({
      where: {
        articleId,
        isApproved: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        name: true,
        body: true,
        articleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Gagal memuat komentar" }, { status: 500 });
  }
}

// POST: Submit a new comment
export async function POST(request: Request) {
  try {
    if (!isTrustedMutationRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!isRequestBodyWithinLimit(request, 16 * 1024)) {
      return NextResponse.json({ error: "Payload terlalu besar" }, { status: 413 });
    }
    const limit = rateLimit({
      key: `comment:${getClientIp(request)}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });

    if (!limit.allowed) {
      return NextResponse.json({ error: "Terlalu banyak komentar dari koneksi ini. Coba lagi nanti." }, { status: 429 });
    }

    const body = await request.json();
    const validation = commentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }

    const { name, email, body: content, articleId } = validation.data;
    const article = await (prisma as any).article.findUnique({
      where: { id: articleId },
      select: { id: true, isPublished: true },
    });

    if (!article?.isPublished) {
      return NextResponse.json({ error: "Artikel tidak ditemukan atau belum dipublikasikan." }, { status: 404 });
    }

    const comment = await (prisma as any).comment.create({
      data: {
        name,
        email,
        body: content,
        articleId,
        isApproved: false, // Default to pending approval
        status: "PENDING",
      },
      select: {
        id: true,
        name: true,
        body: true,
        articleId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ comment, message: "Komentar telah dikirim dan menunggu persetujuan." }, { status: 201 });
  } catch (error) {
    console.error("Error submitting comment:", error);
    return NextResponse.json({ error: "Gagal mengirim komentar" }, { status: 500 });
  }
}
