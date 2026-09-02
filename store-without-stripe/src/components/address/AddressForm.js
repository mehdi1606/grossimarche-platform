import { useEffect, useMemo, useState } from "react";
import { FiMapPin, FiTruck } from "react-icons/fi";

//internal imports
import CustomerServices from "@services/CustomerServices";
import DeliveryServices from "@services/DeliveryServices";
import { notifyError, notifySuccess } from "@utils/toast";

/**
 * Add or edit one delivery address.
 *
 * Holds exactly the fields the API stores - the template form also asked for a name, a phone,
 * an e-mail, a country and a zip code, none of which /me/addresses accepts. Cities and their
 * districts come from the back-office (/delivery-cities), so a city added or re-priced there
 * reaches the shopper without touching this file.
 */
const AddressForm = ({ initial = null, onSaved, onCancel }) => {
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: initial?.label || "",
    addressLine: initial?.addressLine || "",
    city: initial?.city || "",
    district: initial?.district || "",
    isDefault: !!initial?.isDefault,
  });

  useEffect(() => {
    DeliveryServices.getCities()
      .then(setCities)
      .catch((err) =>
        notifyError(
          err?.response?.data?.message ||
            "Les villes de livraison n'ont pas pu être chargées."
        )
      )
      .finally(() => setLoadingCities(false));
  }, []);

  const selectedCity = useMemo(
    () => cities.find((c) => c.name === form.city) || null,
    [cities, form.city]
  );
  const districts = selectedCity?.districts || [];
  const selectedDistrict = districts.find((d) => d.name === form.district) || null;

  // What this address will be charged: the district's own rate when it has one, otherwise the
  // city's - the same rule the server applies at checkout.
  const fee =
    selectedDistrict &&
    selectedDistrict.deliveryFee !== null &&
    selectedDistrict.deliveryFee !== undefined
      ? Number(selectedDistrict.deliveryFee)
      : selectedCity
      ? Number(selectedCity.deliveryFee)
      : null;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.addressLine.trim()) return notifyError("L'adresse est obligatoire.");
    if (!form.city) return notifyError("Choisissez votre ville de livraison.");
    if (districts.length > 0 && !form.district) {
      return notifyError("Choisissez votre quartier : il détermine les frais de livraison.");
    }

    setSaving(true);
    try {
      const payload = {
        label: form.label.trim() || null,
        addressLine: form.addressLine.trim(),
        city: form.city,
        district: form.district || null,
        isDefault: form.isDefault,
      };
      if (initial?.id) {
        await CustomerServices.updateShippingAddress(initial.id, payload);
        notifySuccess("Adresse mise à jour.");
      } else {
        await CustomerServices.addShippingAddress({ shippingAddressData: payload });
        notifySuccess("Adresse enregistrée.");
      }
      onSaved?.();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    "w-full h-12 rounded-xl border border-line bg-white px-4 text-sm text-ink-800 placeholder-ink-300 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";
  const labelCls = "mb-1.5 block text-sm font-medium text-ink-600";

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className={labelCls}>
          Adresse <span className="text-red-400">*</span>
        </span>
        <input
          type="text"
          className={fieldCls}
          value={form.addressLine}
          onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
          placeholder="12 rue des Orangers, résidence Al Manar"
          maxLength={255}
          required
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>
            Ville <span className="text-red-400">*</span>
          </span>
          <select
            className={`${fieldCls} cursor-pointer`}
            value={form.city}
            disabled={loadingCities}
            onChange={(e) =>
              // Changing city drops the district: a district belongs to one city only.
              setForm({ ...form, city: e.target.value, district: "" })
            }
          >
            <option value="">
              {loadingCities ? "Chargement..." : "Choisissez une ville"}
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelCls}>
            Quartier {districts.length > 0 && <span className="text-red-400">*</span>}
          </span>
          <select
            className={`${fieldCls} cursor-pointer disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-300`}
            value={form.district}
            disabled={districts.length === 0}
            onChange={(e) => setForm({ ...form, district: e.target.value })}
          >
            <option value="">
              {!form.city
                ? "Choisissez d'abord une ville"
                : districts.length === 0
                ? "Pas de quartier pour cette ville"
                : "Choisissez un quartier"}
            </option>
            {districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>Libellé (facultatif)</span>
        <input
          type="text"
          className={fieldCls}
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Boutique, entrepôt, domicile..."
          maxLength={60}
        />
      </label>

      {/* The fee for this exact address, before the order rather than at the last step. */}
      {fee !== null && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <FiTruck className="h-4 w-4 shrink-0" />
          {fee === 0 ? (
            <span>
              Livraison <b>offerte</b> pour cette adresse.
            </span>
          ) : (
            <span>
              Frais de livraison pour cette adresse : <b>{fee.toFixed(2)} DH</b>
            </span>
          )}
        </p>
      )}

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-sand p-3.5">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-ink-300 text-emerald-500 focus:ring-emerald-400"
        />
        <span className="text-sm">
          <span className="block font-medium text-ink-700">Adresse par défaut</span>
          <span className="block text-xs text-ink-400">
            Pré-sélectionnée à chaque commande.
          </span>
        </span>
      </label>

      <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-xl px-5 text-sm font-medium text-ink-600 transition hover:bg-sand"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <FiMapPin className="h-4 w-4" />
          {saving
            ? "Enregistrement..."
            : initial?.id
            ? "Enregistrer les modifications"
            : "Ajouter l'adresse"}
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
