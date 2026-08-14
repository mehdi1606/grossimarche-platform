import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { FiEdit, FiPlus, FiTag, FiTrash2 } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import AttributeServices from "@/services/AttributeServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY = { id: null, name: "", type: "OPTION", values: "", active: true };

const Attributes = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await AttributeServices.getAllAttributes());
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

  const openEdit = (row) => {
    setForm({
      id: row._id,
      name: row.title?.en || "",
      type: row.type || "OPTION",
      values: (row.variants || []).map((v) => v.name?.en).filter(Boolean).join(", "),
      active: row.status !== "hide",
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    const body = {
      name: form.name.trim(),
      type: form.type,
      enabled: form.active,
      values: form.values
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
        .map((name) => ({ name, enabled: true })),
    };
    try {
      if (form.id) {
        await AttributeServices.updateAttribute(form.id, body);
        notifySuccess("Attribute updated.");
      } else {
        await AttributeServices.addAttribute(body);
        notifySuccess("Attribute created.");
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
      await AttributeServices.updateStatus(row._id, {
        status: row.status === "show" ? "hide" : "show",
      });
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await AttributeServices.deleteAttribute(deleteTarget._id);
      notifySuccess("Attribute deleted.");
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
        <PageTitle>Attributes</PageTitle>
        <Button onClick={openAdd} className="h-11 rounded-lg">
          <FiPlus className="mr-2" /> Add attribute
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiTag}
          title="No attributes yet"
          description="Create reusable attributes like Brand or Packaging, then attach their values to your products."
          actionLabel="Add attribute"
          onAction={openAdd}
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Values</TableCell>
                <TableCell>Status</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-semibold">{row.title?.en}</TableCell>
                  <TableCell>{row.option}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(row.variants || []).map((v) => (
                        <span
                          key={v._id}
                          className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700 dark:text-gray-200"
                        >
                          {v.name?.en}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggle(row)}>
                      <Badge type={row.status === "show" ? "success" : "neutral"}>
                        {row.status === "show" ? "Enabled" : "Disabled"}
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

      {/* Add / edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "Edit attribute" : "New attribute"}
        subtitle="Reusable across products (e.g. Brand, Packaging)."
        icon={FiTag}
        footer={
          <>
            <Button layout="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : form.id ? "Save changes" : "Create attribute"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Name
              </span>
              <Input
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Marque"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Type
              </span>
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="OPTION">Dropdown (single)</option>
                <option value="CHECKBOX">Checkbox (multiple)</option>
              </Select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Values
            </span>
            <Input
              className={inputCls}
              value={form.values}
              onChange={(e) => setForm({ ...form, values: e.target.value })}
              placeholder="Carton, Sachet, Palette"
            />
            <span className="mt-1 block text-xs text-gray-400">
              Separate each value with a comma.
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Enabled
          </label>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete attribute"
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
          Delete <span className="font-semibold">{deleteTarget?.title?.en}</span> and its
          values?
        </p>
      </Modal>
    </>
  );
};

export default Attributes;
