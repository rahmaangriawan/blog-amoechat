import "server-only";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type NotificationType = "INTERNSHIP_NEW";

export async function emitNotification(params: { type: NotificationType; title: string; message: string; link?: string; entityType?: string; entityId?: string }) {
  try {
    await (prisma as any).notification.create({ data: params });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
  } catch (error) {
    console.error("Failed to emit notification:", error);
  }
}

export async function getUnreadCountForEmail(email: string): Promise<number> {
  try {
    const user = await (prisma as any).user.findUnique({ where: { email }, select: { lastSeenNotificationAt: true } });
    return await (prisma as any).notification.count({ where: user?.lastSeenNotificationAt ? { createdAt: { gt: user.lastSeenNotificationAt } } : {} });
  } catch { return 0; }
}

export async function markAllNotificationsSeen(email: string) {
  try {
    await (prisma as any).user.update({ where: { email }, data: { lastSeenNotificationAt: new Date() } });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/notifications");
  } catch (error) { console.error("Failed to mark notifications seen:", error); }
}
