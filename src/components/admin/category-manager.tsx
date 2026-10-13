"use client";

import { useState, type FormEvent } from "react";
import { createCategory, updateCategory, toggleCategoryActive, deleteCategory } from "@/app/(fr)/admin/categories/actions";
import { getAdminTexts } from "@/i18n/admin";
import { Pill, Section, TableCard } from "@/components/dashboard/pro";
import type { Locale } from "@/i18n/dictionaries";

type Category = {
  id: string;
  slug: string;
  name_fr: string;
  name_en: string;
  position: number;
  is_active: boolean;
};

export function CategoryManager({ categories: initial, locale }: { categories: Category[]; locale: Locale }) {
  const t = getAdminTexts(locale).categoriesPage;
  const [categories, setCategories] = useState<Category[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  function errMsg(code: string) {
    if (code === "invalid_slug") return t.errorSlug;
    if (code === "name_required") return t.errorName;
    return t.errorSave;
  }

  async function handleUpdate(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setBusy(id);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await updateCategory(fd);
    if (result.error) { setError(errMsg(result.error)); setBusy(null); return; }
    const slug = String(fd.get("slug"));
    const name_fr = String(fd.get("name_fr"));
    const name_en = String(fd.get("name_en"));
    const position = Number(fd.get("position"));
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, slug, name_fr, name_en, position } : c))
    );
    setEditingId(null);
    setBusy(null);
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("new");
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await createCategory(fd);
    if (result.error) { setError(errMsg(result.error)); setBusy(null); return; }
    (e.currentTarget as HTMLFormElement).reset();
    setShowNew(false);
    setBusy(null);
    window.location.reload();
  }

  async function handleToggle(id: string, current: boolean) {
    setBusy(id + "-toggle");
    setError(null);
    const result = await toggleCategoryActive(id, !current);
    if (result.error) { setError(t.errorSave); setBusy(null); return; }
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c)));
    setBusy(null);
  }

  async function handleDelete(id: string) {
    if (!confirm(t.deleteConfirm)) return;
    setBusy(id + "-del");
    setError(null);
    const result = await deleteCategory(id);
    if (result.error) { setError(t.errorSave + " (" + result.error + ")"); setBusy(null); return; }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setBusy(null);
  }

  const inputCls = "input";
  const btnPrimary = "btn-primary btn-sm disabled:opacity-60";
  const btnSecondary = "btn-ghost btn-sm";

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="notice notice-danger mb-6">{error}</p>
      )}

      <TableCard>
          <thead>
            <tr>
              <th>{t.colNameFr} / {t.colNameEn}</th>
              <th>{t.colSlug}</th>
              <th className="text-center">{t.colPosition}</th>
              <th className="text-center">{t.colActive}</th>
              <th className="text-right">{t.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                {editingId === cat.id ? (
                  <td colSpan={5}>
                    <form onSubmit={(e) => handleUpdate(e, cat.id)} className="flex flex-wrap items-end gap-3">
                      <input type="hidden" name="id" value={cat.id} />
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[var(--subtle)]">{t.colNameFr}</label>
                        <input name="name_fr" defaultValue={cat.name_fr} required className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[var(--subtle)]">{t.colNameEn}</label>
                        <input name="name_en" defaultValue={cat.name_en} required className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-[var(--subtle)]">{t.colSlug}</label>
                        <input name="slug" defaultValue={cat.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" className={inputCls} />
                      </div>
                      <div className="flex flex-col gap-1 w-20">
                        <label className="text-xs text-[var(--subtle)]">{t.colPosition}</label>
                        <input type="number" name="position" defaultValue={cat.position} min={0} className={inputCls} />
                      </div>
                      <div className="flex gap-2 pb-0.5">
                        <button type="submit" disabled={busy === cat.id} className={btnPrimary}>
                          {busy === cat.id ? t.saving : t.save}
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className={btnSecondary}>{t.cancel}</button>
                      </div>
                    </form>
                  </td>
                ) : (
                  <>
                    <td>
                      <p className="font-medium">{cat.name_fr}</p>
                      <p className="text-xs text-[var(--subtle)]">{cat.name_en}</p>
                    </td>
                    <td className="font-mono text-xs text-[var(--subtle)]">{cat.slug}</td>
                    <td className="text-center text-[var(--subtle)]">{cat.position}</td>
                    <td className="text-center">
                      <button
                        onClick={() => handleToggle(cat.id, cat.is_active)}
                        disabled={busy === cat.id + "-toggle"}
                        className="disabled:opacity-50"
                      >
                        <Pill tone={cat.is_active ? "success" : "neutral"}>
                          {cat.is_active ? "✓" : "—"}
                        </Pill>
                      </button>
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(cat.id)} className={btnSecondary}>{t.edit}</button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={!!busy}
                          className="btn-ghost btn-sm text-[var(--tone-danger-fg)] disabled:opacity-40"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
      </TableCard>

      {/* New category */}
      <Section title={t.newTitle}>
        {showNew ? (
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--subtle)]">{t.colNameFr}</label>
              <input name="name_fr" required placeholder="Design graphique" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--subtle)]">{t.colNameEn}</label>
              <input name="name_en" required placeholder="Graphic design" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--subtle)]">{t.colSlug}</label>
              <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder={t.slugHint} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1 w-20">
              <label className="text-xs text-[var(--subtle)]">{t.colPosition}</label>
              <input type="number" name="position" defaultValue={categories.length + 1} min={0} className={inputCls} />
            </div>
            <div className="flex gap-2 pb-0.5">
              <button type="submit" disabled={busy === "new"} className={btnPrimary}>
                {busy === "new" ? t.creating : t.create}
              </button>
              <button type="button" onClick={() => setShowNew(false)} className={btnSecondary}>{t.cancel}</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowNew(true)} className={btnPrimary}>+ {t.newTitle}</button>
        )}
      </Section>
    </div>
  );
}
