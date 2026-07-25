import { slugify } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export type PublicAuthor = {
  id?: string;
  updatedAt?: Date;
  name: string;
  slug: string;
  role: string;
  bio: string;
  initials: string;
  avatarUrl: string;
};

type AuthorSource = {
  id?: string;
  updatedAt?: Date;
  name: string;
  authorSlug?: string | null;
  authorRole?: string | null;
  authorBio?: string | null;
  authorAvatarUrl?: string | null;
};

export const defaultAuthors: PublicAuthor[] = [
  {
    name: "Admin Amoechat",
    slug: slugify("Admin Amoechat"),
    role: "Penulis Amoechat",
    bio: "Penulis Amoechat yang membahas WhatsApp marketing, automation, customer engagement, dan integrasi API untuk bisnis.",
    initials: "A",
    avatarUrl: "",
  },
];

export const defaultAuthor = defaultAuthors[0];

export const authorSettingKeys = [
  "PUBLIC_AUTHOR_NAME",
  "PUBLIC_AUTHOR_ROLE",
  "PUBLIC_AUTHOR_BIO",
  "PUBLIC_AUTHOR_AVATAR_URL",
] as const;

function buildInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";
}

export function toPublicAuthor(source: AuthorSource, fallback: PublicAuthor = defaultAuthor): PublicAuthor {
  const name = source.name?.trim() || fallback.name;
  const slug = source.authorSlug?.trim() || slugify(name) || fallback.slug;
  const role = source.authorRole?.trim() || fallback.role;
  const bio = source.authorBio?.trim() || fallback.bio;
  const avatarUrl = source.authorAvatarUrl?.trim() || fallback.avatarUrl || "";

  return {
    id: source.id,
    updatedAt: source.updatedAt,
    name,
    slug,
    role,
    bio,
    initials: buildInitials(name),
    avatarUrl,
  };
}

async function getDatabaseAuthors(): Promise<PublicAuthor[]> {
  const rows = await (prisma as any).user.findMany({
    where: { isAuthor: true, isActive: true },
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      updatedAt: true,
      name: true,
      authorSlug: true,
      authorRole: true,
      authorBio: true,
      authorAvatarUrl: true,
    },
  });

  return rows.map((row: AuthorSource) => toPublicAuthor(row));
}

export async function getPublicAuthor(): Promise<PublicAuthor> {
  try {
    const authors = await getPublicAuthors();
    return authors[0] || defaultAuthor;
  } catch {
    return defaultAuthor;
  }
}

export async function getPublicAuthors(): Promise<PublicAuthor[]> {
  try {
    const authors = await getDatabaseAuthors();
    if (authors.length > 0) return authors;

    const rows = await (prisma as any).apiSetting.findMany({
      where: { key: { in: [...authorSettingKeys] } },
      select: { key: true, value: true },
    });
    const settings = Object.fromEntries(rows.map((row: { key: string; value: string }) => [row.key, row.value || ""]));
    const name = settings.PUBLIC_AUTHOR_NAME || defaultAuthor.name;

    return [
      {
        name,
        slug: slugify(name),
        role: settings.PUBLIC_AUTHOR_ROLE || defaultAuthor.role,
        bio: settings.PUBLIC_AUTHOR_BIO || defaultAuthor.bio,
        initials: buildInitials(name),
        avatarUrl: settings.PUBLIC_AUTHOR_AVATAR_URL || "",
      },
    ];
  } catch {
    return [defaultAuthor];
  }
}

export async function getAuthorBySlug(slug: string) {
  const authors = await getPublicAuthors();
  return authors.find((author) => author.slug === slug) || null;
}
