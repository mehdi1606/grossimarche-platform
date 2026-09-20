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
import { FiEdit, FiImage, FiLayers, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import CategoryServices from "@/services/CategoryServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";
import { CategoryIcon } from "@/utils/categoryIcons";
import { slugify } from "@/services/adapters";
import useAutoRefresh from "@/hooks/useAutoRefresh";

const EMPTY = {
  id: null,
  name: "",
  slug: "",
  imageUrl: "",
  displayOrder: 0,
  active: true,
};

const Category = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");

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
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setImageFile(null);
    setForm({
      id: row._id,
      name: row.name?.en || "",
      slug: row.slug || "",
      imageUrl: row.imageUrl || "",
      displayOrder: row.displayOrder ?? 0,
      active: row.status !== "hide",
    });
    setModalOpen(true);
  };

  // The tile shows the file being uploaded before it is uploaded; falls back to the stored
  // picture when the form is reopened.
  const preview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : form.imageUrl),
    [imageFile, form.imageUrl]
  );

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    const body = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      imageUrl: form.imageUrl,
      displayOrder: Number(form.displayOrder) || 0,
      status: form.active ? "show" : "hide",
    };
    try {
      let categoryId = form.id;
      if (form.id) {
        await CategoryServices.updateCategory(form.id, body);
      } else {
        // The upload endpoint takes an id, so a new category is saved first and its picture
        // attached to the row that now exists.
        const created = await CategoryServices.addCategory(body);
        categoryId = created?.id;
      }
      if (imageFile && categoryId) {
        await CategoryServices.uploadImage(categoryId, imageFile);
      }
      notifySuccess(form.id ? "Catégorie mise à jour." : "Catégorie créée.");
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
                        {row.imageUrl ? (
                          <img
                            src={row.imageUrl}
                            alt=""
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <CategoryIcon icon={row.icon} className="h-5 w-5" />
                        )}
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
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-400">
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <FiImage className="h-7 w-7 text-gray-300" />
              )}
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

          {/* The picture replaces the pictogram: a photograph of the aisle tells a shopkeeper
              more than a line drawing, and it is what the storefront tiles now show. */}
          <div>
            <span className={labelCls}>Image de la catégorie</span>
            <label className="group relative grid h-40 w-full cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition hover:border-emerald-300 hover:text-emerald-500 dark:border-gray-600 dark:bg-gray-700/40">
              {preview ? (
                <>
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 hidden items-center justify-center bg-gray-900/50 text-xs font-medium text-white group-hover:flex">
                    Remplacer
                  </span>
                </>
              ) : (
                <span className="flex flex-col items-center gap-1.5 px-6 text-center">
                  <FiImage className="text-3xl" />
                  <span className="text-sm font-medium">Ajouter une image</span>
                  <span className="text-[11px] leading-4 text-gray-400">
                    PNG, JPG, WebP ou AVIF, 5 Mo max.
                  </span>
                </span>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </label>
            {(imageFile || form.imageUrl) && (
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setForm({ ...form, imageUrl: "" });
                }}
                className="mt-2 text-xs font-medium text-gray-500 underline-offset-2 hover:text-red-500 hover:underline"
              >
                Retirer l&apos;image
              </button>
            )}
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
