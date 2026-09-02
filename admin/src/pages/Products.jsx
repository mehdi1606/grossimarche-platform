import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import {
  FiBox,
  FiDollarSign,
  FiEdit,
  FiImage,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import ProductServices from "@/services/ProductServices";
import PriceGridModal from "@/components/pricing/PriceGridModal";
import SegmentPriceEditor from "@/components/pricing/SegmentPriceEditor";
import PricingServices from "@/services/PricingServices";
import ClientTypeServices from "@/services/ClientTypeServices";
import CategoryServices from "@/services/CategoryServices";
import Modal from "@/components/common/Modal";
import FilterDropdown from "@/components/form/selectOption/FilterDropdown";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import TablePagination from "@/components/common/TablePagination";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@/utils/toast";

const LIMIT = 10;
const EMPTY = {
  name: "",
  categoryId: "",
  /**
   * What each segment pays: one row per segment this product is sold to.
   *
   * The old single `price` is gone from the form. Since the storefront resolves every price
   * from the segment grid, that field stopped being anything a customer could see - keeping it
   * on screen said "set the price here" about a number nobody is ever charged.
   */
  typePrices: [],
  /**
   * The internal reference kept in products.price. Only ever read back on edit, so a save
   * returns the value the product already had instead of recomputing one.
   */
  referencePrice: 0,
  unit: "unité",
  stock: 0,
  minOrderQuantity: 1,
  description: "",
  imageUrl: "",
  active: true,
};

const Products = () => {
  const { currency } = useUtilsFunction();
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalDoc, setTotalDoc] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [priceTarget, setPriceTarget] = useState(null);
  const [clientTypes, setClientTypes] = useState([]);
  // The product's full grid as loaded, so saving a base price does not silently wipe the
  // quantity tiers set on the 💲 screen - the grid endpoint replaces everything it is sent.
  const [loadedGrid, setLoadedGrid] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProductServices.getAllProducts({
        page,
        limit: LIMIT,
        category: categoryFilter,
        title: query,
      });
      setRows(res.products || []);
      setTotalDoc(res.totalDoc || 0);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    // Only active segments: a retired one must not be offered as a new row, though a product
    // already priced for it keeps that price until an admin removes it.
    ClientTypeServices.getAll()
      .then((res) => setClientTypes((res || []).filter((t) => t.active)))
      .catch((err) => notifyError(err?.response?.data?.message || err?.message));
  }, []);

  // Debounced search: the table follows what you type instead of waiting for Enter (the
  // form submit below still fires it immediately).
  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    CategoryServices.getAllCategory()
      .then(setCategories)
      // A silent catch here left the filter showing only "All categories" with no clue why.
      .catch((err) =>
        notifyError(
          err?.response?.data?.message || "Categories could not be loaded."
        )
      );
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setLoadedGrid([]);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    setEditingId(row._id);
    setImageFile(null);
    setForm({
      name: row.title?.en || "",
      categoryId: row.category?._id || "",
      // Carried through untouched so saving the product cannot move it (see handleSave).
      referencePrice: row.prices?.price ?? 0,
      typePrices: [],
      unit: row.unit || "unité",
      stock: row.stock ?? 0,
      minOrderQuantity: row.minOrderQuantity ?? 1,
      description: row.description?.en || "",
      imageUrl: row.image?.[0] || "",
      active: row.status !== "hide",
    });
    setLoadedGrid([]);
    setModalOpen(true);
    // The grid is deliberately not loaded here. This screen shows the price the product was
    // created with; what the 💲 screen holds is a different thing, and reading it back into
    // this form is exactly what made the two look like one number that kept moving.
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.categoryId) return notifyError("Please choose a category.");

    // Prices are only ever written when creating. Editing a product is about what it is and
    // how much of it there is; what it costs lives on the 💲 grid, and one screen owning the
    // prices is what keeps the two from overwriting each other.
    const priced = editingId
      ? []
      : form.typePrices.filter((r) => r.clientTypeId && r.price !== "");
    if (!editingId && priced.length !== form.typePrices.length) {
      return notifyError("Indiquez un prix pour chaque type ajouté, ou retirez la ligne.");
    }

    setSaving(true);
    // products.price is NOT NULL but nothing is ever charged from it: the storefront resolves
    // every price from the segment grid. It is therefore seeded once, at creation, from the
    // cheapest segment - and left alone afterwards.
    //
    // It used to be recomputed on every save, which coupled two things that are not the same:
    // change a rung on the 💲 grid, come back to edit the product's stock, and the Price column
    // moved on its own. An existing product keeps the reference it was created with.
    const reference = editingId
      ? Number(form.referencePrice) || 0
      : priced.length
      ? Math.min(...priced.map((r) => Number(r.price)))
      : 0;

    const body = {
      name: form.name,
      category: form.categoryId,
      description: form.description,
      price: reference,
      unit: form.unit,
      stock: form.stock,
      minOrderQuantity: form.minOrderQuantity,
      image: form.imageUrl ? [form.imageUrl] : [],
      status: form.active ? "show" : "hide",
    };

    try {
      const saved = editingId
        ? await ProductServices.updateProduct(editingId, body)
        : await ProductServices.addProduct(body);
      const productId = saved?._id || editingId;

      if (imageFile && productId) {
        await ProductServices.uploadImage(productId, imageFile);
      }

      // Creation only: an edit never rewrites the grid, so a rung set on the 💲 screen cannot
      // be silently overwritten by someone changing the stock here.
      if (productId && !editingId) {
        await PricingServices.saveProductGrid(productId, buildGrids(priced));
      }

      notifySuccess(editingId ? "Product updated." : "Product created.");
      setModalOpen(false);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Turn the form's one-price-per-segment rows into full ladders.
   *
   * The grid endpoint replaces everything, so the quantity tiers set on the 💲 screen have to
   * be carried through here or editing a product would quietly delete them. Only the entry
   * rung - the lowest - takes the price typed in this form; the breaks above it are left alone.
   */
  const buildGrids = (priced) =>
    priced.map((row) => {
      const existing = loadedGrid.find((g) => g.clientTypeId === row.clientTypeId);
      const rungs = existing?.rungs?.length ? [...existing.rungs] : [];
      if (!rungs.length) {
        return {
          clientTypeId: row.clientTypeId,
          rungs: [{ minQuantity: 1, unitPrice: Number(row.price) }],
        };
      }
      const lowest = rungs.reduce((low, r) => (r.minQuantity < low.minQuantity ? r : low));
      return {
        clientTypeId: row.clientTypeId,
        rungs: rungs.map((r) =>
          r.minQuantity === lowest.minQuantity
            ? { minQuantity: r.minQuantity, unitPrice: Number(row.price) }
            : { minQuantity: r.minQuantity, unitPrice: Number(r.unitPrice) }
        ),
      };
    });

  const toggle = async (row) => {
    try {
      await ProductServices.updateStatus(row._id, {
        status: row.status === "show" ? "hide" : "show",
      });
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await ProductServices.deleteProduct(deleteTarget._id);
      notifySuccess("Product deactivated.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const preview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : form.imageUrl),
    [imageFile, form.imageUrl]
  );

  // Modal form fields. Plain elements, like the filter bar: passing these utilities to the
  // Windmill <Input> loses — its theme base (h-12 / px-3 / bg-gray-100) has the same
  // specificity, so the grey 48px field won and the modal never matched the dropdown next
  // to it.
  const inputCls =
    "form-input w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500";

  const labelCls =
    "mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300";

  const sectionCls =
    "text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500";

  // Filter-bar controls are plain elements: the Windmill Input/Select theme base forces
  // h-12 / px-3 / bg-gray-100, which fights any utility passed via className (that clash is
  // what pushed the search icon on top of the placeholder).
  const controlCls =
    "w-full h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500 dark:hover:border-gray-500";

  const clearSearch = () => {
    setSearch("");
    setPage(1);
    setQuery("");
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>Products</PageTitle>
        <Button onClick={openAdd} className="h-11 rounded-lg">
          <FiPlus className="mr-2" /> Add product
        </Button>
      </div>

      {/* filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQuery(search);
          }}
        >
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className={`${controlCls} pl-10 ${search ? "pr-10" : "pr-3"}`}
            placeholder="Search products…"
            aria-label="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </form>
        <FilterDropdown
          className="w-full sm:w-60"
          ariaLabel="Filter by category"
          allLabel="All categories"
          value={categoryFilter}
          onChange={(next) => {
            setPage(1);
            setCategoryFilter(next);
          }}
          options={categories.map((c) => ({
            value: c._id,
            label: c.name?.en || "-",
          }))}
        />
      </div>

      {loading && rows.length === 0 ? (
        <TableSkeleton rows={8} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiBox}
          title="No products yet"
          description="Add your first product to start building the catalogue."
          actionLabel="Add product"
          onAction={openAdd}
        />
      ) : (
        <TableContainer
          className={`mb-8 transition-opacity duration-200 ${
            loading ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Product</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {row.image?.[0] ? (
                        <img
                          src={row.image[0]}
                          alt=""
                          className="h-11 w-11 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="grid h-11 w-11 place-items-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-700">
                          <FiImage />
                        </span>
                      )}
                      <span className="font-medium">{row.title?.en}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{row.category?.name?.en || "-"}</TableCell>
                  <TableCell className="font-semibold">
                    {currency}
                    {Number(row.prices?.price || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className={row.stock > 0 ? "" : "text-red-500"}>{row.stock}</span>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggle(row)}>
                      <Badge type={row.status === "show" ? "success" : "neutral"}>
                        {row.status === "show" ? "Active" : "Hidden"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-gray-400">
                      <button
                        className="transition hover:text-emerald-600"
                        onClick={() => setPriceTarget(row)}
                        title="Grille de prix par type de client"
                      >
                        <FiDollarSign />
                      </button>
                      <button
                        className="transition hover:text-emerald-600"
                        onClick={() => openEdit(row)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="transition hover:text-red-500"
                        onClick={() => setDeleteTarget(row)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TableFooter>
            <TablePagination
              page={page}
              totalDoc={totalDoc}
              limit={LIMIT}
              onChange={setPage}
            />
          </TableFooter>
        </TableContainer>
      )}

      {/* Add / edit product modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit product" : "Add product"}
        subtitle={
          editingId
            ? "Les changements sont visibles en boutique dès l'enregistrement."
            : "Nom, catégorie et au moins un prix par type de client sont nécessaires."
        }
        icon={FiBox}
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="h-11 rounded-lg px-5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-11 rounded-lg bg-emerald-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
            </button>
          </>
        }
      >
        {/* Three concerns, three sections: what the product is, what it costs, how it is
            stocked. A flat stack of nine fields is what made this form hard to scan. */}
        {/* Two columns: the product as an object on the left (its picture, whether it is
            on sale), everything you type on the right. The single scrolling column pushed the
            pricing grid - the decision this screen exists for - below the fold. */}
        <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <aside className="space-y-4">
            <div>
              <span className={labelCls}>Image</span>
              <label className="group relative grid aspect-square w-full cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition hover:border-emerald-300 hover:text-emerald-500 dark:border-gray-600 dark:bg-gray-700/40">
                {preview ? (
                  <>
                    <img src={preview} alt="" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 hidden items-center justify-center bg-gray-900/50 text-xs font-medium text-white group-hover:flex">
                      Remplacer
                    </span>
                  </>
                ) : (
                  /* Formats and size limit live inside the tile: as a caption under a narrow
                     column they wrapped onto two ragged lines. */
                  <span className="flex flex-col items-center gap-1.5 px-6 text-center">
                    <FiImage className="text-3xl" />
                    <span className="text-sm font-medium">Ajouter une image</span>
                    <span className="text-[11px] leading-4 text-gray-400">
                      PNG, JPG, WebP ou AVIF — 5 Mo max.
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
              {imageFile && (
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="mt-2 text-xs font-medium text-gray-500 underline-offset-2 hover:text-red-500 hover:underline"
                >
                  Retirer l&apos;image choisie
                </button>
              )}
            </div>

            {/* Visibility belongs with the object, not at the bottom of a list of numbers. */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 transition-colors hover:border-gray-200 dark:border-gray-700 dark:bg-gray-700/30">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
              />
              <span className="text-sm">
                <span className="block font-medium text-gray-700 dark:text-gray-200">
                  Produit actif
                </span>
                <span className="block text-xs leading-5 text-gray-500 dark:text-gray-400">
                  {form.active
                    ? "Visible en boutique et commandable."
                    : "Masqué de la boutique : personne ne peut le commander."}
                </span>
              </span>
            </label>
          </aside>

          {/* min-w-0 so a long product name cannot stretch the grid column. */}
          <div className="min-w-0 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className={labelCls}>
                  Product name <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Huile d'olive 5L"
                  required
                />
              </label>

              {/* A <div>, not a <label>: a label forwards its click to the button inside,
                  which would toggle the dropdown twice and leave it closed. */}
              <div className="text-sm">
                <span className={labelCls}>
                  Category <span className="text-red-400">*</span>
                </span>
                <FilterDropdown
                  ariaLabel="Category"
                  allLabel="Select a category…"
                  value={form.categoryId}
                  onChange={(next) => setForm({ ...form, categoryId: next })}
                  options={categories.map((c) => ({
                    value: c._id,
                    label: c.name?.en || "-",
                  }))}
                />
              </div>
            </div>

            <label className="block text-sm">
              <span className={labelCls}>Description</span>
              <textarea
                className={`${inputCls} h-20 resize-y py-2.5 leading-6`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description shown on the product page…"
              />
            </label>

            {/* Prices are editable at creation only. Once a product exists its grid belongs to
                the 💲 screen: two screens writing the same ladder is how a rung set there gets
                overwritten by someone here who only meant to fix the stock. */}
            {editingId ? (
              /* The price this product was created with. The 💲 screen holds a different
                 thing - the per-segment ladders - and reading those back into this card is
                 what made one number look like it kept changing on its own. */
              <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      Prix du produit
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      Défini à la création. Cet écran ne le modifie pas.
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {currency}
                    {Number(form.referencePrice || 0).toFixed(2)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-200 pt-3 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Les prix par type de client et les paliers de quantité (≥3, ≥8…) se
                    règlent sur leur propre écran.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const row = rows.find((r) => r._id === editingId);
                      setModalOpen(false);
                      if (row) setPriceTarget(row);
                    }}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition-colors hover:border-emerald-200 hover:text-emerald-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <FiDollarSign className="h-4 w-4" />
                    Ouvrir la grille
                  </button>
                </div>
              </section>
            ) : (
              <SegmentPriceEditor
                clientTypes={clientTypes}
                value={form.typePrices}
                onChange={(typePrices) => setForm({ ...form, typePrices })}
                currency={currency}
                hint="N'ajoutez que les types auxquels vous vendez ce produit. Les autres ne le verront pas du tout en boutique."
                emptyWarning="Aucun type tarifé : ce produit ne sera visible pour aucun client."
              />
            )}

            <section className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-700">
              <h4 className={sectionCls}>Stock &amp; conditionnement</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className={labelCls}>Unit</span>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="kg, L, unité…"
                  />
                </label>
                <label className="block text-sm">
                  <span className={labelCls}>Stock</span>
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  <span className={labelCls}>Min. order</span>
                  <input
                    type="number"
                    min="1"
                    className={inputCls}
                    value={form.minOrderQuantity}
                    onChange={(e) => setForm({ ...form, minOrderQuantity: e.target.value })}
                  />
                </label>
              </div>
            </section>
          </div>
        </form>
      </Modal>

      <PriceGridModal
        isOpen={!!priceTarget}
        onClose={() => setPriceTarget(null)}
        product={priceTarget}
        currency={currency}
        onSaved={load}
      />

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete product"
        icon={FiTrash2}
        footer={
          <>
            <Button layout="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button className="!bg-red-500 hover:!bg-red-600" onClick={confirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Delete <span className="font-semibold">{deleteTarget?.title?.en}</span>? It will be
          removed from the storefront.
        </p>
      </Modal>
    </>
  );
};

export default Products;
