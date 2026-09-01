import React, { useCallback, useEffect, useState } from "react";
import { Badge, Button, Input } from "@windmill/react-ui";
import { FiAlertTriangle, FiPackage } from "react-icons/fi";

//internal import
import Modal from "@/components/common/Modal";
import PricingServices from "@/services/PricingServices";
import { notifyError, notifySuccess } from "@/utils/toast";

const money = (v, currency) =>
  v === null || v === undefined ? "-" : `${currency}${Number(v).toFixed(2)}`;

/**
 * What a bundle costs each segment.
 *
 * Each row shows what the components come to in that segment, because the saving is a different
 * number for each of them - the parts do not cost a pastry shop and a grocer the same either.
 * A segment where some component has no price cannot be offered the bundle at all: there is no
 * total to discount against, so the row is locked and names the products to go price first.
 */
const BundlePriceGridModal = ({ isOpen, onClose, bundle, currency = "DH", onSaved }) => {
  const [grid, setGrid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const bundleId = bundle?.id || bundle?._id;

  const load = useCallback(async () => {
    if (!bundleId) return;
    setLoading(true);
    try {
      const res = await PricingServices.getBundleGrid(bundleId);
      setGrid({
        ...res,
        prices: (res.prices || []).map((p) => ({
          ...p,
          price: p.price === null || p.price === undefined ? "" : String(p.price),
        })),
      });
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, [bundleId]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = grid.prices
        .filter((p) => p.price !== "" && p.componentsTotal !== null)
        .map((p) => ({ clientTypeId: p.clientTypeId, price: Number(p.price) }));
      await PricingServices.saveBundleGrid(bundleId, payload);
      notifySuccess("Prix du panier enregistrés.");
      onSaved?.();
      onClose?.();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prix par type de client"
      subtitle={bundle?.name || grid?.bundleName}
      icon={FiPackage}
      size="lg"
      footer={
        <>
          <Button layout="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={save} disabled={saving || loading || !grid}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </>
      }
    >
      {loading || !grid ? (
        <p className="py-8 text-center text-sm text-gray-400">Chargement…</p>
      ) : grid.prices.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          Aucun type de client n'existe encore.
        </p>
      ) : (
        <div className="grid gap-3">
          <p className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
            Le prix du panier doit être inférieur au total de ses produits dans ce type. Laissez
            vide pour ne pas proposer ce panier à un type.
          </p>

          {grid.prices.map((row, index) => {
            const blocked = row.componentsTotal === null;
            const saving =
              !blocked && row.price !== ""
                ? Number(row.componentsTotal) - Number(row.price)
                : null;

            return (
              <div
                key={row.clientTypeId}
                className={`rounded-xl border p-3 ${
                  blocked
                    ? "border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/5"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {row.clientTypeName}
                    </span>
                    {!row.clientTypeActive && <Badge type="neutral">Désactivé</Badge>}
                  </div>

                  {blocked ? (
                    <span className="flex items-center gap-1.5 text-xs text-amber-600">
                      <FiAlertTriangle className="h-3 w-3" />
                      Produits sans prix : {row.unpricedComponents?.join(", ")}
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        Produits : {money(row.componentsTotal, currency)}
                      </span>
                      <Input
                        className="h-9 w-32"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Prix panier"
                        value={row.price}
                        onChange={(e) =>
                          setGrid((g) => ({
                            ...g,
                            prices: g.prices.map((p, i) =>
                              i === index ? { ...p, price: e.target.value } : p
                            ),
                          }))
                        }
                      />
                      {saving !== null && (
                        <span
                          className={`w-24 text-right text-xs font-medium ${
                            saving > 0 ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {saving > 0
                            ? `-${money(saving, currency)}`
                            : "aucune remise"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default BundlePriceGridModal;
