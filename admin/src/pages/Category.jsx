import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import { FiEdit, FiLayers, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import CategoryServices from "@/services/CategoryServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";
import { CATEGORY_ICONS, CategoryIcon } from "@/utils/categoryIcons";
import { slugify } from "@/services/adapters";
import useAutoRefresh from "@/hooks/useAutoRefresh";

const EMPTY = { id: null, name: "", slug: "", icon: "cart", displayOrder: 0, active: true };

const Category = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  // Filters the icon picker: 29 monochrome glyphs is a hunt, not a choice.
  const [iconQuery, setIconQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await CategoryServices.getAllCategory());
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Coming back to the tab is the refresh - see the hook.
  useAutoRefresh(load);

  const openAdd = () => {
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (row) =>
    setForm({
      id: row._id,
      name: row.name?.en || "",
      slug: row.slug || "",
      icon: row.icon || "cart",
      displayOrder: row.displayOrder ?? 0,
      active: row.status !== "hide",
    }) || setModalOpen(true);

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      icon: form.icon,
      displayOrder: Number(form.displayOrder) || 0,
      status: form.active ? "show" : "hide",
    };
    try {
      if (form.id) {
        await CategoryServices.updateCategory(form.id, body);
        notifySuccess("Catégorie mise à jour.");
      } else {
        await CategoryServices.addCategory(body);
        notifySuccess("Catégorie créée.");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (row) => {
    try {
      await CategoryServices.updateStatus(row._id, {
        status: row.status === "show" ? "hide" : "show",
      });
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await CategoryServices.deleteCategory(deleteTarget._id);
      notifySuccess("Catégorie désactivée.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  // Plain elements: the Windmill <Input> theme base (h-12 / px-3 / bg-gray-100) has the
  // same specificity as these utilities, so the grey 48px field kept winning.
  const inputCls =
    "form-input w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500";

  const labelCls =
    "mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300";

  // Written out rather than derived from inputCls: that string carries `px-3`, and stacking
  // `pl-9` on top left the padding decided by stylesheet order — which is how the search
  // icon ended up sitting on the placeholder text.
  const iconFilterCls =
    "w-full h-9 rounded-lg border border-gray-200 bg-white pl-9 pr-8 text-xs text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500";

  // Same control styling as the products list (a plain input: the Windmill Input theme base
  // forces h-12/px-3/bg-gray-100 and would fight these utilities).
  const controlCls =
    "w-full h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500 dark:hover:border-gray-500";

  // The whole list comes back in one call, so the filter is client-side and instant.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        (row.name?.en || "").toLowerCase().includes(q) ||
        (row.slug || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>{t("Category")}</PageTitle>
        <Button onClick={openAdd} className="h-11 rounded-lg">
          <FiPlus className="mr-2" /> Ajouter une catégorie
        </Button>
      </div>

      {/* filters - mirrors the products list */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className={`${controlCls} pl-10 ${search ? "pr-10" : "pr-3"}`}
            placeholder="Rechercher une catégorie…"
            aria-label="Rechercher une catégorie"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Effacer la recherche"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiLayers}
          title="Aucune catégorie"
          description="Créez votre première catégorie pour organiser le catalogue."
          actionLabel="Ajouter une catégorie"
          onAction={openAdd}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FiSearch}
          title="Aucune catégorie ne correspond"
          description={`Nothing found for “${search}”. Try another name or slug.`}
          actionLabel="Effacer la recherche"
          onAction={() => setSearch("")}
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Catégorie</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Produits</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row._id}>
                  {/* icon tile + name in one cell, like the product thumbnail + title */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CategoryIcon icon={row.icon} className="h-5 w-5" />
                      </span>
                      <span className="font-medium">{row.name?.en}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{row.slug}</TableCell>
                  <TableCell>{row.productCount}</TableCell>
                  <TableCell>
                    <button onClick={() => toggle(row)}>
                      <Badge type={row.status === "show" ? "success" : "neutral"}>
                        {row.status === "show" ? "Active" : "Inactive"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-gray-400">
                      <button
                        className="transition hover:text-emerald-600"
                        onClick={() => openEdit(row)}
                        title="Modifier"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="transition hover:text-red-500"
                        onClick={() => setDeleteTarget(row)}
                        title="Supprimer"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add / edit modal with icon picker */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Modifier la catégorie" : "Nouvelle catégorie"}
        subtitle="L’icône et le nom sont ce que le client voit en boutique."
        icon={FiLayers}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="h-11 rounded-lg px-5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 rounded-lg bg-emerald-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : form.id ? "Enregistrer" : "Créer la catégorie"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* The storefront tile, live. Choosing an icon is a visual decision, so the choice
              is shown as the customer will actually see it rather than as a form value. */}
          <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-400">
              <CategoryIcon icon={form.icon} className="h-8 w-8" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-gray-800 dark:text-gray-100">
                {form.name || "Nom de la catégorie"}
              </p>
              {/* A bare "/search?category=…" told the reader nothing before a name is typed.
                  The line keeps its height either way so the card does not jump. */}
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                {form.slug || slugify(form.name) ? (
                  <>/search?category={form.slug || slugify(form.name)}</>
                ) : (
                  <span className="italic text-gray-400">
                    L&apos;adresse en boutique s&apos;affichera ici.
                  </span>
                )}
              </p>
            </div>
          </div>

          <label className="block text-sm">
            <span className={labelCls}>
              Nom <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Huiles &amp; condiments"
              required
            />
          </label>

          {/* Icon picker: filterable, and the current choice is named rather than left to a
              tooltip nobody hovers. */}
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className={`${labelCls} mb-0`}>Icône</span>
              <span className="text-xs text-gray-400">
                {CATEGORY_ICONS.find((i) => i.key === form.icon)?.label || "—"}
              </span>
            </div>

            <div className="relative mb-2">
              {/* left-3.5, not left-3: this project overrides Tailwind's inset scale in
                  tailwind.config.js, where `3` means 3rem (48px), not 0.75rem. That is what
                  pushed the magnifier into the middle of the placeholder. The half-step
                  values are untouched, so they still mean what they say. */}
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                // This field lives inside the category form: without this, Enter submitted
                // the form and created the category while the user was only filtering icons.
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
                placeholder="Filtrer les icônes…"
                aria-label="Filtrer les icônes"
                className={iconFilterCls}
              />
              {iconQuery && (
                <button
                  type="button"
                  onClick={() => setIconQuery("")}
                  aria-label="Effacer le filtre"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="gm-thin-scroll grid max-h-44 grid-cols-8 gap-1.5 overflow-y-auto rounded-xl border border-gray-100 p-2 dark:border-gray-700 sm:grid-cols-10">
              {CATEGORY_ICONS.filter(({ label, key }) => {
                const q = iconQuery.trim().toLowerCase();
                return !q || label.toLowerCase().includes(q) || key.includes(q);
              }).map(({ key, label, Icon }) => (
                <button
                  type="button"
                  key={key}
                  title={label}
                  aria-label={label}
                  aria-pressed={form.icon === key}
                  onClick={() => setForm({ ...form, icon: key })}
                  className={`grid h-9 w-9 place-items-center rounded-lg transition ${
                    form.icon === key
                      ? "bg-emerald-100 text-emerald-600 ring-2 ring-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className={labelCls}>Slug</span>
              <input
                type="text"
                className={inputCls}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={slugify(form.name) || "généré depuis le nom"}
              />
              <span className="mt-1 block text-xs text-gray-400">
                Laissez vide pour le déduire du nom.
              </span>
            </label>
            <label className="block text-sm">
              <span className={labelCls}>Ordre d’affichage</span>
              <input
                type="number"
                className={inputCls}
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
              />
              <span className="mt-1 block text-xs text-gray-400">
                Le plus petit passe en premier en boutique.
              </span>
            </label>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 transition-colors hover:border-gray-200 dark:border-gray-700 dark:bg-gray-700/30">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
            />
            <span className="text-sm">
              <span className="block font-medium text-gray-700 dark:text-gray-200">
                Catégorie active
              </span>
              <span className="block text-xs leading-5 text-gray-500 dark:text-gray-400">
                {form.active
                  ? "Visible dans le menu et les filtres de la boutique."
                  : "Masquée : ses produits restent en ligne mais la catégorie disparaît."}
              </span>
            </span>
          </label>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la catégorie"
        icon={FiTrash2}
        footer={
          <>
            <Button layout="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button className="!bg-red-500 hover:!bg-red-600" onClick={confirmDelete}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Deactivate <span className="font-semibold">{deleteTarget?.name?.en}</span>? Products
          keep their category link.
        </p>
      </Modal>
    </>
  );
};

export default Category;
