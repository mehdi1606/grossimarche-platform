import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Input, Select } from "@windmill/react-ui";
import { FiCopy, FiDollarSign, FiPlus, FiTrash2 } from "react-icons/fi";

//internal import
import Modal from "@/components/common/Modal";
import PricingServices from "@/services/PricingServices";
import { notifyError, notifySuccess } from "@/utils/toast";

/**
 * The per-segment price editor for one product.
 *
 * A segment's ladder is self-contained: the row at quantity 1 is its base price, the rows above
 * it are its quantity breaks. An empty ladder is a real answer - it means the product is not
 * sold to that segment and stays invisible to it - so every segment is listed whether or not it
 * has prices, and the empty ones are labelled rather than hidden.
 *
 * "Copier" exists because the realistic way to fill three segments is to price one properly and
 * adjust from there, not to retype the same ladder three times.
 */
const PriceGridModal = ({ isOpen, onClose, product, currency = "DH", onSaved }) => {
  const [grid, setGrid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const productId = product?._id || product?.id;

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await PricingServices.getProductGrid(productId);
      setGrid({
        ...res,
        grids: (res.grids || []).map((g) => ({
          ...g,
          rungs: (g.rungs || []).map((r) => ({
            minQuantity: String(r.minQuantity),
            unitPrice: String(r.unitPrice),
          })),
        })),
      });
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const update = (typeId, rungs) =>
    setGrid((g) => ({
      ...g,
      grids: g.grids.map((x) => (x.clientTypeId === typeId ? { ...x, rungs } : x)),
    }));

  const addRung = (row) => {
    // Start at 1 when the ladder is empty, otherwise one step above its top rung: the next row
    // an admin wants is nearly always the next threshold up.
    const top = row.rungs.reduce((m, r) => Math.max(m, Number(r.minQuantity) || 0), 0);
    update(row.clientTypeId, [
      ...row.rungs,
      { minQuantity: String(top ? top + 1 : 1), unitPrice: "" },
    ]);
  };

  const copyFrom = (row, sourceId) => {
    const source = grid.grids.find((g) => g.clientTypeId === sourceId);
    if (!source) return;
    update(row.clientTypeId, source.rungs.map((r) => ({ ...r })));
  };

  /**
   * The same rule the API enforces: a unit price may not rise as the quantity grows. Checked
   * here too so the admin sees it while typing instead of on a rejected save.
   */
  const problem = useMemo(() => {
    if (!grid) return null;
    for (const row of grid.grids) {
      const filled = row.rungs.filter((r) => r.minQuantity !== "" && r.unitPrice !== "");
      const ordered = [...filled].sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity));
      for (let i = 1; i < ordered.length; i += 1) {
        if (Number(ordered[i].minQuantity) === Number(ordered[i - 1].minQuantity)) {
          return `${row.clientTypeName} : deux prix pour la quantité ${ordered[i].minQuantity}.`;
        }
        if (Number(ordered[i].unitPrice) > Number(ordered[i - 1].unitPrice)) {
          return `${row.clientTypeName} : le prix augmente à partir de ${ordered[i].minQuantity} unités. Un palier doit baisser le prix.`;
        }
      }
      if (row.rungs.some((r) => r.minQuantity !== "" && r.unitPrice === "")) {
        return `${row.clientTypeName} : un palier est sans prix.`;
      }
    }
    return null;
  }, [grid]);

  const save = async () => {
    if (problem) {
      notifyError(problem);
      return;
    }
    setSaving(true);
    try {
      const payload = grid.grids.map((row) => ({
        clientTypeId: row.clientTypeId,
        rungs: row.rungs
          .filter((r) => r.minQuantity !== "" && r.unitPrice !== "")
          .map((r) => ({
            minQuantity: Number(r.minQuantity),
            unitPrice: Number(r.unitPrice),
          })),
      }));
      await PricingServices.saveProductGrid(productId, payload);
      notifySuccess("Grille de prix enregistrée.");
      onSaved?.();
      onClose?.();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const pricedCount = grid?.grids?.filter((g) => g.rungs.length > 0).length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grille de prix"
      // `title` is the multilingual object the adapters wrap names in ({ en: "…" }), not a
      // string. Rendering it straight threw React #31 - "objects are not valid as a React
      // child" - which unmounts the whole tree: the screen went white, not just this modal.
      subtitle={product?.title?.en || product?.name || grid?.productName || ""}
      icon={FiDollarSign}
      size="xl"
      footer={
        <>
          {/* Plain buttons: the Windmill `outline` variant carries w-full/h-12/bg-gray-200 in
              this project's theme, which turned Cancel into a grey slab wider than the action
              it sits next to. */}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-lg px-5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || loading || !grid}
            className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </>
      }
    >
      {loading || !grid ? (
        <p className="py-8 text-center text-sm text-gray-400">Chargement…</p>
      ) : grid.grids.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun type de client n'existe encore.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Créez d'abord vos segments dans « Types de clients ».
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
            La ligne <strong>à partir de 1</strong> est le prix de base du type. Les lignes
            au-dessus sont ses paliers de quantité. Un type <strong>sans aucun prix</strong> ne
            voit pas ce produit du tout dans la boutique.
            <span className="ml-1 text-gray-400">
              ({pricedCount}/{grid.grids.length} types tarifés)
            </span>
          </div>

          {grid.grids.map((row) => (
            <div
              key={row.clientTypeId}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {row.clientTypeName}
                  </span>
                  {!row.clientTypeActive && <Badge type="neutral">Type désactivé</Badge>}
                  {row.rungs.length === 0 && <Badge type="warning">Non tarifé</Badge>}
                </div>

                <div className="flex items-center gap-2">
                  {grid.grids.length > 1 && (
                    <Select
                      className="h-8 w-40 text-xs"
                      value=""
                      onChange={(e) => e.target.value && copyFrom(row, e.target.value)}
                    >
                      <option value="">Copier depuis…</option>
                      {grid.grids
                        .filter((g) => g.clientTypeId !== row.clientTypeId && g.rungs.length > 0)
                        .map((g) => (
                          <option key={g.clientTypeId} value={g.clientTypeId}>
                            {g.clientTypeName}
                          </option>
                        ))}
                    </Select>
                  )}
                  <button
                    type="button"
                    onClick={() => addRung(row)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                  >
                    <FiPlus className="h-3 w-3" />
                    Palier
                  </button>
                </div>
              </div>

              {row.rungs.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Ce produit n'est pas vendu à ce type. Ajoutez un palier pour le rendre visible.
                </p>
              ) : (
                <div className="grid gap-2">
                  {row.rungs.map((rung, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-xs text-gray-400">À partir de</span>
                      <Input
                        className="h-9 w-24"
                        type="number"
                        min={1}
                        value={rung.minQuantity}
                        onChange={(e) =>
                          update(
                            row.clientTypeId,
                            row.rungs.map((r, i) =>
                              i === index ? { ...r, minQuantity: e.target.value } : r
                            )
                          )
                        }
                      />
                      <span className="shrink-0 text-xs text-gray-400">unités →</span>
                      <Input
                        className="h-9 w-32"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={rung.unitPrice}
                        onChange={(e) =>
                          update(
                            row.clientTypeId,
                            row.rungs.map((r, i) =>
                              i === index ? { ...r, unitPrice: e.target.value } : r
                            )
                          )
                        }
                      />
                      <span className="shrink-0 text-xs text-gray-400">{currency} / unité</span>
                      <button
                        type="button"
                        title="Supprimer ce palier"
                        onClick={() =>
                          update(
                            row.clientTypeId,
                            row.rungs.filter((_, i) => i !== index)
                          )
                        }
                        className="ml-auto text-gray-300 transition hover:text-red-500"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {problem && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10">
              {problem}
            </p>
          )}

          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <FiCopy className="h-3 w-3" />
            Prix de référence interne : {currency}
            {Number(grid.referencePrice || 0).toFixed(2)} - jamais affiché au client.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default PriceGridModal;
