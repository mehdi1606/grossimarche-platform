import React, { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
  Textarea,
} from "@windmill/react-ui";
import { FiEdit, FiPlus, FiSlash, FiUsers } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import ClientTypeServices from "@/services/ClientTypeServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY_FORM = { name: "", description: "", sortOrder: 0, active: true };

/**
 * Client types - the commercial segments the catalogue is priced against.
 *
 * A wholesaler does not sell at one price: a pastry shop and a corner grocer pay differently
 * for the same crate. The segments live here rather than in code so a new one costs a form
 * submission, and every product then carries a price per segment.
 *
 * Retiring a segment deactivates it instead of deleting it. Customers belong to a segment and
 * products are priced against it, so removing the row would take live pricing with it; an
 * inactive segment simply stops being offered at sign-up.
 */
const ClientTypes = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, row = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [retireTarget, setRetireTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await ClientTypeServices.getAll());
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    // New segments land at the end of the chooser rather than silently jumping to the top.
    setForm({ ...EMPTY_FORM, sortOrder: rows.length });
    setEditing({});
  };

  const openEdit = (row) => {
    setForm({
      name: row.name || "",
      description: row.description || "",
      sortOrder: row.sortOrder ?? 0,
      active: !!row.active,
    });
    setEditing(row);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      notifyError("Le nom est obligatoire.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
      };
      if (editing?.id) {
        await ClientTypeServices.update(editing.id, body);
        notifySuccess("Type de client mis à jour.");
      } else {
        await ClientTypeServices.create(body);
        notifySuccess("Type de client créé.");
      }
      setEditing(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const retire = async () => {
    try {
      await ClientTypeServices.deactivate(retireTarget.id);
      notifySuccess("Type de client désactivé.");
      setRetireTarget(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  return (
    <>
      <PageTitle>Types de clients</PageTitle>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Chaque client appartient à un type (pâtisserie, épicerie, laiterie…), et c'est ce type
          qui détermine les prix qu'il voit. Un type désactivé n'est plus proposé à
          l'inscription, mais les clients et les prix qui en dépendent restent intacts.
        </p>
        <Button onClick={openNew} className="shrink-0">
          <FiPlus className="mr-2 h-4 w-4" />
          Nouveau type
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title="Aucun type de client"
          description="Créez vos segments (pâtisserie, épicerie, laiterie…) pour pouvoir ensuite fixer un prix par type sur chaque produit."
          actionLabel="Créer le premier type"
          onAction={openNew}
        />
      ) : (
        <TableContainer className="mb-8 rounded-2xl">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Nom</TableCell>
                <TableCell>Identifiant</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Ordre</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {row.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-gray-400">{row.slug}</code>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-md text-sm text-gray-600 dark:text-gray-300">
                      {row.description || <span className="text-gray-300">-</span>}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-400">{row.sortOrder}</span>
                  </TableCell>
                  <TableCell>
                    <Badge type={row.active ? "success" : "neutral"}>
                      {row.active ? "Actif" : "Désactivé"}
                    </Badge>
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
                      {row.active && (
                        <button
                          className="transition hover:text-red-500"
                          onClick={() => setRetireTarget(row)}
                          title="Désactiver"
                        >
                          <FiSlash />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Modifier le type" : "Nouveau type de client"}
        subtitle="Le nom est ce que verra le client à l'inscription."
        icon={FiUsers}
        footer={
          <>
            <Button layout="outline" onClick={() => setEditing(null)}>
              Annuler
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="grid gap-4">
          <Label>
            <span>Nom</span>
            <Input
              className="mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Pâtisserie"
              maxLength={100}
              autoFocus
            />
          </Label>

          <Label>
            <span>Description (optionnelle)</span>
            <Textarea
              className="mt-1"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Boulangeries, pâtisseries et snacking."
              maxLength={500}
            />
          </Label>

          <Label>
            <span>Ordre d'affichage</span>
            <Input
              className="mt-1"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </Label>

          <Label check>
            <Input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span className="ml-2">Proposé à l'inscription</span>
          </Label>
        </form>
      </Modal>

      <Modal
        isOpen={!!retireTarget}
        onClose={() => setRetireTarget(null)}
        title="Désactiver ce type"
        icon={FiSlash}
        size="sm"
        footer={
          <>
            <Button layout="outline" onClick={() => setRetireTarget(null)}>
              Annuler
            </Button>
            <Button onClick={retire}>Désactiver</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          « {retireTarget?.name} » ne sera plus proposé à l'inscription. Les clients déjà
          rattachés à ce type et les prix qui en dépendent ne changent pas, et vous pourrez le
          réactiver à tout moment.
        </p>
      </Modal>
    </>
  );
};

export default ClientTypes;
