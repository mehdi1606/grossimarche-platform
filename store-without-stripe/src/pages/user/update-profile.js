import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import React, { useEffect, useState } from "react";

//internal import
import Error from "@components/form/Error";
import Dashboard from "@pages/user/dashboard";
import InputArea from "@components/form/InputArea";
import CustomerServices from "@services/CustomerServices";
import { notifySuccess, notifyError } from "@utils/toast";

const UpdateProfile = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { data: session, update } = useSession();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // The backend /me update only accepts the full name; changing phone or email
      // requires a separate one-time-code verification flow.
      await CustomerServices.updateCustomer(session?.user?.id, {
        fullName: data.name,
      });
      await update({
        ...session,
        user: { ...session.user, name: data.name },
      });
      notifySuccess("Profil mis à jour.");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setValue("name", session?.user?.name);
      setValue("email", session?.user?.email);
      setValue("phone", session?.user?.phone);
    }
  }, [session?.user, setValue]);

  return (
    <Dashboard title={t("account.edit_profile")} description={t("account.edit_profile")}>
      <h2 className="mb-6 font-serif text-xl font-semibold text-gray-800">
        {t("account.edit_profile")}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <div className="grid grid-cols-6 gap-6">
          <div className="col-span-6">
            <InputArea
              register={register}
              label={t("account.full_name")}
              name="name"
              type="text"
              placeholder={t("account.full_name_placeholder")}
            />
            <Error errorName={errors.name} />
          </div>

          <div className="col-span-6 sm:col-span-3">
            <InputArea
              register={register}
              label={t("account.phone")}
              name="phone"
              type="tel"
              readOnly={true}
              placeholder="-"
            />
          </div>

          <div className="col-span-6 sm:col-span-3">
            <InputArea
              register={register}
              label={t("account.email")}
              name="email"
              type="email"
              readOnly={true}
              placeholder="-"
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          La modification du téléphone ou de l'email nécessite une vérification par code à
          usage unique.
        </p>

        <div className="mt-6 text-end">
          <button
            disabled={loading}
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-500 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:opacity-70"
          >
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Dashboard>
  );
};

export default UpdateProfile;
