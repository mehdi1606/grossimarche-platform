import React, { useCallback, useEffect, useState } from "react";
import { Badge, Button, Input, Label, Textarea } from "@windmill/react-ui";
import { FiEdit, FiMapPin, FiPlus, FiSlash, FiTruck } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import DeliveryServices from "@/services/DeliveryServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY_FORM = { name: "", deliveryFee: "", districts: "", sortOrder: 0, active: true };

/**
 * Delivery rounds and their rates.
 *
 * One rate per city, because a city is one round for one van. The districts underneath are not
 * priced - they exist so a delivery address is picked from a list rather than typed, since
 * "ain sebaa", "Aïn Sebaâ" and "AinSebaa" are three different places to whoever is driving.
 *
 * Districts are edited as one textarea, one per line. A repeating add/remove row for twenty-one
 * Casablanca districts is twenty-one clicks and a scroll; pasting a list is one paste, and that
 * is how this data actually arrives.
 */
const Delivery = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [retireTarget, setRetireTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await DeliveryServices.getAll());
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
    setForm({ ...EMPTY_FORM, sortOrder: rows.length });
    setEditing({});
  };

  const openEdit = (row) => {
    setForm({
      name: row.name || "",
      deliveryFee: String(row.deliveryFee ?? ""),
      districts: (row.districts || []).map((d) => d.name).join("\n"),
      sortOrder: row.sortOrder ?? 0,
      active: !!row.active,
    });
    setEditing(row);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      notifyError("Le nom de la ville est obligatoire.");
      return;
    }
    if (form.deliveryFee === "" || Number(form.deliveryFee) < 0) {
      notifyError("Indiquez un tarif de livraison (0 est accepté : livraison offerte).");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        deliveryFee: Number(form.deliveryFee),
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
        districts: form.districts
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((name) => ({ name, active: true })),
      };
      if (editing?.id) {
        await DeliveryServices.update(editing.id, body);
        notifySuccess("Ville mise à jour.");
      } else {
        await DeliveryServices.create(body);
        notifySuccess("Ville ajoutée.");
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
      await DeliveryServices.deactivate(retireTarget.id);
      notifySuccess("Livraison suspendue pour cette ville.");
      setRetireTarget(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  return (
    <>
      <PageTitle>Livraison</PageTitle>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Un tarif par ville, appliqué automatiquement au moment de la commande. Les quartiers
          servent uniquement à ce que le client choisisse son adresse dans une liste au lieu de
          la taper. Une ville suspendue n&apos;est plus proposée, mais les adresses qui s&apos;y
          trouvent restent intactes.
        </p>
        <Button onClick={openNew} className="shrink-0">
          <FiPlus className="mr-2 h-4 w-4" />
          Nouvelle ville
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiTruck}
          title="Aucune ville de livraison"
          description="Ajoutez les villes que vous livrez et leur tarif. Sans ville configurée, le tarif forfaitaire s'applique partout."
          actionLabel="Ajouter une ville"
          onAction={openNew}
        />
      ) : (
        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800 ${
                row.active ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-gray-800 dark:text-gray-100">
                      {row.name}
                    </h3>
                    {!row.active && <Badge type="neutral">Suspendue</Badge>}
                  </div>
                  <p className="mt-1 text-sm">
                    {Number(row.deliveryFee) === 0 ? (
                      <span className="font-semibold text-emerald-600">Livraison offerte</span>
                    ) : (
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {Number(row.deliveryFee).toFixed(2)} DH
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 gap-3 text-gray-400">
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
                      title="Suspendre la livraison"
                    >
                      <FiSlash />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
                <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-400">
                  <FiMapPin className="h-3 w-3" />
                  {row.districts?.length || 0} quartier
                  {(row.districts?.length || 0) > 1 ? "s" : ""}
                </p>
                {row.districts?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {row.districts.map((d) => (
                      <span
                        key={d.id}
                        className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {d.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300">
                    Aucun quartier - le client saisira son adresse librement.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Modifier la ville" : "Nouvelle ville de livraison"}
        icon={FiTruck}
        size="lg"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Label>
              <span>Ville</span>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Casablanca"
                maxLength={100}
                autoFocus
              />
            </Label>

            <Label>
              <span>Tarif de livraison (DH)</span>
              <Input
                className="mt-1"
                type="number"
                min={0}
                step="0.01"
                value={form.deliveryFee}
                onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                placeholder="30.00"
              />
            </Label>
          </div>

          <Label>
            <span>Quartiers - un par ligne</span>
            <Textarea
              className="mt-1 font-mono text-xs"
              rows={8}
              value={form.districts}
              onChange={(e) => setForm({ ...form, districts: e.target.value })}
              placeholder={"Anfa\nMaârif\nSidi Bernoussi"}
            />
          </Label>
          <p className="-mt-2 text-xs text-gray-400">
            Collez votre liste directement. Les lignes vides et les doublons sont ignorés.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Label>
              <span>Ordre d&apos;affichage</span>
              <Input
                className="mt-1"
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </Label>

            <Label check className="self-end pb-2">
              <Input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              <span className="ml-2">Livraison active</span>
            </Label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!retireTarget}
        onClose={() => setRetireTarget(null)}
        title="Suspendre la livraison"
        icon={FiSlash}
        size="sm"
        footer={
          <>
            <Button layout="outline" onClick={() => setRetireTarget(null)}>
              Annuler
            </Button>
            <Button onClick={retire}>Suspendre</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          « {retireTarget?.name} » ne sera plus proposée à la commande. Les clients et les
          adresses de cette ville ne changent pas, et vous pourrez la réactiver à tout moment.
        </p>
      </Modal>
    </>
  );
};

export default Delivery;
