import type { Metadata } from "next";
import { DashboardNav } from "@/components/DashboardNav";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getSession, getSessionRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: {
    default: "Dashboard Panel",
    template: "%s | Amoechat Panel",
  },
  description: "Dashboard CMS AMOECHAT untuk mengelola paket, dokumen, dan data pendaftaran.",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, session] = await Promise.all([getSessionRole(), getSession()]);
  if (!role || !session) redirect("/login");
  const resolvedRole = role ?? "MEMBER";

  let displayName = "";
  if (session) {
    try {
      const user = await (prisma as any).user.findUnique({
        where: { email: session.email },
        select: { name: true },
      });
      displayName = user?.name?.trim() || session.email;
    } catch {
      displayName = session.email;
    }
  }

  return (
    <div data-app-shell="private" className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,rgba(8,203,82,0.035)_100%)] pb-24 md:grid md:grid-cols-[280px_1fr] md:pb-0">
      <DashboardNav role={resolvedRole} />
      <div className="flex min-h-screen flex-col">
        <DashboardHeader role={resolvedRole} name={displayName} email={session ? session.email : ""} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
