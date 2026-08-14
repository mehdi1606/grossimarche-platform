import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import { FiEdit, FiLayers, FiPlus, FiTrash2 } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import CategoryServices from "@/services/CategoryServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

// A curated icon set relevant to a wholesale grocery catalogue. Stored as a short string in
// the category `icon` column (emoji fits; long image URLs would not).
const ICONS = [
  "🛒", "📦", "🥫", "🍚", "🫒", "🧴", "🧻", "🥤", "🧀", "🥩",
  "🐟", "🍞", "🍫", "🍬", "🧂", "🌶️", "🧄", "🧅", "🥔", "🍅",
  "🥕", "🍎", "🍊", "🍌", "🍇", "🥦", "🥬", "🫑", "🥚", "🥛",
  "☕", "🍵", "🧊", "🍺", "🍷", "🧼", "🧽", "🪣", "🏷️", "🥜",
  "🌰", "🫘", "🍯", "🧺", "🥖", "🧈", "🍝", "🍜", "🫙", "🥗",
];

const EMPTY = { id: null, name: "", slug: "", icon: "🛒", displayOrder: 0, active: true };

const Category = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  const openAdd = () => {
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (row) =>
    setForm({
      id: row._id,
      name: row.name?.en || "",
      slug: row.slug || "",
      icon: row.icon || "🛒",
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
        notifySuccess("Category updated.");
      } else {
        await CategoryServices.addCategory(body);
        notifySuccess("Category created.");
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
      notifySuccess("Category deactivated.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const inputCls =
    "form-input w-full rounded-lg border border-gray-200 bg-white px-3 h-11 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:bg-gray-700 dark:border-gray-600";

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>{t("Category")}</PageTitle>
        <Button onClick={openAdd} className="h-11 rounded-lg">
          <FiPlus className="mr-2" /> Add category
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiLayers}
          title="No categories yet"
          description="Create your first category to organise the catalogue."
          actionLabel="Add category"
          onAction={openAdd}
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Icon</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Status</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="text-2xl">{row.icon}</TableCell>
                  <TableCell className="font-semibold">{row.name?.en}</TableCell>
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
        </TableContainer>
      )}

      {/* Add / edit modal with icon picker */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit category" : "New category"}
        subtitle="Pick an icon and name your category."
        icon={FiLayers}
        footer={
          <>
            <Button layout="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : form.id ? "Save changes" : "Create category"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-3xl dark:bg-emerald-500/10">
              {form.icon}
            </span>
            <div className="flex-1">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Name
                </span>
                <Input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Huiles & condiments"
                  required
                />
              </label>
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Icon
            </span>
            <div className="grid grid-cols-8 gap-1.5 rounded-xl border border-gray-100 p-2 dark:border-gray-700 sm:grid-cols-10">
              {ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setForm({ ...form, icon: ic })}
                  className={`grid h-9 w-9 place-items-center rounded-lg text-lg transition ${
                    form.icon === ic
                      ? "bg-emerald-100 ring-2 ring-emerald-400 dark:bg-emerald-500/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Slug (optional)
              </span>
              <Input
                className={inputCls}
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto from name"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Display order
              </span>
              <Input
                type="number"
                className={inputCls}
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete category"
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
          Deactivate <span className="font-semibold">{deleteTarget?.name?.en}</span>? Products
          keep their category link.
        </p>
      </Modal>
    </>
  );
};

export default Category;
