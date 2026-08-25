import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  FiImage,
  FiPackage,
  FiPlus,
  FiSearch,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import BundleServices from "@/services/BundleServices";
import ProductServices from "@/services/ProductServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY_FORM = { name: "", description: "", imageUrl: "", price: "", active: true };

const IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/avif";

const nameOf = (product) =>
  typeof product?.title === "object" ? product?.title?.en : product?.title || product?.name;

/**
 * Bundle offers ("paniers") - the back-office side of an offer made of one or more products.
 *
 * A bundle is a pricing rule, not a product: it never becomes an order line. When a customer's
 * cart contains everything the set lists, checkout takes off the difference between those
 * items and the bundle price. So there is nothing to keep in stock here, and withdrawing an
 * offer cannot affect an order that already used it.
 */
const Bundles = () => {
  const { currency } = useUtilsFunction();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([]); // [{ productId, name, unit, price, quantity }]
  const [saving, setSaving] = useState(false);
  // Picked in the form, uploaded once the bundle has an id (see save()).
  const [imageFile, setImageFile] = useState(null);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [announceTarget, setAnnounceTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await BundleServices.getAll({ limit: 100 });
      setRows(res.bundles);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // What the chosen products cost separately - the number the offer price has to beat, shown
  // live so nobody has to open a calculator to price a basket.
  const componentsTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
    [items]
  );
  const savings = componentsTotal - Number(form.price || 0);
  const savingsPercent =
    componentsTotal > 0 ? Math.round((savings / componentsTotal) * 100) : 0;
  const priceValid = Number(form.price) > 0 && savings > 0;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setItems([]);
    setResults([]);
    setSearch("");
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = async (row) => {
    try {
      const bundle = await BundleServices.getById(row.id);
      setEditing(bundle);
      setForm({
        name: bundle.name || "",
        description: bundle.description || "",
        imageUrl: bundle.imageUrl || "",
        price: String(bundle.price ?? ""),
        active: bundle.active,
      });
      setItems(
        (bundle.items || []).map((item) => ({
          productId: item.productId,
          name: item.name,
          unit: item.unit,
          price: Number(item.unitPrice),
          quantity: item.quantity,
        }))
      );
      setResults([]);
      setSearch("");
      setImageFile(null);
      setModalOpen(true);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const runSearch = async (term) => {
    setSearch(term);
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await ProductServices.getAllProducts({ page: 1, limit: 8, title: term });
      setResults(res.products || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addItem = (product) => {
    const productId = product._id || product.id;
    if (items.some((item) => item.productId === productId)) {
      // The same product twice would be two rows disagreeing about one quantity.
      notifyError("Ce produit est déjà dans l'offre - modifiez sa quantité.");
      return;
    }
    setItems([
      ...items,
      {
        productId,
        name: nameOf(product),
        unit: product.unit,
        price: Number(product.prices?.price ?? product.price ?? 0),
        quantity: 1,
      },
    ]);
    setSearch("");
    setResults([]);
  };

  const setQuantity = (productId, quantity) =>
    setItems(
      items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item
      )
    );

  const save = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      return notifyError("Ajoutez au moins un produit à l'offre.");
    }
    if (!priceValid) {
      return notifyError(
        "Le prix du panier doit être inférieur au total des produits."
      );
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        // Carried through unchanged when no new file was picked, so editing a bundle does not
        // wipe the picture it already has.
        imageUrl: form.imageUrl.trim() || null,
        price: Number(form.price),
        active: form.active,
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      };
      const saved = editing
        ? await BundleServices.update(editing.id, body)
        : await BundleServices.create(body);

      // The image is uploaded after the bundle exists: it needs an id to be attached to, and
      // a failed upload must not lose the offer that was just described.
      if (imageFile && saved?.id) {
        try {
          await BundleServices.uploadImage(saved.id, imageFile);
        } catch (err) {
          notifyError(
            err?.response?.data?.message || "Offre enregistrée, mais l'image n'a pas pu être envoyée."
          );
        }
      }
      notifySuccess(editing ? "Offre mise à jour." : "Offre créée.");
      setModalOpen(false);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmAnnounce = async () => {
    const target = announceTarget;
    setAnnounceTarget(null);
    try {
      await BundleServices.announce(target.id);
      notifySuccess("L'offre a été envoyée par e-mail aux clients.");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const confirmDelete = async () => {
    try {
      await BundleServices.remove(deleteTarget.id);
      notifySuccess("Offre supprimée.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  const preview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : form.imageUrl),
    [imageFile, form.imageUrl]
  );

  const inputCls =
    "w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300";

  return (
    <>
      <PageTitle>Paniers &amp; offres</PageTitle>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Un panier regroupe un ou plusieurs produits à un prix d'ensemble. La remise
          s'applique automatiquement dès que le panier du client contient tous les articles -
          rien n'est à gérer en stock.
        </p>
        <Button onClick={openAdd} className="h-11">
          <FiPlus className="mr-2" /> Nouveau panier
        </Button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiPackage}
          title="Aucun panier"
          description="Créez un ensemble de produits vendu à un prix d'offre."
          actionLabel="Nouveau panier"
          onAction={openAdd}
        />
      ) : (
        <TableContainer className="mb-8 rounded-2xl">
          <Table>
            <TableHeader>
              <tr>
                <TableCell>Panier</TableCell>
                <TableCell>Articles</TableCell>
                <TableCell>Valeur</TableCell>
                <TableCell>Prix offre</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell className="text-right">Actions</TableCell>
              </tr>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <button
                      onClick={() => openEdit(row)}
                      className="text-left text-sm font-semibold text-gray-700 hover:text-emerald-600 dark:text-gray-200"
                    >
                      {row.name}
                    </button>
                    {row.savingsPercent > 0 && (
                      <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        −{row.savingsPercent}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {(row.items || []).length} produit(s)
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-400 line-through">
                      {currency}
                      {Number(row.componentsTotal).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {currency}
                      {Number(row.price).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.available ? (
                      <Badge type="success">Active</Badge>
                    ) : row.active ? (
                      <Badge type="warning">Stock manquant</Badge>
                    ) : (
                      <Badge type="neutral">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3 text-gray-400">
                      <button
                        className="transition hover:text-emerald-600"
                        onClick={() => setAnnounceTarget(row)}
                        title="Envoyer aux clients par e-mail"
                      >
                        <FiSend />
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

      {/* Create / edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier le panier" : "Nouveau panier"}
        subtitle="Choisissez les produits, leurs quantités, puis le prix de l'ensemble."
        icon={FiPackage}
        footer={
          <>
            <Button layout="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={save} disabled={saving || !priceValid || items.length === 0}>
              {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le panier"}
            </Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* image */}
            <div className="sm:w-40">
              <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Image (facultatif)
              </span>
              <label className="relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition hover:border-emerald-300 dark:border-gray-600 dark:bg-gray-700/40">
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <FiImage className="text-2xl" />
                    <span className="px-2 text-center text-xs">Choisir une image</span>
                  </>
                )}
                <input
                  type="file"
                  accept={IMAGE_TYPES}
                  className="hidden"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
              {preview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setForm({ ...form, imageUrl: "" });
                  }}
                  className="mt-2 w-full text-xs text-gray-400 transition hover:text-red-500"
                >
                  Retirer l'image
                </button>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Nom du panier
                </span>
                <Input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Panier épicerie"
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Description (facultatif)
                </span>
                <textarea
                  rows={3}
                  className={`${inputCls} h-auto py-2`}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="À qui s'adresse ce panier, ce qu'il contient…"
                />
              </label>
            </div>
          </div>

          {/* Product picker */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Produits du panier
            </span>
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className={`${inputCls} pl-10`}
                value={search}
                onChange={(e) => runSearch(e.target.value)}
                placeholder="Rechercher un produit à ajouter…"
              />
              {(results.length > 0 || searching) && (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-700">
                  {searching && (
                    <li className="px-3 py-2 text-sm text-gray-400">Recherche…</li>
                  )}
                  {results.map((product) => (
                    <li key={product._id || product.id}>
                      <button
                        type="button"
                        onClick={() => addItem(product)}
                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        <span className="min-w-0 truncate">{nameOf(product)}</span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {currency}
                          {Number(product.prices?.price ?? product.price ?? 0).toFixed(2)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-600">
                {items.map((item) => (
                  <li
                    key={item.productId}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-200">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-xs text-gray-400">
                      {currency}
                      {item.price.toFixed(2)}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => setQuantity(item.productId, e.target.value)}
                      className="h-9 w-16 rounded-md border border-gray-200 px-2 text-center text-sm dark:border-gray-600 dark:bg-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setItems(items.filter((i) => i.productId !== item.productId))
                      }
                      className="shrink-0 rounded-full p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                      aria-label={`Retirer ${item.name}`}
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pricing */}
          <div className="grid gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2 dark:bg-gray-900/40">
            <div>
              <span className="block text-xs uppercase tracking-wide text-gray-400">
                Valeur des produits
              </span>
              <p className="mt-1 text-lg font-semibold text-gray-700 dark:text-gray-200">
                {currency}
                {componentsTotal.toFixed(2)}
              </p>
            </div>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                Prix du panier
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </label>
            <div className="sm:col-span-2">
              {items.length === 0 ? (
                <p className="text-xs text-gray-400">
                  Ajoutez des produits pour voir la remise.
                </p>
              ) : priceValid ? (
                <p className="text-sm font-semibold text-emerald-600">
                  Remise client : {currency}
                  {savings.toFixed(2)} ({savingsPercent}%)
                </p>
              ) : (
                <p className="text-sm font-medium text-red-500">
                  Le prix du panier doit être inférieur à {currency}
                  {componentsTotal.toFixed(2)}.
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
            />
            Offre active (visible en boutique)
          </label>
        </form>
      </Modal>

      {/* Announce */}
      <Modal
        isOpen={!!announceTarget}
        onClose={() => setAnnounceTarget(null)}
        title="Annoncer l'offre"
        icon={FiSend}
        footer={
          <>
            <Button layout="outline" onClick={() => setAnnounceTarget(null)}>
              Annuler
            </Button>
            <Button onClick={confirmAnnounce}>Envoyer</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Envoyer « <span className="font-semibold">{announceTarget?.name}</span> » par
          e-mail à tous les clients actifs ? L'envoi n'est pas automatique : cette action ne
          part que lorsque vous la déclenchez.
        </p>
      </Modal>

      {/* Delete */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le panier"
        icon={FiTrash2}
        footer={
          <>
            <Button layout="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button className="!bg-red-500 hover:!bg-red-600" onClick={confirmDelete}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Supprimer « <span className="font-semibold">{deleteTarget?.name}</span> » ? L'offre
          disparaît de la boutique. Les commandes passées ne sont pas affectées.
        </p>
      </Modal>
    </>
  );
};

export default Bundles;
