import React, { useCallback, useEffect, useState } from "react";
import { Badge, Button } from "@windmill/react-ui";
import {
  FiChevronDown,
  FiEdit,
  FiMapPin,
  FiPlus,
  FiSlash,
  FiTrash2,
  FiTruck,
} from "react-icons/fi";

//internal import
import PageTitle from "@/components/Typography/PageTitle";
import DeliveryServices from "@/services/DeliveryServices";
import Modal from "@/components/common/Modal";
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { notifyError, notifySuccess } from "@/utils/toast";

const EMPTY_FORM = { name: "", deliveryFee: "", districts: [], sortOrder: 0, active: true };

/** Turn a pasted block into district rows, dropping blanks and repeats. */
const parseBulk = (text, existing) => {
  const seen = new Set(existing.map((d) => d.name.trim().toLowerCase()));
  const added = [];
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      added.push({ name, deliveryFee: "" });
    });
  return added;
};

/**
 * Delivery rounds and their rates.
 *
 * A rate per city, and optionally per district. Most districts have none and follow their city
 * automatically - including when the city's rate changes later, which is what makes twenty-one
 * Casablanca districts maintainable instead of twenty-one numbers to remember. A district only
 * gets its own price where the round genuinely differs: crossing the city to Aïn Harrouda is
 * not the drop in Maârif.
 *
 * Empty is therefore not zero. Empty means "same as the city"; zero would mean free delivery to
 * that district, which is a different promise.
 *
 * Districts also exist so an address is picked from a list rather than typed: free-typed,
 * "ain sebaa", "Aïn Sebaâ" and "AinSebaa" are three different places to whoever is driving.
 *
 * The rows can be filled by pasting a list, because that is how this data arrives - twenty-one
 * "Ajouter" clicks for Casablanca is not how anyone would actually enter it.
 */
