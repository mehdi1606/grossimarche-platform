import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
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
import { FiAlertTriangle, FiEdit, FiKey, FiMail, FiPlus, FiTrash2, FiUser } from "react-icons/fi";
import dayjs from "dayjs";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import AdminServices from "@/services/AdminServices";
import Modal from "@/components/common/Modal";
import FilterDropdown from "@/components/form/selectOption/FilterDropdown";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY = { name: "", email: "", phone: "", role: "Store Manager" };

const nameOf = (row) =>
  typeof row?.name === "object" ? row?.name?.en || "-" : row?.name || "-";

/**
 * What each role can reach, in the words an admin thinks in. The list drives both the
 * picker and the explanation under it - one place to change when the split moves
 * (utils/access.js is the enforcing copy).
 */
const ROLES = [
  {
    value: "Admin",
    label: "Admin",
    summary: "Accès complet, y compris le staff, les coupons et les réglages.",
  },
  {
    value: "Store Manager",
    label: "Store Manager",
    summary: "Commandes, produits, catégories, clients et offres. Pas de staff ni de réglages.",
  },
];

const Staff = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  // Set only when an invitation e-mail could not be delivered; the password is shown once
  // here because it is stored as a hash and can never be read back.
  const [credentials, setCredentials] = useState(null);

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
        const res = await AdminServices.addStaff({
          name: form.name,
          email: form.email,
          phone: form.phone,
          role: form.role,
        });
        handleCredentialResult(res, form.email, "Compte créé");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * A staff account's password is generated server-side and e-mailed. Report which of the two
   * outcomes happened - delivered, or shown here because mail is not configured.
   */
  const handleCredentialResult = (res, fallbackEmail, action) => {
    if (res?.invitationSent === false && res?.temporaryPassword) {
      setCredentials({
        email: res.email || fallbackEmail,
        password: res.temporaryPassword,
      });
      notifyError(
        `${action}, mais l'e-mail n'a pas pu être envoyé. Transmettez le mot de passe affiché.`
      );
      return;
    }
    notifySuccess(
      `${action}. Le mot de passe a été envoyé à ${res?.email || fallbackEmail}.`
    );
  };

  const confirmReset = async () => {
    const target = resetTarget;
    setResetTarget(null);
    try {
      const res = await AdminServices.resetStaffPassword(target._id);
      handleCredentialResult(res, target.email, "Mot de passe réinitialisé");
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
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
          description="Invite your team. Staff sign in with a one-time code - access is decided by their role."
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
                    <div className="text-sm">{row.email || "-"}</div>
                    <div className="text-xs text-gray-400">{row.phone || ""}</div>
                  </TableCell>
                  <TableCell>
                    <Badge type={row.role === "Admin" ? "success" : "neutral"}>
                      {row.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.createdAt ? dayjs(row.createdAt).format("DD MMM YYYY") : "-"}
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
                        className="transition hover:text-emerald-600"
                        onClick={() => setResetTarget(row)}
                        title="Envoyer un nouveau mot de passe"
                      >
                        <FiKey />
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
        subtitle="Un mot de passe provisoire est généré et envoyé par e-mail."
        icon={FiUser}
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
              className="h-11 whitespace-nowrap rounded-lg bg-emerald-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Add staff"}
            </button>
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
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@store.ma"
                    required
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
          {/* A <div>, not a <label>: a label forwards its click to the button inside, which
              would toggle the dropdown twice and leave it closed. */}
          <div className="text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Role
            </span>
            <FilterDropdown
              ariaLabel="Role"
              allLabel={ROLES[0].label}
              resetValue={ROLES[0].value}
              value={form.role}
              onChange={(role) => setForm({ ...form, role })}
              options={ROLES.slice(1).map(({ value, label }) => ({ value, label }))}
            />
            {/* The permissions moved out of the option labels: a dropdown row is not the
                place for a sentence, and the reader only needs the one that applies. */}
            <p className="mt-1.5 text-xs leading-5 text-gray-500 dark:text-gray-400">
              {(ROLES.find((r) => r.value === form.role) || ROLES[0]).summary}
            </p>
          </div>
          {editing ? (
            <p className="text-xs text-gray-400">
              Name, email and phone are set when the account is created.
            </p>
          ) : (
            <p className="text-xs text-gray-400">
              L'e-mail est l'identifiant de connexion : le mot de passe provisoire y est
              envoyé, et devra être remplacé à la première connexion.
            </p>
          )}
        </form>
      </Modal>

      {/* Reset-password confirm */}
      <Modal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title="Nouveau mot de passe"
        icon={FiKey}
        footer={
          <>
            <Button layout="outline" onClick={() => setResetTarget(null)}>
              Annuler
            </Button>
            <Button onClick={confirmReset}>Envoyer</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Envoyer un nouveau mot de passe provisoire à{" "}
          <span className="font-semibold">{resetTarget?.email || "-"}</span> ? Leur mot de
          passe actuel cessera immédiatement de fonctionner.
        </p>
      </Modal>

      {/* Credentials shown when the invitation e-mail could not be sent */}
      <Modal
        isOpen={!!credentials}
        onClose={() => setCredentials(null)}
        title="E-mail non envoyé"
        icon={FiAlertTriangle}
        footer={
          <Button onClick={() => setCredentials(null)}>J'ai noté le mot de passe</Button>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          L'envoi d'e-mails n'est pas configuré sur ce serveur. Notez ces identifiants et
          transmettez-les - ils ne seront plus affichés.
        </p>
        <dl className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Identifiant
            </dt>
            <dd className="mt-0.5 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
              <FiMail className="h-4 w-4 shrink-0 text-gray-400" />
              {credentials?.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Mot de passe provisoire
            </dt>
            <dd className="mt-0.5 select-all font-mono text-lg font-bold tracking-wide text-emerald-600">
              {credentials?.password}
            </dd>
          </div>
        </dl>
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
