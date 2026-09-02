import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHeader,
  TableRow,
} from "@windmill/react-ui";
import { FiPercent, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import ProductServices from "@/services/ProductServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@/utils/toast";

const LIMIT = 10;

/**
 * Quantity-discount tiers ("Offers"). A tier says: from N units, the unit price drops to X.
 * The storefront reads exactly these rows to show its degressive pricing, and until now they
 * could only be created in SQL - the back-office had no screen for them at all.
 */
const Offers = () => {
  const { currency } = useUtilsFunction();
  const [rows, setRows] = useState([]);
  const [tiersByProduct, setTiersByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalDoc, setTotalDoc] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const [target, setTarget] = useState(null); // product whose tiers are being edited
  const [tiers, setTiers] = useState([]);
  const [tiersLoading, setTiersLoading] = useState(false);
  const [minQuantity, setMinQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProductServices.getAllProducts({
        page,
        limit: LIMIT,
        title: query,
      });
      const products = res.products || [];
      setRows(products);
      setTotalDoc(res.totalDoc || 0);

      // One call per row: the list endpoint does not carry the tiers, and a page holds 10.
      const entries = await Promise.all(
        products.map(async (product) => {
          try {
            return [product._id, await ProductServices.getTiers(product._id)];
          } catch {
            return [product._id, []];
          }
        })
      );
      setTiersByProduct(Object.fromEntries(entries));
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 350);
    return () => clearTimeout(id);
  }, [search]);

  const openTiers = async (product) => {
    setTarget(product);
    setMinQuantity("");
    setUnitPrice("");
    setTiersLoading(true);
    try {
      setTiers(await ProductServices.getTiers(product._id));
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
      setTiers([]);
    } finally {
      setTiersLoading(false);
    }
  };

  const refreshTiers = async (productId) => {
    const fresh = await ProductServices.getTiers(productId);
    setTiers(fresh);
    setTiersByProduct((prev) => ({ ...prev, [productId]: fresh }));
  };

  const addTier = async (e) => {
    e.preventDefault();
    const qty = Number(minQuantity);
    const price = Number(unitPrice);
    const basePrice = Number(target?.prices?.price || 0);

    if (!Number.isInteger(qty) || qty < 2) {
      return notifyError("La quantité minimale doit être un entier supérieur ou égal à 2.");
    }
    if (!price || price <= 0) {
      return notifyError("Le prix unitaire doit être supérieur à 0.");
    }
    // A tier above the base price is not a discount - catch it here rather than let the
    // storefront display a "discount" that costs more.
    if (basePrice && price >= basePrice) {
      return notifyError(
        `Le prix du palier doit être inférieur au prix de base (${currency}${basePrice.toFixed(2)}).`
      );
    }
    if (tiers.some((t) => t.minQuantity === qty)) {
      return notifyError(`Un palier à partir de ${qty} unités existe déjà.`);
    }

    setSaving(true);
    try {
      await ProductServices.addTier(target._id, { minQuantity: qty, unitPrice: price });
      await refreshTiers(target._id);
      setMinQuantity("");
      setUnitPrice("");
      notifySuccess("Palier ajouté.");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const removeTier = async (tier) => {
    try {
      await ProductServices.deleteTier(target._id, tier.id);
      await refreshTiers(target._id);
      notifySuccess("Palier supprimé.");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const controlCls =
    "w-full h-11 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500 dark:hover:border-gray-500";

  const sortedTiers = useMemo(
    () => [...tiers].sort((a, b) => a.minQuantity - b.minQuantity),
    [tiers]
  );

  const totalPages = Math.max(1, Math.ceil(totalDoc / LIMIT));

  return (
    <>
      <div className="flex items-center justify-between">
        <PageTitle>Offers</PageTitle>
      </div>

      <p className="-mt-4 mb-5 text-sm text-gray-500 dark:text-gray-400">
        Tarifs dégressifs : à partir d&apos;une quantité, le prix unitaire baisse. Ces paliers
        s&apos;affichent directement sur la fiche produit de la boutique.
      </p>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className={`${controlCls} pl-10 ${search ? "pr-10" : "pr-3"}`}
            placeholder="Search products…"
            aria-label="Search products"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiPercent}
          title="No products yet"
          description="Add products first - tiers are defined per product."
        />
      ) : (
        <TableContainer className="mb-8">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Product</TableCell>
                <TableCell>Base price</TableCell>
                <TableCell>Tiers</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const productTiers = [...(tiersByProduct[row._id] || [])].sort(
                  (a, b) => a.minQuantity - b.minQuantity
                );
                return (
                  <TableRow key={row._id}>
                    <TableCell>
                      <span className="font-medium">{row.title?.en}</span>
                      <span className="ml-2 text-xs text-gray-400">{row.unit}</span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {currency}
                      {Number(row.prices?.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {productTiers.length === 0 ? (
                        <span className="text-sm text-gray-400">Aucun palier</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {productTiers.map((tier) => (
                            <span
                              key={tier.id || tier.minQuantity}
                              className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            >
                              ≥ {tier.minQuantity} → {currency}
                              {Number(tier.unitPrice).toFixed(2)}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => openTiers(row)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition-colors hover:border-emerald-200 hover:text-emerald-600 dark:border-gray-600 dark:text-gray-300"
                      >
                        <FiPercent className="h-4 w-4" /> Gérer
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && totalPages > 1 && (
        <div className="mb-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-500">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
          >
            Suivant
          </button>
        </div>
      )}

      {/* Tier editor */}
      <Modal
        isOpen={!!target}
        onClose={() => setTarget(null)}
        title={target?.title?.en || "Tarifs dégressifs"}
        subtitle={
          target
            ? `Prix de base ${currency}${Number(target.prices?.price || 0).toFixed(2)} / ${target.unit}`
            : ""
        }
        icon={FiPercent}
        footer={
          <button
            type="button"
            onClick={() => setTarget(null)}
            className="h-11 rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-800 dark:border-gray-600 dark:text-gray-300"
          >
            Fermer
          </button>
        }
      >
        <div className="space-y-5">
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              Paliers actuels
            </h4>
            {tiersLoading ? (
              <p className="text-sm text-gray-400">Chargement…</p>
            ) : sortedTiers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-600">
                Aucun palier - le prix de base s&apos;applique à toute quantité.
              </p>
            ) : (
              <ul className="space-y-2">
                {sortedTiers.map((tier) => (
                  <li
                    key={tier.id || tier.minQuantity}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-700"
                  >
                    <span className="text-gray-600 dark:text-gray-300">
                      À partir de <b>{tier.minQuantity}</b> unités →{" "}
                      <b className="text-emerald-600">
                        {currency}
                        {Number(tier.unitPrice).toFixed(2)}
                      </b>{" "}
                      / unité
                    </span>
                    <button
                      onClick={() => removeTier(tier)}
                      title="Supprimer"
                      aria-label="Supprimer le palier"
                      className="text-gray-400 transition-colors hover:text-red-500"
                    >
                      <FiTrash2 />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            onSubmit={addTier}
            className="grid gap-3 border-t border-gray-100 pt-5 sm:grid-cols-[1fr_1fr_auto] dark:border-gray-700"
          >
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                À partir de (unités)
              </span>
              <input
                type="number"
                min="2"
                step="1"
                className={controlCls}
                placeholder="10"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Prix unitaire ({currency})
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={controlCls}
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="h-11 self-end rounded-lg bg-emerald-500 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
            >
              <FiPlus className="mr-1 inline" />
              {saving ? "…" : "Ajouter"}
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default Offers;
