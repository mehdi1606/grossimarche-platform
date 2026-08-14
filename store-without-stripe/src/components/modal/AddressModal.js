import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { IoClose, IoLocationOutline } from "react-icons/io5";

// Premium, responsive address modal. Opens only when the shopper has no saved delivery
// address (or wants to add a new one). Validated with react-hook-form; on save it hands the
// data up to the checkout hook, which persists it to /me/addresses and continues the flow.
const AddressModal = ({ isOpen, onClose, onSave, saving, defaultValues }) => {
  const {
    register,
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

  const field =
    "form-input w-full rounded-lg border border-gray-200 bg-white px-4 h-12 text-sm text-gray-700 transition duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 placeholder-gray-400";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="gm-modal-in w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-500">
              <IoLocationOutline className="text-xl" />
            </span>
            <div>
              <h3 className="font-serif text-lg font-semibold text-gray-800">
                Delivery address
              </h3>
              <p className="text-sm text-gray-500">
                Where should we deliver your order?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit(onSave)}>
          <div className="grid grid-cols-6 gap-4 px-6 py-6">
            <div className="col-span-6">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">
                Street address
              </label>
              <input
                {...register("address", { required: "Address is required" })}
                className={field}
                placeholder="123 Boulevard Mohammed V"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">
                City
              </label>
              <input
                {...register("city", { required: "City is required" })}
                className={field}
                placeholder="Casablanca"
              />
              {errors.city && (
                <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
              )}
            </div>

            <div className="col-span-3 sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">
                Country
              </label>
              <input
                {...register("country")}
                className={field}
                placeholder="Maroc"
              />
            </div>

            <div className="col-span-3 sm:col-span-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">
                Zip
              </label>
              <input {...register("zipCode")} className={field} placeholder="20000" />
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving…" : "Save address"}
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
