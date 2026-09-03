import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { FiEdit, FiMapPin, FiPlus, FiTrash2 } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import StoreServices from "@/services/StoreServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

// The admin "Settings" panel manages the physical stores / magasins (backend /admin/stores).
const EMPTY = { id: null, name: "", city: "", address: "", phone: "", lat: "", lng: "" };

const Setting = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await StoreServices.getAllStores());
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
      name: row.name,
      city: row.city,
      address: row.address,
      phone: row.phone,
      lat: row.lat,
      lng: row.lng,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    const body = {
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      phone: form.phone.trim() || null,
      openingHours: {},
      lat: Number(form.lat),
      lng: Number(form.lng),
      active: true,
    };
    try {
      if (form.id) {
        await StoreServices.updateStore(form.id, body);
        notifySuccess("Magasin mis à jour.");
      } else {
        await StoreServices.addStore(body);
        notifySuccess("Magasin ajouté.");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await StoreServices.deleteStore(deleteTarget._id);
      notifySuccess("Magasin supprimé.");
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
        <PageTitle>Settings - Stores</PageTitle>
        <Button onClick={openAdd} className="h-11 rounded-lg">
          <FiPlus className="mr-2" /> Add store
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiMapPin}
          title="Aucun magasin"
          description="Add your first magasin - name, city, address and map coordinates. These power the store locator."
          actionLabel="Ajouter un magasin"
          onAction={openAdd}
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Nom</TableCell>
                <TableCell>Ville</TableCell>
                <TableCell>Adresse</TableCell>
                <TableCell>Téléphone</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._id}>
                  <TableCell className="font-semibold">{row.name}</TableCell>
                  <TableCell>{row.city}</TableCell>
                  <TableCell className="text-sm">{row.address}</TableCell>
                  <TableCell>{row.phone || "-"}</TableCell>
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
        title={form.id ? "Modifier le magasin" : "Nouveau magasin"}
        subtitle="Physical magasin shown in the storefront locator."
        icon={FiMapPin}
        size="lg"
        footer={
          <>
            <Button layout="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : form.id ? "Enregistrer" : "Ajouter un magasin"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Store name
            </span>
            <Input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              City
            </span>
            <Input
              className={inputCls}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
          </label>
          <label className="col-span-2 block text-sm">
            <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
              Address
            </span>
            <Input
              className={inputCls}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
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
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Latitude
              </span>
              <Input
                type="number"
                step="any"
                className={inputCls}
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Longitude
              </span>
              <Input
                type="number"
                step="any"
                className={inputCls}
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                required
              />
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le magasin"
        icon={FiTrash2}
        footer={
          <>
            <Button layout="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button className="!bg-red-500 hover:!bg-red-600" onClick={confirmDelete}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Remove <span className="font-semibold">{deleteTarget?.name}</span> from the locator?
        </p>
      </Modal>
    </>
  );
};

export default Setting;
