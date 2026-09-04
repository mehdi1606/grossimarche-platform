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
import PricingServices from "@/services/PricingServices";
import ClientTypeServices from "@/services/ClientTypeServices";
import ProductServices from "@/services/ProductServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import useUtilsFunction from "@/hooks/useUtilsFunction";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY_FORM = {
  /**
   * The trade this basket is for, chosen before anything else.
   *
   * One segment, not several. A basket is a shopping list for a trade: a pastry shop and a
   * grocer do not buy the same things, and half the catalogue has no price for either of them.
   * Asking for the segment first is what lets the product search show only what that trade is
   * actually sold - offering the whole catalogue and failing at save time was the old way round.
   */
  clientTypeId: "",
  /** What the basket costs that segment. Must come in under what its products cost there. */
  price: "",
  name: "",
  description: "",
  imageUrl: "",
  active: true,
};

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
  // [{ productId, name, unit, quantity, rungs }] - rungs is that product's price ladder for the
  // chosen trade, which is what makes a running basket value possible while composing.
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  // Picked in the form, uploaded once the bundle has an id (see save()).
  const [imageFile, setImageFile] = useState(null);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [announceTarget, setAnnounceTarget] = useState(null);
  const [clientTypes, setClientTypes] = useState([]);

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

  useEffect(() => {
    ClientTypeServices.getAll()
      .then((res) => setClientTypes((res || []).filter((t) => t.active)))
      .catch((err) => notifyError(err?.response?.data?.message || err?.message));
  }, []);

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
      const [bundle, grid] = await Promise.all([
        BundleServices.getById(row.id),
        PricingServices.getBundleGrid(row.id),
      ]);
      setEditing(bundle);

      // A basket now belongs to one segment. An older one priced for several opens on the
      // cheapest of them rather than refusing to open: the admin can see it and re-point it.
      const pricedRows = (grid.prices || []).filter(
        (p) => p.price !== null && p.price !== undefined
      );
      const chosen = pricedRows.reduce(
        (best, row) => (!best || Number(row.price) < Number(best.price) ? row : best),
        null
      );
      if (pricedRows.length > 1) {
        notifyError(
          `Ce panier était tarifé pour ${pricedRows.length} types. Il en garde un seul : ` +
            `${chosen.clientTypeName}. Enregistrez pour confirmer.`
        );
      }

      setForm({
        clientTypeId: chosen?.clientTypeId || "",
        price: chosen ? String(chosen.price) : "",
        name: bundle.name || "",
        description: bundle.description || "",
        imageUrl: bundle.imageUrl || "",
        active: bundle.active,
      });
      // The ladders come with the items, so an existing basket shows its value straight away
      // rather than only after a product is touched.
      const segmentId = chosen?.clientTypeId;
      setItems(
        await Promise.all(
          (bundle.items || []).map(async (item) => {
            let rungs = [];
            if (segmentId) {
              try {
                const productGrid = await PricingServices.getProductGrid(item.productId);
                rungs =
                  (productGrid?.grids || []).find((g) => g.clientTypeId === segmentId)?.rungs ||
                  [];
              } catch {
                rungs = [];
              }
            }
            return {
              productId: item.productId,
              name: item.name,
              unit: item.unit,
              rungs,
              quantity: item.quantity,
            };
          })
        )
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
    if (term.trim().length < 2 || !form.clientTypeId) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      // Narrowed to the chosen segment. Offering the whole catalogue here was a trap: a product
      // that trade has no price for cannot be in its basket, and the only way to find out was
      // the server refusing the save afterwards.
      const res = await ProductServices.getAllProducts({
        page: 1,
        limit: 8,
        title: term,
        clientType: form.clientTypeId,
      });
      setResults(res.products || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  /**
   * Point the basket at a different trade.
   *
   * The products already listed were picked because that segment is sold them; another segment
   * may not be. Rather than keep a list that would be refused at save time, the basket is
   * emptied and the reason is said out loud - the alternative is a silent failure later.
   */
  const chooseClientType = (clientTypeId) => {
    if (clientTypeId === form.clientTypeId) return;
    if (items.length > 0) {
      setItems([]);
      notifyError(
        "Type changé : les produits ont été retirés, ils ne sont pas tous vendus à ce type."
      );
    }
    setSearch("");
    setResults([]);
    setForm((prev) => ({ ...prev, clientTypeId }));
  };

  const addItem = async (product) => {
    const productId = product._id || product.id;
    if (items.some((item) => item.productId === productId)) {
      // The same product twice would be two rows disagreeing about one quantity.
      notifyError("Ce produit est déjà dans l'offre - modifiez sa quantité.");
      return;
    }

    /*
     * Fetch this product's ladder for the chosen trade as it is added.
     *
     * Without it the form could only show the reference price - a figure nobody is charged -
     * so the person setting the offer price had no idea what the basket was worth to that
     * trade, and learnt it only if the server refused the save. One request per product buys
     * a running total that is the same number the server will compute.
     */
    let rungs = [];
    try {
      const grid = await PricingServices.getProductGrid(productId);
      rungs =
        (grid?.grids || []).find((g) => g.clientTypeId === form.clientTypeId)?.rungs || [];
    } catch {
      notifyError("Le tarif de ce produit n'a pas pu être lu - le total restera incomplet.");
    }

    setItems((prev) => [
      ...prev,
      { productId, name: nameOf(product), unit: product.unit, rungs, quantity: 1 },
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
    if (!form.clientTypeId) {
      return notifyError("Choisissez d'abord le type de client de ce panier.");
    }
    if (items.length === 0) {
      return notifyError("Ajoutez au moins un produit à l'offre.");
    }
    if (form.price === "" || Number(form.price) <= 0) {
      return notifyError("Indiquez le prix du panier pour ce type.");
    }
    // The server refuses this too, but it can only do so after the bundle has been created and
    // its items written - which leaves a real basket with no price behind. Better said here.
    if (componentsTotal != null && Number(form.price) >= componentsTotal) {
      return notifyError(
        `Le prix doit être inférieur à la valeur des produits (${componentsTotal.toFixed(
          2
        )} ${currency}), sinon ce panier n'est pas une offre.`
      );
    }
    const priced = [{ clientTypeId: form.clientTypeId, price: form.price }];

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        // Carried through unchanged when no new file was picked, so editing a bundle does not
        // wipe the picture it already has.
        imageUrl: form.imageUrl.trim() || null,
        // bundles.price is NOT NULL and no longer customer-facing: it follows the cheapest
        // segment rather than asking for a figure nobody is charged.
        price: priced.length ? Math.min(...priced.map((r) => Number(r.price))) : 0,
        active: form.active,
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      };
      const saved = editing
        ? await BundleServices.update(editing.id, body)
        : await BundleServices.create(body);

      // Saved after the bundle exists, and after its items: the server checks each price
      // against what the components cost that segment, which it cannot do until both are in
      // place. A rejection here leaves a real bundle with no price, which is recoverable -
      // the message names the segment and why.
      if (saved?.id) {
        await PricingServices.saveBundleGrid(
          saved.id,
          priced.map((r) => ({ clientTypeId: r.clientTypeId, price: Number(r.price) }))
        );
      }

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

  const chosenType = clientTypes.find((t) => t.id === form.clientTypeId);

  /**
   * What one unit costs this trade at that quantity: the highest rung it reaches.
   *
   * Same rule the server applies, deliberately - a total computed here that disagreed with the
   * one computed there would be worse than showing nothing.
   */
  const unitPriceFor = (rungs, quantity) => {
    const reached = (rungs || [])
      .filter((r) => Number(r.minQuantity) <= quantity)
      .sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity));
    return reached.length ? Number(reached[reached.length - 1].unitPrice) : null;
  };

  const lineTotal = (item) => {
    const unit = unitPriceFor(item.rungs, item.quantity);
    return unit == null ? null : unit * item.quantity;
  };

  // Null as soon as one line cannot be priced: a partial sum would read as the basket's value.
  const componentsTotal = items.reduce((sum, item) => {
    if (sum == null) return null;
    const line = lineTotal(item);
    return line == null ? null : sum + line;
  }, 0);

  const priceNumber = form.price === "" ? null : Number(form.price);
  const discount =
    componentsTotal != null && priceNumber != null ? componentsTotal - priceNumber : null;


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
                <TableCell>Type de client</TableCell>
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
                    {/* Whose prices the two columns after this one are. Without it they are
                        just numbers: the same basket costs each trade something different. */}
                    {row.clientTypeName ? (
                      <span className="inline-block whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {row.clientTypeName}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600">Aucun prix</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {(row.items || []).length} produit(s)
                    </span>
                  </TableCell>
                  <TableCell>
                    {/* A missing figure is shown as missing. Printing 0,00 DH for a basket the
                        server simply could not price for anyone reads as "free". */}
                    <span className="text-sm text-gray-400 line-through">
                      {row.componentsTotal == null
                        ? "—"
                        : `${currency}${Number(row.componentsTotal).toFixed(2)}`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {row.price == null
                        ? "—"
                        : `${currency}${Number(row.price).toFixed(2)}`}
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
            {/* No price check here any more: whether a price is a real discount depends on what
                the components cost that segment, which only the server knows. It refuses with a
                message naming the segment. */}
            <Button onClick={save} disabled={saving || items.length === 0}>
              {saving ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le panier"}
            </Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-5">
          {/* Step one, and a real gate: everything below depends on it. The trade decides which
              products exist to be picked, so asking for it after the basket was filled meant
              filling it from a catalogue half of which that trade cannot buy. */}
          <fieldset className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-600 dark:bg-gray-700/30">
            <legend className="px-1 text-sm font-semibold text-gray-700 dark:text-gray-200">
              1. Pour quel type de client ?
            </legend>
            <p className="mb-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Un panier s'adresse à un seul métier. Seuls les produits vendus à ce type pourront
              y être ajoutés.
            </p>
            <div className="flex flex-wrap gap-2">
              {clientTypes.map((type) => {
                const selected = form.clientTypeId === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => chooseClientType(type.id)}
                    aria-pressed={selected}
                    className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-500 font-medium text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {type.name}
                  </button>
                );
              })}
              {clientTypes.length === 0 && (
                <p className="text-sm text-amber-600">
                  Aucun type de client n'existe encore. Créez-en un dans « Types de clients ».
                </p>
              )}
            </div>
          </fieldset>

          {!form.clientTypeId ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-600">
              Choisissez un type de client pour composer le panier.
            </p>
          ) : (
            <>
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

          {/* One segment, one price. The multi-segment editor is gone from here: a basket now
              belongs to a single trade, so a grid of prices would be a grid with one row. */}
          {/* Price and what it is worth, side by side. Setting an offer price without the
              basket's value in front of you is guesswork - and the only feedback used to be
              the server refusing the save. */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-600 dark:bg-gray-700/30">
            <div className="flex flex-wrap items-end gap-6">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Prix du panier pour {chosenType?.name}
                </span>
                {/* A plain input, not Windmill's: its theme forces its own padding, which put
                    the currency straight on top of the value. The unit sits outside instead. */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`${inputCls} w-40 text-right font-semibold tabular-nums`}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                  />
                  <span className="text-sm font-medium text-gray-500">{currency}</span>
                </div>
              </label>

              <div className="text-sm">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Valeur des produits
                </span>
                <p className="h-11 leading-[2.75rem] font-semibold tabular-nums text-gray-800 dark:text-gray-100">
                  {componentsTotal == null
                    ? "—"
                    : `${componentsTotal.toFixed(2)} ${currency}`}
                </p>
              </div>

              {discount != null && (
                <div className="text-sm">
                  <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                    Remise
                  </span>
                  <p
                    className={`h-11 leading-[2.75rem] font-semibold tabular-nums ${
                      discount > 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {discount > 0
                      ? `${discount.toFixed(2)} ${currency} (−${Math.round(
                          (discount / componentsTotal) * 100
                        )}%)`
                      : "aucune remise"}
                  </p>
                </div>
              )}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {items.length === 0
                ? "Ajoutez des produits ci-dessous : leur valeur pour ce type s'affichera ici."
                : componentsTotal == null
                ? "Un produit du panier n'a pas de tarif lisible pour ce type."
                : "Le prix doit rester sous la valeur des produits, sinon le panier n'est pas une offre."}
            </p>
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
                placeholder={`Rechercher un produit vendu aux ${chosenType?.name}…`}
              />
              {/* "Nothing matched" has to be reachable, so the panel opens on a real search
                  term rather than only on results - silence would read as a broken search. */}
              {(results.length > 0 || searching || search.trim().length >= 2) && (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-700">
                  {searching && (
                    <li className="px-3 py-2 text-sm text-gray-400">Recherche…</li>
                  )}
                  {!searching && results.length === 0 && (
                    <li className="px-3 py-2 text-sm text-gray-400">
                      Aucun produit vendu à ce type ne correspond.
                    </li>
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
                {items.map((item) => {
                  const unit = unitPriceFor(item.rungs, item.quantity);
                  const line = lineTotal(item);
                  return (
                    <li
                      key={item.productId}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-gray-700 dark:text-gray-200">{item.name}</p>
                        {/* The unit price for THIS trade, at THIS quantity - a volume rung can
                            change it as the number is typed, and seeing that is the point. */}
                        <p className="text-xs text-gray-400">
                          {unit == null
                            ? "tarif indisponible pour ce type"
                            : `${unit.toFixed(2)} ${currency} / ${item.unit || "unité"}`}
                        </p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => setQuantity(item.productId, e.target.value)}
                        aria-label={`Quantité de ${item.name}`}
                        className="h-9 w-16 shrink-0 rounded-md border border-gray-200 px-2 text-center text-sm dark:border-gray-600 dark:bg-gray-700"
                      />
                      <span className="w-24 shrink-0 text-right font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                        {line == null ? "—" : `${line.toFixed(2)} ${currency}`}
                      </span>
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
                  );
                })}
                <li className="flex items-center justify-between bg-gray-50 px-3 py-2.5 text-sm dark:bg-gray-700/40">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    Valeur totale des produits
                  </span>
                  <span className="font-bold tabular-nums text-gray-800 dark:text-gray-100">
                    {componentsTotal == null
                      ? "—"
                      : `${componentsTotal.toFixed(2)} ${currency}`}
                  </span>
                </li>
              </ul>
            )}
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
            </>
          )}
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