const Delivery = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [retireTarget, setRetireTarget] = useState(null);
  // Which cities show their districts. Open by default: the whole point of the page is to
  // read the prices, and a collapsed list hides exactly that.
  const [expanded, setExpanded] = useState({});

  // Plain-element field classes. The Windmill <Input> theme base (h-12 / px-3 / bg-gray-100 /
  // w-full) has the same specificity as anything passed in className, so a width or height
  // set at the call site silently lost.
  const inputCls =
    "form-input w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500";

  const labelCls = "mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300";

  // Written out instead of `${inputCls} pr-9`: inputCls carries px-3, and two padding
  // utilities of equal specificity are settled by stylesheet order, not by intent - which is
  // how the right-aligned value ended up printing over the DH suffix.
  const feeInputCls =
    "form-input w-full h-10 rounded-lg border border-gray-200 bg-white pl-3 pr-10 text-right text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500";

  const sectionCls =
    "text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500";
  const [bulk, setBulk] = useState("");

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
      districts: (row.districts || []).map((d) => ({
        name: d.name,
        deliveryFee: d.deliveryFee === null || d.deliveryFee === undefined
          ? ""
          : String(d.deliveryFee),
      })),
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
    const named = form.districts.filter((d) => d.name.trim());
    const hasDistricts = named.length > 0;

    // The rule: a city with districts is priced district by district; a city without them
    // carries the price itself. So exactly one of the two has to be filled in.
    if (!hasDistricts && (form.deliveryFee === "" || Number(form.deliveryFee) < 0)) {
      notifyError("Indiquez un tarif de livraison (0 est accepté : livraison offerte).");
      return;
    }
    if (hasDistricts && named.some((d) => d.deliveryFee === "" || Number(d.deliveryFee) < 0)) {
      notifyError("Cette ville a des quartiers : indiquez un tarif pour chacun d'eux.");
      return;
    }

    // delivery_cities.delivery_fee is NOT NULL and still serves as the fallback for an address
    // whose district is unknown (an old address, or one typed before the districts existed).
    // The highest district rate is the safe fallback: it never sells a round below its cost.
    const cityFee = hasDistricts
      ? Math.max(...named.map((d) => Number(d.deliveryFee)))
      : Number(form.deliveryFee);

    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        deliveryFee: cityFee,
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
        districts: form.districts
          .filter((d) => d.name.trim())
          .map((d) => ({
            name: d.name.trim(),
            // Empty means "same as the city", which is not the same as zero - zero would be
            // free delivery to that district.
            deliveryFee: d.deliveryFee === "" ? null : Number(d.deliveryFee),
            active: true,
          })),
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
        /* One row per city, its districts underneath. The card grid showed a city price and
           then bare district names: a district following its city displayed no price at all,
           so the one question this page answers - what does delivery cost where - had to be
           worked out from chip colours. Every line now carries a number. */
        <div className="mb-8 space-y-3">
          {rows.map((row) => {
            const districts = [...(row.districts || [])].sort((a, b) =>
              (a.name || "").localeCompare(b.name || "", "fr")
            );
            const owned = districts.filter(
              (d) => d.deliveryFee !== null && d.deliveryFee !== undefined
            ).length;
            const open = expanded[row.id] ?? true;
            const cityFee = Number(row.deliveryFee);

            return (
              <section
                key={row.id}
                className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${
                  row.active ? "" : "opacity-60"
                }`}
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                  {districts.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setExpanded({ ...expanded, [row.id]: !open })}
                      aria-expanded={open}
                      aria-label={open ? "Replier les quartiers" : "Afficher les quartiers"}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                    >
                      <FiChevronDown
                        className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`}
                      />
                    </button>
                  ) : (
                    <span className="h-7 w-7 shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-gray-800 dark:text-gray-100">
                        {row.name}
                      </h3>
                      {!row.active && <Badge type="neutral">Suspendue</Badge>}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
                      <FiMapPin className="h-3 w-3" />
                      {districts.length} quartier{districts.length > 1 ? "s" : ""}
                      {owned > 0 && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                          {owned} avec tarif propre
                        </span>
                      )}
                    </p>
                  </div>

                  {/* A city with districts has no single price of its own any more: what it
                      costs depends on where in the city you land, so the header states the
                      range rather than one number that would be true nowhere. */}
                  <span className="whitespace-nowrap text-base font-semibold">
                    {districts.length > 0 ? (
                      (() => {
                        const fees = districts.map((d) =>
                          d.deliveryFee === null || d.deliveryFee === undefined
                            ? cityFee
                            : Number(d.deliveryFee)
                        );
                        const min = Math.min(...fees);
                        const max = Math.max(...fees);
                        const label = (v) => (v === 0 ? "Offerte" : `${v.toFixed(2)} DH`);
                        return (
                          <span className="text-gray-800 dark:text-gray-100">
                            {min === max ? label(min) : `${label(min)} – ${label(max)}`}
                            <span className="ml-1.5 text-xs font-normal text-gray-400">
                              selon le quartier
                            </span>
                          </span>
                        );
                      })()
                    ) : cityFee === 0 ? (
                      <span className="text-emerald-600">Livraison offerte</span>
                    ) : (
                      <span className="text-gray-800 dark:text-gray-100">
                        {cityFee.toFixed(2)} DH
                      </span>
                    )}
                  </span>

                  <div className="flex shrink-0 gap-1">
                    <button
                      className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-700"
                      onClick={() => openEdit(row)}
                      title="Modifier"
                    >
                      <FiEdit />
                    </button>
                    {row.active && (
                      <button
                        className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                        onClick={() => setRetireTarget(row)}
                        title="Suspendre la livraison"
                      >
                        <FiSlash />
                      </button>
                    )}
                  </div>
                </div>

                {open && districts.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-3 dark:border-gray-700 dark:bg-gray-900/20">
                    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
                      {districts.map((d) => {
                        const own =
                          d.deliveryFee !== null && d.deliveryFee !== undefined;
                        const fee = own ? Number(d.deliveryFee) : cityFee;
                        return (
                          <div
                            key={d.id}
                            className="flex items-center justify-between gap-3 border-b border-gray-100 py-1.5 text-sm last:border-0 dark:border-gray-700/60"
                          >
                            <span className="truncate text-gray-600 dark:text-gray-300">
                              {d.name}
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              <span
                                className={
                                  own
                                    ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                    : "text-gray-500 dark:text-gray-400"
                                }
                              >
                                {fee === 0 ? "Offerte" : `${fee.toFixed(2)} DH`}
                              </span>
                              {/* An inherited rate is a real price, but it is the city's -
                                  saying so is what stops it reading as a district decision. */}
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                                  own
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                    : "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-400"
                                }`}
                              >
                                {own ? "propre" : "ville"}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {districts.length === 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-2.5 text-xs text-gray-400 dark:border-gray-700 dark:bg-gray-900/20">
                    Aucun quartier - le client saisira son adresse librement, au tarif de la ville.
                  </div>
                )}
              </section>
            );
          })}
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
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="h-11 rounded-lg px-5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="h-11 whitespace-nowrap rounded-lg bg-emerald-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        {/* Two blocks: what the city is, then its districts. The city's own settings were
            split across the top and the bottom of a long scroll, with the district list in
            between carrying its own scrollbar - a second scroll inside a scrolling dialog. */}
        <form onSubmit={submit} className="space-y-6">
          <section className="space-y-4">
            <h4 className={sectionCls}>Ville</h4>

            <div className="grid gap-4 sm:grid-cols-[1fr_10rem_8rem]">
              <label className="block text-sm">
                <span className={labelCls}>
                  Nom <span className="text-red-400">*</span>
                </span>
                <input
                  type="text"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Casablanca"
                  maxLength={100}
                  autoFocus
                />
              </label>

              {form.districts.some((d) => d.name.trim()) ? (
                <div className="text-sm">
                  <span className={labelCls}>Tarif (DH)</span>
                  <p className="flex h-11 items-center rounded-lg border border-dashed border-gray-200 px-3 text-xs text-gray-400 dark:border-gray-600">
                    Défini par quartier
                  </p>
                </div>
              ) : (
                <label className="block text-sm">
                  <span className={labelCls}>Tarif (DH)</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputCls}
                    value={form.deliveryFee}
                    onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                    placeholder="30.00"
                  />
                </label>
              )}

              <label className="block text-sm">
                <span className={labelCls}>Ordre</span>
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </label>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 transition-colors hover:border-gray-200 dark:border-gray-700 dark:bg-gray-700/30">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400"
              />
              <span className="text-sm">
                <span className="block font-medium text-gray-700 dark:text-gray-200">
                  Livraison active
                </span>
                <span className="block text-xs leading-5 text-gray-500 dark:text-gray-400">
                  {form.active
                    ? "La ville est proposée au client à la commande."
                    : "Ville suspendue : plus proposée, mais les adresses existantes restent intactes."}
                </span>
              </span>
            </label>
          </section>

          <section className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className={sectionCls}>
                  Quartiers{form.districts.length > 0 ? ` (${form.districts.length})` : ""}
                </h4>
                <p className="mt-1 text-xs text-gray-400">
                  Chaque quartier porte son propre tarif. Une ville sans quartier est tarifée
                  au niveau de la ville.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    districts: [...form.districts, { name: "", deliveryFee: "" }],
                  })
                }
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition-colors hover:border-emerald-200 hover:text-emerald-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                <FiPlus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </div>

            {form.districts.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <span className="flex-1">Quartier</span>
                  <span className="w-32">Tarif propre</span>
                  <span className="w-8" />
                </div>

                {/* No inner scroll box: the dialog already scrolls, and nesting the two made
                    the list impossible to read past six rows. */}
                <div className="space-y-2">
                  {form.districts.map((d, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {/* Plain inputs: a Windmill <Input> carries w-full in its theme base, so
                          the fee field ignored w-28 and stretched, squeezing the name field to
                          a few pixels - which is exactly what the form looked like. */}
                      <input
                        type="text"
                        className={`${inputCls} h-10 flex-1`}
                        value={d.name}
                        placeholder="Nom du quartier"
                        onChange={(e) =>
                          setForm({
                            ...form,
                            districts: form.districts.map((x, i) =>
                              i === index ? { ...x, name: e.target.value } : x
                            ),
                          })
                        }
                      />
                      <div className="relative w-32 shrink-0">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className={feeInputCls}
                          value={d.deliveryFee}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              districts: form.districts.map((x, i) =>
                                i === index ? { ...x, deliveryFee: e.target.value } : x
                              ),
                            })
                          }
                        />
                        {/* right-3.5, not right-3: this project redefines Tailwind's inset
                            scale (tailwind.config.js), where `3` means 3rem — the suffix was
                            landing 48px in, on top of the right-aligned placeholder. */}
                        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          DH
                        </span>
                      </div>
                      <button
                        type="button"
                        title="Retirer ce quartier"
                        aria-label="Retirer ce quartier"
                        onClick={() =>
                          setForm({
                            ...form,
                            districts: form.districts.filter((_, i) => i !== index),
                          })
                        }
                        className="grid h-10 w-8 shrink-0 place-items-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Bulk paste, because this data arrives as a list. Twenty-one "Ajouter" clicks for
                Casablanca is not how anyone would actually enter it. */}
            <details className="rounded-xl border border-gray-200 p-3 dark:border-gray-700">
              <summary className="cursor-pointer text-xs font-medium text-gray-500">
                Coller une liste de quartiers
              </summary>
              <textarea
                className={`${inputCls} mt-2 h-24 py-2 font-mono text-xs`}
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder={"Anfa\nMaârif\nSidi Bernoussi"}
              />
              <button
                type="button"
                className="mt-2 inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition-colors hover:border-emerald-200 hover:text-emerald-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                onClick={() => {
                  const added = parseBulk(bulk, form.districts);
                  if (!added.length) {
                    notifyError("Rien à ajouter : lignes vides ou déjà présentes.");
                    return;
                  }
                  setForm({ ...form, districts: [...form.districts, ...added] });
                  setBulk("");
                  notifySuccess(`${added.length} quartier(s) ajouté(s).`);
                }}
              >
                Ajouter à la liste
              </button>
            </details>
          </section>
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
            <button
              type="button"
              onClick={() => setRetireTarget(null)}
              className="h-11 rounded-lg px-5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={retire}
              className="h-11 whitespace-nowrap rounded-lg bg-red-500 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600"
            >
              Suspendre
            </button>
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
