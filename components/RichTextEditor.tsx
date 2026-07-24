"use client";

import { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Icon } from "@iconify/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

type MediaItem = {
  id: string;
  title: string;
  alt: string | null;
  filePath: string;
  isPublished: boolean;
};

function normalizeLinkUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function ToolbarButton({
  onClick,
  active = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={active ? "is-active" : ""}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  name,
  defaultValue = "",
  onChange,
}: {
  name: string;
  defaultValue?: string | null;
  onChange?: (html: string) => void;
}) {
  const [htmlValue, setHtmlValue] = useState(defaultValue ?? "");
  const [codeMode, setCodeMode] = useState(false);
  const [codeValue, setCodeValue] = useState(defaultValue ?? "");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaQuery, setMediaQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedAlt, setSelectedAlt] = useState("");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkOpenNewTab, setLinkOpenNewTab] = useState(true);
  const [linkNoFollow, setLinkNoFollow] = useState(false);
  const [linkContextMenu, setLinkContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [tableContextMenu, setTableContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tablePickerHover, setTablePickerHover] = useState<{ rows: number; cols: number } | null>(null);
  const tablePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTablePicker) return;
    function handleClick(e: MouseEvent) {
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target as Node)) {
        setShowTablePicker(false);
        setTablePickerHover(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showTablePicker]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Link.configure({ openOnClick: false, defaultProtocol: "https" }),
      Image,
      Placeholder.configure({ placeholder: "Tulis deskripsi paket di sini..." }),
      Table,
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: defaultValue ?? "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlValue(html);
      onChange?.(html);
    },
    editorProps: {
      handlePaste: (_view, event) => {
        const html = event.clipboardData?.getData("text/html");
        if (html) {
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
  });

  async function openMediaPicker() {
    setMediaOpen(true);
    if (media.length > 0 || mediaLoading) return;

    setMediaLoading(true);
    try {
      const response = await fetch("/api/media", { cache: "no-store" });
      if (!response.ok) throw new Error("Gagal memuat media.");
      const data = (await response.json()) as { items?: MediaItem[] };
      setMedia(data.items ?? []);
    } finally {
      setMediaLoading(false);
    }
  }

  function closeMediaPicker() {
    setMediaOpen(false);
    setSelectedMedia(null);
    setSelectedAlt("");
    setUploadError("");
  }

  function chooseMedia(item: MediaItem) {
    setSelectedMedia(item);
    setSelectedAlt(item.alt || item.title);
  }

  async function uploadMedia(file: File | null) {
    if (!file || uploading) return;

    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("title", uploadTitle || file.name.replace(/\.[^.]+$/, ""));
      formData.append("alt", uploadAlt);

      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as { item?: MediaItem; message?: string };

      if (!response.ok || !data.item) {
        throw new Error(data.message || "Upload gambar gagal.");
      }

      setMedia((current) => [data.item!, ...current]);
      setUploadTitle("");
      setUploadAlt("");
      chooseMedia(data.item);

      // langsung masukkan ke editor tanpa klik tombol lagi
      if (editor) {
        const altText = data.item.alt || data.item.title || "";
        editor.chain().focus().setImage({ src: data.item.filePath, alt: altText }).run();
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload gambar gagal.");
    } finally {
      setUploading(false);
    }
  }

  function insertMediaImage() {
    if (!selectedMedia || !editor) return;
    const alt = selectedAlt || selectedMedia.alt || selectedMedia.title;
    editor.chain().focus().setImage({ src: selectedMedia.filePath, alt }).run();
    closeMediaPicker();
  }

  function openLinkModal() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const attrs = editor.getAttributes("link");
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    setLinkText(selectedText);
    setLinkUrl(attrs.href ?? "");
    setLinkOpenNewTab(attrs.target === "_blank" || !attrs.href);
    setLinkNoFollow(String(attrs.rel ?? "").split(/\s+/).includes("nofollow"));
    setLinkModalOpen(true);
    setLinkContextMenu(null);
  }

  function closeLinkModal() {
    setLinkModalOpen(false);
    setLinkText("");
    setLinkUrl("");
    setLinkOpenNewTab(true);
    setLinkNoFollow(false);
    setLinkContextMenu(null);
  }

  function applyLink() {
    if (!editor) return;

    const url = normalizeLinkUrl(linkUrl);
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      closeLinkModal();
      return;
    }

    const rel = [
      linkOpenNewTab ? "noopener noreferrer" : "",
      linkNoFollow ? "nofollow" : "",
    ].filter(Boolean).join(" ");
    const attrs = {
      href: url,
      target: linkOpenNewTab ? "_blank" : null,
      rel: rel || null,
    };
    const text = linkText.trim();

    if (text) {
      editor.chain().focus().insertContent({
        type: "text",
        text,
        marks: [{ type: "link", attrs }],
      }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink(attrs).run();
    }

    closeLinkModal();
  }

  const filteredMedia = media.filter((item) => {
    const keyword = mediaQuery.trim().toLowerCase();
    if (!keyword) return true;
    return [item.title, item.alt, item.filePath].some((value) => value?.toLowerCase().includes(keyword));
  });

  if (!editor) return null;

  return (
    <div className="tiptap-field relative">
      <input type="hidden" name={name} value={htmlValue} />
      <div className="tiptap-toolbar">
        <ToolbarButton
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph")}
          title="Paragraph"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24">
            <path fill="currentColor" d="M4 10c0 3.31 2.69 6 6 6h2v4h2V6h2v14h2V6h3V4H10c-3.31 0-6 2.69-6 6m8 4h-2c-2.21 0-4-1.79-4-4s1.79-4 4-4h2z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Icon icon="lucide:heading-2" width={16} height={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Icon icon="lucide:heading-3" width={16} height={16} />
        </ToolbarButton>
        <span className="divider" />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <Icon icon="lucide:bold" width={16} height={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <Icon icon="lucide:italic" width={16} height={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
        >
          <Icon icon="lucide:underline" width={16} height={16} />
        </ToolbarButton>
        <span className="divider" />
        <ToolbarButton
          onClick={openLinkModal}
          active={editor.isActive("link")}
          title="Link"
        >
          <Icon icon="lucide:link" width={16} height={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <Icon icon="lucide:list" width={16} height={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered List"
        >
          <Icon icon="lucide:list-ordered" width={16} height={16} />
        </ToolbarButton>
        <span className="divider" />
        <div className="relative" ref={tablePickerRef}>
          <button
            type="button"
            onClick={() => setShowTablePicker(!showTablePicker)}
            className={["inline-flex h-[34px] items-center gap-1 rounded-lg border px-3 text-xs font-bold transition", showTablePicker ? "border-[var(--primary)] bg-[var(--primary-softer)] text-[var(--primary)]" : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"].join(" ")}
            title="Insert Table"
          >
            <Icon icon="lucide:table" width={16} height={16} />
            Tabel
          </button>
          {showTablePicker && (
            <div
              className="absolute top-full left-0 z-[70] mt-1 rounded-xl border border-[var(--line)] bg-white p-3 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid gap-0.5">
                {[...Array(8)].map((_, rowIdx) => (
                  <div key={rowIdx} className="flex gap-0.5">
                    {[...Array(8)].map((_, colIdx) => (
                      <div
                        key={`${rowIdx}-${colIdx}`}
                        className={["w-5 h-5 rounded-sm border transition-colors cursor-pointer", tablePickerHover && rowIdx < tablePickerHover.rows && colIdx < tablePickerHover.cols ? "border-[var(--primary)] bg-[var(--primary)]/20" : "border-[var(--line)] bg-white hover:border-[var(--primary)]"].join(" ")}
                        onMouseEnter={() => setTablePickerHover({ rows: rowIdx + 1, cols: colIdx + 1 })}
                        onClick={() => {
                          editor.chain().focus().insertTable({ rows: rowIdx + 1, cols: colIdx + 1, withHeaderRow: true }).run();
                          setShowTablePicker(false);
                          setTablePickerHover(null);
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-center text-xs text-[var(--muted)]">
                {tablePickerHover ? `${tablePickerHover.rows} × ${tablePickerHover.cols}` : "Pilih ukuran tabel"}
              </div>
            </div>
          )}
        </div>
        <span className="divider" />
        <ToolbarButton
          onClick={() => editor.chain().focus().addRowAfter().run()}
          active={false}
          title="Add Row"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          active={false}
          title="Add Column"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().deleteTable().run()}
          active={false}
          title="Delete Table"
        >
          <Icon icon="lucide:trash-2" width={16} height={16} />
        </ToolbarButton>
        <span className="divider" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Icon icon="lucide:undo" width={16} height={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Icon icon="lucide:redo" width={16} height={16} />
        </ToolbarButton>
        <span className="divider" />
        <button
          type="button"
          onClick={openMediaPicker}
          title="Insert Image"
          className="inline-flex h-[34px] items-center gap-1 rounded-lg border border-[var(--line)] bg-white px-3 text-xs font-bold text-[var(--foreground)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
        >
          <Icon icon="lucide:image" width={15} height={15} />
          Gambar
        </button>
        <span className="divider" />
        <button
          type="button"
          onClick={() => {
            if (codeMode) {
              // Switch back to visual: apply code to editor
              editor.commands.setContent(codeValue);
              setHtmlValue(codeValue);
              onChange?.(codeValue);
            } else {
              // Switch to code: get current HTML
              setCodeValue(editor.getHTML());
            }
            setCodeMode(!codeMode);
          }}
          title={codeMode ? "Visual Editor" : "Code Editor"}
          className={["inline-flex h-[34px] items-center gap-1 rounded-lg border px-3 text-xs font-bold transition", codeMode ? "border-[var(--primary)] bg-[var(--primary-softer)] text-[var(--primary)]" : "border-[var(--line)] bg-white text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]"].join(" ")}
        >
          <Icon icon="lucide:code-2" width={15} height={15} />
          {codeMode ? "Visual" : "Code"}
        </button>
      </div>
      {codeMode ? (
        <textarea
          value={codeValue}
          onChange={(e) => {
            setCodeValue(e.target.value);
            setHtmlValue(e.target.value);
            onChange?.(e.target.value);
          }}
          spellCheck={false}
          className="w-full min-h-[300px] max-h-[500px] overflow-y-auto border border-[var(--line)] rounded-b-xl p-4 font-mono text-sm text-[var(--foreground)] bg-[#1e1e2e] text-[#e4e4e7] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-y"
        />
      ) : (
        <div
          className="tiptap-editor"
          onContextMenu={(event) => {
            const hasSelection = !editor.state.selection.empty;
            const isLink = editor.isActive("link");
            const isTable = editor.isActive("table");

            if (isTable) {
              event.preventDefault();
              setTableContextMenu({ x: event.clientX, y: event.clientY });
              return;
            }

            if (!hasSelection && !isLink) return;

            event.preventDefault();
            setLinkContextMenu({ x: event.clientX, y: event.clientY });
          }}
          onMouseDown={() => { setLinkContextMenu(null); setTableContextMenu(null); }}
        >
          <EditorContent editor={editor} />
        </div>
      )}

      {linkContextMenu ? (
        <div
          className="fixed z-[60] min-w-44 rounded-xl border border-[var(--line)] bg-white p-1 shadow-xl"
          style={{ left: linkContextMenu.x, top: linkContextMenu.y }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={openLinkModal}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]"
          >
            <Icon icon="lucide:link" width={15} height={15} />
            {editor.isActive("link") ? "Edit Link" : "Tambah Link"}
          </button>
        </div>
      ) : null}

      {tableContextMenu ? (
        <div
          className="fixed z-[60] min-w-52 rounded-xl border border-[var(--line)] bg-white p-1 shadow-xl"
          style={{ left: tableContextMenu.x, top: tableContextMenu.y }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => { editor.chain().focus().addRowBefore().run(); setTableContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>
            Tambah Baris di Atas
          </button>
          <button
            type="button"
            onClick={() => { editor.chain().focus().addRowAfter().run(); setTableContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>
            Tambah Baris di Bawah
          </button>
          <div className="mx-2 my-1 border-t border-[var(--line)]" />
          <button
            type="button"
            onClick={() => { editor.chain().focus().addColumnBefore().run(); setTableContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>
            Tambah Kolom di Kiri
          </button>
          <button
            type="button"
            onClick={() => { editor.chain().focus().addColumnAfter().run(); setTableContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--primary-softer)] hover:text-[var(--primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>
            Tambah Kolom di Kanan
          </button>
          <div className="mx-2 my-1 border-t border-[var(--line)]" />
          <button
            type="button"
            onClick={() => { editor.chain().focus().deleteRow().run(); setTableContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
          >
            <Icon icon="lucide:trash-2" width={15} height={15} />
            Hapus Baris
          </button>
          <button
            type="button"
            onClick={() => { editor.chain().focus().deleteColumn().run(); setTableContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
          >
            <Icon icon="lucide:trash-2" width={15} height={15} />
            Hapus Kolom
          </button>
          <div className="mx-2 my-1 border-t border-[var(--line)]" />
          <button
            type="button"
            onClick={() => { editor.chain().focus().deleteTable().run(); setTableContextMenu(null); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 transition hover:bg-red-50"
          >
            <Icon icon="lucide:trash-2" width={15} height={15} />
            Hapus Tabel
          </button>
        </div>
      ) : null}

      {linkModalOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLinkModal();
            }
          }}
        >
          <div
            className="panel w-full max-w-md bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[var(--brand)]">Editor</p>
                <h2 className="text-xl font-black text-[var(--foreground)]">Tambahkan Link</h2>
              </div>
              <button
                type="button"
                onClick={closeLinkModal}
                className="grid h-9 w-9 place-items-center rounded-full border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                aria-label="Tutup modal link"
              >
                <Icon icon="lucide:x" width={17} height={17} />
              </button>
            </div>

            <label className="mt-5 grid gap-2 text-sm font-semibold">
              Teks link
              <input
                value={linkText}
                onChange={(event) => setLinkText(event.target.value)}
                placeholder="Teks yang akan ditampilkan"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyLink();
                  }
                }}
              />
            </label>

            <label className="mt-4 grid gap-2 text-sm font-semibold">
              URL tujuan
              <input
                autoFocus
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://contoh.com/halaman"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyLink();
                  }
                }}
              />
            </label>

            <div className="mt-4 grid gap-2">
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="!h-4 !w-4 accent-[var(--primary)]"
                  checked={linkOpenNewTab}
                  onChange={(event) => setLinkOpenNewTab(event.target.checked)}
                />
                <span>Buka di tab baru</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="!h-4 !w-4 accent-[var(--primary)]"
                  checked={linkNoFollow}
                  onChange={(event) => setLinkNoFollow(event.target.checked)}
                />
                <span>Tambahkan nofollow</span>
              </label>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeLinkModal} className="button secondary">
                Batal
              </button>
              {editor.isActive("link") ? (
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().extendMarkRange("link").unsetLink().run();
                    closeLinkModal();
                  }}
                  className="button secondary"
                >
                  Hapus Link
                </button>
              ) : null}
              <button type="button" onClick={applyLink} className="button">
                Simpan Link
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mediaOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMediaPicker();
            }
          }}
        >
          <div className="panel max-h-[82vh] w-full max-w-3xl overflow-hidden bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] p-4">
              <div>
                <p className="text-sm font-bold text-[var(--brand)]">Media</p>
                <h2 className="text-xl font-bold">{selectedMedia ? "Preview gambar" : "Pilih gambar"}</h2>
              </div>
              <button
                type="button"
                onClick={closeMediaPicker}
                className="relative z-10 rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-bold transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                Tutup
              </button>
            </div>

            <div>
              {selectedMedia ? (
                <div className="custom-scrollbar max-h-[68vh] overflow-y-auto p-4">
                  <button
                    type="button"
                    onClick={() => setSelectedMedia(null)}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]"
                  >
                    <Icon icon="lucide:arrow-left" width={16} height={16} />
                    Ganti gambar
                  </button>
                  <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--primary-softer)]">
                      <img src={selectedMedia.filePath} alt={selectedAlt || selectedMedia.title} className="max-h-[360px] w-full object-contain" />
                    </div>
                    <div className="grid content-start gap-4">
                      <div>
                        <p className="text-sm font-bold text-[var(--foreground)]">{selectedMedia.title}</p>
                        <p className="mt-1 break-all text-xs text-[var(--muted)]">{selectedMedia.filePath}</p>
                      </div>
                      <label className="grid gap-2 text-sm font-semibold">
                        ALT gambar
                        <input
                          value={selectedAlt}
                          onChange={(event) => setSelectedAlt(event.target.value)}
                          placeholder="Deskripsi singkat gambar"
                        />
                      </label>
                      <button type="button" onClick={insertMediaImage} className="button w-full">
                        Masukkan ke editor
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 border-b border-[var(--line)] p-4 md:grid-cols-[1fr_260px]">
                    <label className="relative block">
                      <HugeIcon icon={Search01Icon} size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        value={mediaQuery}
                        onChange={(event) => setMediaQuery(event.target.value)}
                        placeholder="Cari media..."
                        className="!pl-11"
                      />
                    </label>
                    <label className="inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white px-4 text-sm font-bold transition hover:border-[var(--primary)] hover:text-[var(--primary)]">
                      <Icon icon="lucide:upload" width={16} height={16} />
                      {uploading ? "Mengupload..." : "Upload gambar"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        className="sr-only"
                        disabled={uploading}
                        onChange={(event) => {
                          void uploadMedia(event.target.files?.[0] ?? null);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    <input
                      value={uploadTitle}
                      onChange={(event) => setUploadTitle(event.target.value)}
                      placeholder="Judul upload, opsional"
                      className="md:col-start-2"
                    />
                    <input
                      value={uploadAlt}
                      onChange={(event) => setUploadAlt(event.target.value)}
                      placeholder="ALT upload, opsional"
                      className="md:col-start-2"
                    />
                    {uploadError ? <p className="text-sm font-semibold text-[var(--primary)] md:col-span-2">{uploadError}</p> : null}
                  </div>

                  <div className="custom-scrollbar max-h-[46vh] overflow-y-auto p-4">
                    {mediaLoading ? (
                      <p className="rounded-xl border border-[var(--line)] p-5 text-sm text-[var(--muted)]">Memuat media...</p>
                    ) : filteredMedia.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredMedia.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => chooseMedia(item)}
                            className="group overflow-hidden rounded-xl border border-[var(--line)] bg-white text-left transition hover:border-[var(--primary)]"
                          >
                            <img src={item.filePath} alt={item.alt || item.title} className="h-32 w-full bg-[var(--primary-softer)] object-cover" />
                            <span className="block p-3">
                              <span className="block truncate text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">{item.title}</span>
                              <span className="mt-1 block truncate text-xs font-normal text-[var(--muted)]">{item.filePath}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl border border-[var(--line)] p-5 text-sm text-[var(--muted)]">Belum ada gambar yang cocok.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
