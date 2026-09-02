import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Input,
  Select,
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

  /** Segments not already on a row, i.e. what "Ajouter un type" can still offer. */
  const available = clientTypes.filter(
    (t) => !form.typePrices.some((r) => r.clientTypeId === t.id)
  );

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
      typePrices: [],
      unit: row.unit || "unité",
      stock: row.stock ?? 0,
      minOrderQuantity: row.minOrderQuantity ?? 1,
      description: row.description?.en || "",
      imageUrl: row.image?.[0] || "",
      active: row.status !== "hide",
    });
    setModalOpen(true);

    try {
      const grid = await PricingServices.getProductGrid(row._id);
      setLoadedGrid(grid.grids || []);
      // Only segments that actually carry a price become rows. An empty ladder means the
      // product is not sold to that segment, which is a real answer, not a blank to fill in.
      setForm((f) => ({
        ...f,
        typePrices: (grid.grids || [])
          .filter((g) => g.rungs?.length)
          .map((g) => ({
            clientTypeId: g.clientTypeId,
            // The entry price is the lowest rung, which is not always the one at quantity 1:
            // a segment may only buy this by the case.
            price: String(
              g.rungs.reduce((low, r) => (r.minQuantity < low.minQuantity ? r : low)).unitPrice
            ),
          })),
      }));
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.categoryId) return notifyError("Please choose a category.");

    const priced = form.typePrices.filter((r) => r.clientTypeId && r.price !== "");
    if (priced.length !== form.typePrices.length) {
      return notifyError("Indiquez un prix pour chaque type ajouté, ou retirez la ligne.");
    }

    setSaving(true);
    // products.price is NOT NULL and is now only an internal reference, so it follows the
    // cheapest segment rather than asking the admin for a number no customer is charged.
    const reference = priced.length
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

      if (productId) {
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

  const inputCls =
    "form-input w-full rounded-lg border border-gray-200 bg-white px-3 h-11 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:bg-gray-700 dark:border-gray-600";

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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
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
        subtitle="Fields marked required feed the storefront catalogue."
        icon={FiBox}
        size="lg"
        footer={
          <>
            <Button layout="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* image */}
            <div className="sm:w-40">
              <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Image
              </span>
              <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition hover:border-emerald-300 dark:border-gray-600 dark:bg-gray-700/40">
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <FiImage className="text-2xl" />
                    <span className="px-2 text-center text-xs">Upload image</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {/* main fields */}
            <div className="flex-1 space-y-4">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Product name
                </span>
                <Input
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
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Category
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
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Description
            </span>
            <textarea
              className={`${inputCls} h-24 py-2`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description shown on the product page…"
            />
          </label>

          {/* Per-segment pricing. Types are added one at a time rather than all listed with
              empty boxes: most products are sold to some segments and not others, and a column
              of blanks reads as work to do instead of a deliberate "not sold here". */}
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Prix par type de client
              </span>
              {available.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      typePrices: [
                        ...form.typePrices,
                        { clientTypeId: available[0].id, price: "" },
                      ],
                    })
                  }
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                >
                  <FiPlus className="h-3 w-3" />
                  Ajouter un type
                </button>
              )}
            </div>
            <p className="mb-3 text-xs text-gray-400">
              N&apos;ajoutez que les types auxquels vous vendez ce produit. Les autres ne le
              verront pas du tout en boutique.
            </p>

            {form.typePrices.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10">
                Aucun type tarifé : ce produit ne sera visible pour aucun client.
              </p>
            ) : (
              <div className="grid gap-2">
                {form.typePrices.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      className="h-9 flex-1 text-sm"
                      value={row.clientTypeId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          typePrices: form.typePrices.map((x, i) =>
                            i === index ? { ...x, clientTypeId: e.target.value } : x
                          ),
                        })
                      }
                    >
                      {clientTypes
                        .filter(
                          (t) =>
                            t.id === row.clientTypeId ||
                            !form.typePrices.some((x) => x.clientTypeId === t.id)
                        )
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="h-9 w-32"
                      placeholder="0.00"
                      value={row.price}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          typePrices: form.typePrices.map((x, i) =>
                            i === index ? { ...x, price: e.target.value } : x
                          ),
                        })
                      }
                    />
                    <span className="w-8 shrink-0 text-xs text-gray-400">{currency}</span>
                    <button
                      type="button"
                      title="Ne pas vendre à ce type"
                      onClick={() =>
                        setForm({
                          ...form,
                          typePrices: form.typePrices.filter((_, i) => i !== index),
                        })
                      }
                      className="text-gray-300 transition hover:text-red-500"
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {editingId && (
              <p className="mt-3 text-xs text-gray-400">
                Les paliers de quantité se règlent ensuite avec l&apos;icône 💲 de la liste.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Unit
              </span>
              <Input
                className={inputCls}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="kg, L, unité…"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Stock
              </span>
              <Input
                type="number"
                className={inputCls}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Min. order
              </span>
              <Input
                type="number"
                min="1"
                className={inputCls}
                value={form.minOrderQuantity}
                onChange={(e) => setForm({ ...form, minOrderQuantity: e.target.value })}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active - visible in the storefront
          </label>
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
