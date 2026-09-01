import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Input,
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
  price: "",
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
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row._id);
    setImageFile(null);
    setForm({
      name: row.title?.en || "",
      categoryId: row.category?._id || "",
      price: row.prices?.price ?? "",
      unit: row.unit || "unité",
      stock: row.stock ?? 0,
      minOrderQuantity: row.minOrderQuantity ?? 1,
      description: row.description?.en || "",
      imageUrl: row.image?.[0] || "",
      active: row.status !== "hide",
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!form.categoryId) return notifyError("Please choose a category.");
    setSaving(true);
    const body = {
      name: form.name,
      category: form.categoryId,
      description: form.description,
      price: form.price,
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
      if (imageFile && saved?._id) {
        await ProductServices.uploadImage(saved._id, imageFile);
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

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Price ({currency})
              </span>
              <Input
                type="number"
                step="0.01"
                className={inputCls}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </label>
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
