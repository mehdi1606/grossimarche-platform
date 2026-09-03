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
import { FiEdit, FiGift, FiPlus, FiTrash2 } from "react-icons/fi";
import dayjs from "dayjs";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import CouponServices from "@/services/CouponServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY = {
  code: "",
  type: "percentage",
  value: "",
  minimumAmount: "",
  startTime: "",
  endTime: "",
  active: true,
};

const toDateInput = (v) => (v ? dayjs(v).format("YYYY-MM-DD") : "");
const toIso = (d, end = false) =>
  d ? new Date(`${d}T${end ? "23:59:59" : "00:00:00"}Z`).toISOString() : null;

const Coupons = () => {
  const { currency } = useUtilsFunction();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await CouponServices.getAllCoupons());
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
    setEditingId(null);
    setForm(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row._id);
    setForm({
      code: row.couponCode || "",
      type: row.discountType?.type === "fixed" ? "fixed" : "percentage",
      value: row.discountType?.value ?? "",
      minimumAmount: row.minimumAmount ?? "",
      startTime: toDateInput(row.startTime),
      endTime: toDateInput(row.endTime),
      active: row.status !== "hide",
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      couponCode: form.code.trim().toUpperCase(),
      discountType: { type: form.type, value: Number(form.value) || 0 },
      minimumAmount: Number(form.minimumAmount) || 0,
      startTime: toIso(form.startTime),
      endTime: toIso(form.endTime, true),
      status: form.active ? "show" : "hide",
    };
    try {
      if (editingId) {
        await CouponServices.updateCoupon(editingId, body);
        notifySuccess("Coupon mis à jour.");
      } else {
        await CouponServices.addCoupon(body);
        notifySuccess("Coupon créé.");
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
      await CouponServices.updateStatus(row._id, {
        ...couponToBody(row),
        status: row.status === "show" ? "hide" : "show",
      });
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const couponToBody = (row) => ({
    couponCode: row.couponCode,
    discountType: { type: row.discountType?.type, value: row.discountType?.value },
    minimumAmount: row.minimumAmount,
    startTime: row.startTime,
    endTime: row.endTime,
  });

  const confirmDelete = async () => {
    try {
      await CouponServices.deleteCoupon(deleteTarget._id);
      notifySuccess("Coupon supprimé.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const discountLabel = (row) =>
    row.discountType?.type === "fixed"
      ? `${currency}${row.discountType?.value}`
      : `${row.discountType?.value}%`;

  const inputCls =
    "form-input w-full rounded-lg border border-gray-200 bg-white px-3 h-11 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:bg-gray-700 dark:border-gray-600";

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>Coupons</PageTitle>
        <Button onClick={openAdd} className="h-11 rounded-lg">
          <FiPlus className="mr-2" /> Ajouter un coupon
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiGift}
          title="Aucun coupon"
          description="Créez votre premier code de réduction. Les coupons sont vérifiés et appliqués côté serveur, au moment de la commande."
          actionLabel="Ajouter un coupon"
          onAction={openAdd}
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Code</TableCell>
                <TableCell>Remise</TableCell>
                <TableCell>Cde min.</TableCell>
                <TableCell>Début</TableCell>
                <TableCell>Fin</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-semibold uppercase">{row.couponCode}</TableCell>
                  <TableCell className="font-medium text-emerald-600">
                    {discountLabel(row)}
                  </TableCell>
                  <TableCell>
                    {row.minimumAmount ? `${currency}${row.minimumAmount}` : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.startTime ? dayjs(row.startTime).format("DD MMM YYYY") : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.endTime ? dayjs(row.endTime).format("DD MMM YYYY") : "-"}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggle(row)}>
                      <Badge type={row.status === "show" ? "success" : "neutral"}>
                        {row.status === "show" ? "Actif" : "Masqué"}
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

      {/* Add / edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Modifier le coupon" : "Nouveau coupon"}
        subtitle="La remise est calculée côté serveur au moment de la commande."
        icon={FiGift}
        footer={
          <>
            <Button layout="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : editingId ? "Enregistrer" : "Créer le coupon"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          <label className="col-span-2 text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Code
            </span>
            <Input
              className={inputCls}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="BIENVENUE10"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Type
            </span>
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="percentage">Pourcentage (%)</option>
              <option value="fixed">Montant fixe ({currency})</option>
            </Select>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Valeur
            </span>
            <Input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
            />
          </label>
          <label className="col-span-2 text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Montant minimum de commande
            </span>
            <Input
              type="number"
              step="0.01"
              className={inputCls}
              value={form.minimumAmount}
              onChange={(e) => setForm({ ...form, minimumAmount: e.target.value })}
              placeholder="0"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Début
            </span>
            <Input
              type="date"
              className={inputCls}
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Fin
            </span>
            <Input
              type="date"
              className={inputCls}
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </label>
          <label className="col-span-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Coupon actif
          </label>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le coupon"
        icon={FiTrash2}
        footer={
          <>
            <Button layout="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              className="!bg-red-500 hover:!bg-red-600"
              onClick={confirmDelete}
            >
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Supprimer le coupon{" "}
          <span className="font-semibold uppercase">{deleteTarget?.couponCode}</span>? This
          can't be undone.
        </p>
      </Modal>
    </>
  );
};

export default Coupons;
