import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const BLOG_PAGE_SIZE = 12;

export type BlogArchivePost = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  category: { name: string } | null;
};

export type BlogArchivePage = {
  posts: BlogArchivePost[];
  page: number;
  totalPages: number;
  totalPosts: number;
};

export const getBlogArchivePage = unstable_cache(
  async (requestedPage: number): Promise<BlogArchivePage> => {
    const page = Math.max(1, Math.floor(requestedPage));
    const [posts, totalPosts] = await Promise.all([
      (prisma as any).article.findMany({
        where: { type: "POST", isPublished: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * BLOG_PAGE_SIZE,
        take: BLOG_PAGE_SIZE,
        select: {
          title: true,
          slug: true,
          excerpt: true,
          content: true,
          featuredImage: true,
          publishedAt: true,
          createdAt: true,
          category: { select: { name: true } },
        },
      }),
      (prisma as any).article.count({
        where: { type: "POST", isPublished: true },
      }),
    ]);

    return {
      posts,
      page,
      totalPages: Math.max(1, Math.ceil(totalPosts / BLOG_PAGE_SIZE)),
      totalPosts,
    };
  },
  ["public-blog-archive"],
  { revalidate: 300 },
);
