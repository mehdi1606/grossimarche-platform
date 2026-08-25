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
import {
  FiEdit,
  FiPlus,
  FiTag,
  FiTrash2,
  FiChevronDown,
  FiCheckSquare,
  FiX,
  FiEye,
} from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import AttributeServices from "@/services/AttributeServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY = { id: null, name: "", type: "OPTION", values: [], active: true };

/** One clickable card explaining a choice type in plain language, with an example. */
const TypeCard = ({ selected, onClick, Icon, title, desc, example }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col gap-2 rounded-xl border p-3 text-left transition ${
      selected
        ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-400 dark:bg-emerald-500/10"
        : "border-gray-200 hover:border-emerald-300 dark:border-gray-600 dark:hover:border-emerald-500"
    }`}
  >
    <span
      className={`grid h-8 w-8 place-items-center rounded-lg ${
        selected ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300"
      }`}
    >
      <Icon className="h-4 w-4" />
    </span>
    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</span>
    <span className="text-xs leading-5 text-gray-500 dark:text-gray-400">{desc}</span>
    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{example}</span>
  </button>
);

/** Tag-style value entry: type + Enter/comma turns each option into a removable chip. */
const ChipInput = ({ values, onChange, placeholder }) => {
  const [text, setText] = useState("");
  const commit = (raw) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const next = [...values];
    parts.forEach((p) => {
      if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p);
    });
    onChange(next);
    setText("");
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(text);
    } else if (e.key === "Backspace" && !text && values.length) {
      onChange(values.slice(0, -1));
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700">
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        >
          {v}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="text-emerald-500 transition hover:text-emerald-700"
          >
            <FiX className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => {
          const val = e.target.value;
          if (val.includes(",")) commit(val);
          else setText(val);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => text && commit(text)}
        placeholder={values.length ? "Add another…" : placeholder}
        className="min-w-[8rem] flex-1 border-none bg-transparent px-1 text-sm outline-none focus:ring-0 dark:text-gray-100"
      />
    </div>
  );
};

/** Renders the attribute the way a customer would see it on a product page. */
const AttributePreview = ({ name, type, values }) => {
  const label = name?.trim() || "Attribute name";
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/30">
      <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <FiEye className="h-3.5 w-3.5" /> Preview - what the customer sees
      </div>
      {values.length === 0 ? (
        <p className="text-sm text-gray-400">Add options above to see the preview.</p>
      ) : type === "OPTION" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
          <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
            {values[0]}
            <FiChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            {label}
          </label>
          <div className="space-y-2">
            {values.map((v) => (
              <label
                key={v}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
              >
                <input
                  type="checkbox"
                  readOnly
                  className="rounded border-gray-300 text-emerald-500"
                />
                {v}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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
      values: (row.variants || []).map((v) => v.name?.en).filter(Boolean),
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
      values: (form.values || []).map((name) => ({ name, enabled: true })),
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
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                      {row.type === "CHECKBOX" ? (
                        <FiCheckSquare className="h-4 w-4 text-gray-400" />
                      ) : (
                        <FiChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                      {row.type === "CHECKBOX" ? "Multiple choices" : "One choice"}
                    </span>
                  </TableCell>
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
        subtitle="An extra choice shown on a product - like Packaging or Brand."
        icon={FiTag}
        footer={
          <>
            <Button layout="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || form.values.length === 0}
            >
              {saving ? "Saving…" : form.id ? "Save changes" : "Create attribute"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Plain-language intro so a first-time user knows what this is for */}
          <div className="rounded-lg bg-emerald-50/70 p-3 text-xs leading-5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
            An <b>attribute</b> lets customers pick an option on a product. Just name it, choose
            how they select, and list the options - the preview below shows exactly how it will
            look on your store.
          </div>

          {/* 1. Name */}
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              1. Name of the choice
            </span>
            <Input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Packaging, Brand, Size"
              required
            />
          </label>

          {/* 2. Type as visual cards */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              2. How do customers choose?
            </span>
            <div className="grid grid-cols-2 gap-3">
              <TypeCard
                selected={form.type === "OPTION"}
                onClick={() => setForm({ ...form, type: "OPTION" })}
                Icon={FiChevronDown}
                title="One choice"
                desc="The customer picks a single option from a dropdown."
                example="e.g. Brand → one brand"
              />
              <TypeCard
                selected={form.type === "CHECKBOX"}
                onClick={() => setForm({ ...form, type: "CHECKBOX" })}
                Icon={FiCheckSquare}
                title="Multiple choices"
                desc="The customer can tick one or several options."
                example="e.g. Options → several"
              />
            </div>
          </div>

          {/* 3. Values as chips */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              3. The options
            </span>
            <ChipInput
              values={form.values}
              onChange={(v) => setForm({ ...form, values: v })}
              placeholder="Type an option and press Enter (e.g. Carton)"
            />
            <span className="mt-1 block text-xs text-gray-400">
              Press Enter or comma after each option. Click ✕ to remove one.
            </span>
          </div>

          {/* Live preview */}
          <AttributePreview name={form.name} type={form.type} values={form.values} />

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Enabled (visible on products)
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
