import { NextResponse, type NextRequest } from "next/server";
import { clearCmsSession } from "@/lib/auth";
import { isTrustedMutationRequest, publicOrigin } from "@/lib/request-security";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isTrustedMutationRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await clearCmsSession();
  return NextResponse.redirect(new URL("/login", publicOrigin(request)));
}
