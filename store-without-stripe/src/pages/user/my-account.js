import Link from "next/link";
import React, { useState } from "react";
import { FiEdit2, FiMapPin, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";

//internal imports
import { getUserSession } from "@lib/auth";
import Dashboard from "@pages/user/dashboard";
import AddressForm from "@components/address/AddressForm";
import CustomerServices from "@services/CustomerServices";
import { notifyError, notifySuccess } from "@utils/toast";

/**
 * Customer account: who you are, and where you get delivered.
 *
 * Addresses are managed here rather than on a page of their own. This card used to show only
 * the first of them and send every change to a separate full-page form, so a customer with two
 * shops could see one address, and correcting a street name meant leaving the account and
 * coming back. Adding and editing now happen in place, above the list.
 */
const MyAccount = () => {
  const userInfo = getUserSession();
  // null = form closed, "new" = adding, an address object = editing that one.
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  // "Supprimer" sits next to "Modifier", so it asks once before it destroys anything.
  const [confirmId, setConfirmId] = useState(null);

  const { data, refetch } = useQuery({
    queryKey: ["shippingAddress", { id: userInfo?.id }],
    queryFn: async () => await CustomerServices.getShippingAddress(),
    enabled: !!userInfo?.id,
  });

  const addresses = Array.isArray(data) ? data : [];

  const remove = async (address) => {
    setDeletingId(address.id);
    try {
      await CustomerServices.deleteShippingAddress(address.id);
      notifySuccess("Adresse supprimée.");
      if (editing?.id === address.id) setEditing(null);
      refetch();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  const closeAndRefresh = () => {
    setEditing(null);
    refetch();
  };

  return (
    <Dashboard title="Mon compte" description="Espace client Grossimarché">
      <h2 className="mb-6 font-display text-2xl font-semibold text-ink-900">Mon compte</h2>

      {/* Profil */}
      <section className="relative rounded-2xl border border-line bg-white p-5 shadow-luxe">
        <Link
          href="/user/update-profile"
          className="absolute end-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500 hover:text-white"
        >
          <FiEdit2 className="h-3 w-3" /> Modifier
        </Link>
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-emerald-600 font-display text-2xl font-semibold text-white">
            {(userInfo?.name || userInfo?.email || "?").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 pe-24">
            <h5 className="truncate text-base font-semibold text-ink-800">
              {userInfo?.name || "Client"}
            </h5>
            <p className="truncate text-sm text-ink-500">{userInfo?.email}</p>
            {userInfo?.phone && <p className="text-sm text-ink-500">{userInfo.phone}</p>}
          </div>
        </div>
      </section>

      {/* Adresses de livraison - the sidebar's "Mes adresses" lands on this anchor. */}
      <section id="adresses" className="mt-8 scroll-mt-32">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">
              Adresses de livraison
            </h3>
            <p className="mt-0.5 text-sm text-ink-500">
              {addresses.length === 0
                ? "Aucune adresse enregistrée pour le moment."
                : `${addresses.length} adresse${addresses.length > 1 ? "s" : ""} enregistrée${
                    addresses.length > 1 ? "s" : ""
                  }.`}
            </p>
          </div>

          {editing === null && addresses.length > 0 && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600"
            >
              <FiPlus className="h-4 w-4" />
              Ajouter une adresse
            </button>
          )}
        </div>

        {/* The form opens above the list instead of on another page, so the addresses already
            saved stay in view while a new one is typed. */}
        {editing !== null && (
          <div className="mb-6 rounded-2xl border border-line bg-white p-5 shadow-luxe sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-4">
              <h4 className="font-display text-base font-semibold text-ink-900">
                {editing === "new" ? "Nouvelle adresse" : "Modifier l'adresse"}
              </h4>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Fermer le formulaire"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-sand hover:text-ink-700"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <AddressForm
              // Remounts on target change so the fields reload when switching address.
              key={editing === "new" ? "new" : editing.id}
              initial={editing === "new" ? null : editing}
              onSaved={closeAndRefresh}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        {addresses.length === 0 ? (
          editing === null && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white/60 p-10 text-sm font-medium text-ink-600 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              <FiPlus className="h-6 w-6" />
              Ajouter votre première adresse
              <span className="text-xs font-normal text-ink-400">
                Elle sera pré-remplie à chaque commande.
              </span>
            </button>
          )
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {addresses.map((address) => (
              <article
                key={address.id}
                className={`flex flex-col rounded-2xl border bg-white p-5 shadow-luxe transition ${
                  editing?.id === address.id ? "border-emerald-300" : "border-line"
                }`}
              >
                <div className="flex flex-1 items-start gap-3">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <FiMapPin className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="text-sm font-semibold text-ink-800">
                        {address.label || "Adresse de livraison"}
                      </h5>
                      {address.isDefault && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-2xs font-semibold uppercase tracking-luxe text-emerald-700">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="mt-1 break-words text-sm text-ink-600">
                      {address.addressLine}
                    </p>
                    <p className="text-sm text-ink-400">
                      {address.district ? `${address.district}, ` : ""}
                      {address.city}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
                  {confirmId === address.id ? (
                    <>
                      <span className="me-auto ps-1 text-xs text-ink-500">
                        Supprimer cette adresse ?
                      </span>
                      <button
                        type="button"
                        disabled={deletingId === address.id}
                        onClick={() => remove(address)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                        {deletingId === address.id ? "Suppression..." : "Confirmer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="inline-flex h-9 items-center rounded-lg px-3 text-xs font-medium text-ink-500 transition hover:bg-sand"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(address)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-ink-600 transition hover:bg-sand hover:text-emerald-700"
                      >
                        <FiEdit2 className="h-3.5 w-3.5" /> Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(address.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-ink-500 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" /> Supprimer
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Dashboard>
  );
};

export default MyAccount;
