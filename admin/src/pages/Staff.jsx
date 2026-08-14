import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
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
import { FiEdit, FiPlus, FiTrash2, FiUser } from "react-icons/fi";
import dayjs from "dayjs";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import AdminServices from "@/services/AdminServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY = { name: "", email: "", phone: "", role: "Store Manager" };

const nameOf = (row) =>
  typeof row?.name === "object" ? row?.name?.en || "—" : row?.name || "—";

const Staff = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await AdminServices.getAllStaff());
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
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: nameOf(row),
      email: row.email || "",
      phone: row.phone || "",
      role: row.role === "Admin" ? "Admin" : "Store Manager",
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await AdminServices.updateStaff(editing._id, { role: form.role });
        notifySuccess("Staff updated.");
      } else {
        await AdminServices.addStaff({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
        });
        notifySuccess("Staff member added.");
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
      await AdminServices.updateStaffStatus(row._id, {
        status: row.status === "Active" ? "Blocked" : "Active",
      });
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await AdminServices.deleteStaff(deleteTarget._id);
      notifySuccess("Staff member removed.");
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
        <PageTitle>Staff</PageTitle>
        <Button onClick={openAdd} className="h-11 rounded-lg">
          <FiPlus className="mr-2" /> Add staff
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiUser}
          title="No staff yet"
          description="Invite your team. Staff sign in with a one-time code — access is decided by their role."
          actionLabel="Add staff"
          onAction={openAdd}
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Status</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        className="bg-emerald-100 text-emerald-600"
                        aria-hidden="true"
                      >
                        <span className="grid h-full w-full place-items-center text-sm font-semibold">
                          {nameOf(row).charAt(0).toUpperCase()}
                        </span>
                      </Avatar>
                      <span className="font-medium">{nameOf(row)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{row.email || "—"}</div>
                    <div className="text-xs text-gray-400">{row.phone || ""}</div>
                  </TableCell>
                  <TableCell>
                    <Badge type={row.role === "Admin" ? "success" : "neutral"}>
                      {row.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.createdAt ? dayjs(row.createdAt).format("DD MMM YYYY") : "—"}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggle(row)}>
                      <Badge type={row.status === "Active" ? "success" : "danger"}>
                        {row.status}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-gray-400">
                      <button
                        className="transition hover:text-emerald-600"
                        onClick={() => openEdit(row)}
                        title="Edit role"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="transition hover:text-red-500"
                        onClick={() => setDeleteTarget(row)}
                        title="Remove"
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
        title={editing ? "Edit staff" : "Add staff"}
        subtitle="Passwordless — they sign in with a one-time code."
        icon={FiUser}
        footer={
          <>
            <Button layout="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add staff"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editing && (
            <>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Full name
                </span>
                <Input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                    Email
                  </span>
                  <Input
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@store.ma"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                    Phone
                  </span>
                  <Input
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+2126…"
                  />
                </label>
              </div>
            </>
          )}
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Role
            </span>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="Admin">Admin — full access</option>
              <option value="Store Manager">
                Store Manager — orders, products, categories, customers
              </option>
            </Select>
          </label>
          {editing && (
            <p className="text-xs text-gray-400">
              Name, email and phone are set when the account is created.
            </p>
          )}
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove staff member"
        icon={FiTrash2}
        footer={
          <>
            <Button layout="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button className="!bg-red-500 hover:!bg-red-600" onClick={confirmDelete}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Remove <span className="font-semibold">{nameOf(deleteTarget)}</span> from the
          back-office? They'll lose access immediately.
        </p>
      </Modal>
    </>
  );
};

export default Staff;
