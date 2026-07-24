import { LinkIcon, SaveIcon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";
import { SaveToast } from "@/components/SaveToast";
import { SeoFields } from "@/components/SeoFields";
import { saveArticleCategory } from "@/lib/actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export function ArticleCategoryForm({ item, saved = false }: { item?: Category | null; saved?: boolean }) {
  const previewUrl = item?.slug ? `/kategori/${item.slug}` : null;

  return (
    <>
      <SaveToast show={saved} />
      <form action={saveArticleCategory} className="panel grid gap-4 p-5">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Nama kategori
            <input name="name" defaultValue={item?.name} required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            <span className="flex items-center gap-2">
              Slug
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-normal text-[var(--primary)] hover:underline"
                  title="Buka halaman kategori di tab baru"
                >
                  <HugeIcon icon={LinkIcon} size={12} aria-hidden />
                  Open New Tab
                </a>
              )}
            </span>
            <input name="slug" defaultValue={item?.slug} placeholder="otomatis jika kosong" />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Deskripsi
          <textarea name="description" rows={4} defaultValue={item?.description ?? ""} />
        </label>
        <SeoFields defaultTitle={item?.metaTitle} defaultDescription={item?.metaDescription} previewUrl={previewUrl ?? undefined} />
        <button className="button w-fit" type="submit">
          <HugeIcon icon={SaveIcon} size={16} aria-hidden />
          Simpan Perubahan
        </button>
      </form>
    </>
  );
}
