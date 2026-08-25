import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { IoClose, IoLocationOutline } from "react-icons/io5";
import { FiCheck, FiTruck } from "react-icons/fi";

//internal import
import { DELIVERY_CITIES } from "@utils/delivery";

/**
 * Delivery address.
 *
 * Opens only when the shopper has no saved address (or wants a new one). Validated with
 * react-hook-form; on save it hands the data to the checkout hook, which persists it to
 * /me/addresses and continues the flow.
 *
 * The city is picked from tiles rather than a dropdown. Three served cities is below the point
 * where a dropdown earns its keep, and the fee differs between them - inside a closed select
 * the shopper cannot compare "offerte" against "30 DH" without opening it and reading three
 * lines. Laid out, the choice and its consequence are visible at once, in one click.
 *
 * Country and postcode are gone: everything is delivered to three Moroccan cities, so a
 * country field only ever restates what the city already said, and the postcode was never
 * read by anything - the delivery fee comes from the city alone.
 */
const AddressModal = ({ isOpen, onClose, onSave, saving, defaultValues }) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (isOpen) reset(defaultValues || {});
  }, [isOpen, defaultValues, reset]);

  // Lock body scroll + close on Escape while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="gm-modal-in w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-luxe-lg sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <IoLocationOutline className="text-xl" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-900">
                Adresse de livraison
              </h3>
              <p className="text-sm text-ink-500">Où souhaitez-vous être livré ?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-ink-400 transition hover:bg-sand hover:text-ink-600"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit(onSave)}>
          <div className="space-y-6 px-6 py-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-600">
                Adresse
              </label>
              <input
                {...register("address", { required: "L'adresse est requise." })}
                className="form-input h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink-800 transition duration-200 placeholder:text-ink-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="Rue, quartier, repère…"
              />
              {errors.address && (
                <p className="mt-1.5 text-xs text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div>
              <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <label className="block text-sm font-medium text-ink-600">
                  Ville de livraison
                </label>
                <span className="text-2xs text-ink-400">
                  Offerte dès 1000 DH, quelle que soit la ville
                </span>
              </div>

              <Controller
                name="city"
                control={control}
                rules={{ required: "Choisissez une ville." }}
                render={({ field: { value, onChange } }) => (
                  <div
                    role="radiogroup"
                    aria-label="Ville de livraison"
                    className="grid gap-2.5 sm:grid-cols-3"
                  >
                    {DELIVERY_CITIES.map(({ city, fee }) => {
                      const selected = value === city;
                      return (
                        <button
                          key={city}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => onChange(city)}
                          className={`relative flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition ${
                            selected
                              ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500"
                              : "border-line bg-white hover:border-emerald-200 hover:bg-cream"
                          }`}
                        >
                          {selected && (
                            <span className="absolute right-2.5 top-2.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white">
                              <FiCheck className="h-2.5 w-2.5" />
                            </span>
                          )}
                          <span
                            className={`text-sm font-semibold ${
                              selected ? "text-emerald-900" : "text-ink-800"
                            }`}
                          >
                            {city}
                          </span>
                          <span
                            data-no-translate
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              fee === 0 ? "text-emerald-700" : "text-ink-500"
                            }`}
                          >
                            <FiTruck className="h-3 w-3" />
                            {fee === 0 ? "Offerte" : `${fee} DH`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.city && (
                <p className="mt-1.5 text-xs text-red-500">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-end gap-3 border-t border-line bg-cream px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-sand"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-luxe transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Enregistrement…" : "Enregistrer l'adresse"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .gm-modal-in {
          animation: gmModalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes gmModalIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AddressModal;
