import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";

//internal import
import { getUserSession } from "@lib/auth";
import Error from "@components/form/Error";
import Dashboard from "@pages/user/dashboard";
import InputArea from "@components/form/InputArea";
import useGetSetting from "@hooks/useGetSetting";
import CustomerServices from "@services/CustomerServices";
import { notifyError, notifySuccess } from "@utils/toast";
import useUtilsFunction from "@hooks/useUtilsFunction";

const ChangePassword = () => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);

  const { storeCustomizationSetting } = useGetSetting();
  const { showingTranslateValue } = useUtilsFunction();
  const userInfo = getUserSession();

  const onSubmit = async ({ currentPassword, newPassword, confirmPassword }) => {
    if (newPassword !== confirmPassword) {
      notifyError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await CustomerServices.changePassword({ currentPassword, newPassword });
      notifySuccess("Mot de passe modifié.");
      reset({ email: userInfo?.email, currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      // The server explains a refusal in French (wrong current password, same as before, too
      // short); a network failure has no response to read.
      notifyError(
        error?.response?.data?.message ||
          "Le mot de passe n'a pas pu être changé. Réessayez."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setValue("email", userInfo?.email);
  }, []);

  return (
    <Dashboard
      title={showingTranslateValue(
        storeCustomizationSetting?.dashboard?.change_password
      )}
      description="Changer le mot de passe de votre compte"
    >
      <h2 className="text-xl font-serif font-semibold mb-5">
        {showingTranslateValue(
          storeCustomizationSetting?.dashboard?.change_password
        )}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="md:grid-cols-6 md:gap-6">
          <div className="md:mt-0 md:col-span-2">
            <div className="lg:mt-6 bg-white">
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-6">
                  <InputArea
                    register={register}
                    label={showingTranslateValue(
                      storeCustomizationSetting?.dashboard?.user_email
                    )}
                    name="email"
                    type="email"
                    autocomplete="username"
                    placeholder={showingTranslateValue(
                      storeCustomizationSetting?.dashboard?.user_email
                    )}
                    readOnly={true}
                  />
                  <Error errorName={errors.email} />
                </div>
                <div className="col-span-6 sm:col-span-6">
                  <InputArea
                    register={register}
                    label={showingTranslateValue(
                      storeCustomizationSetting?.dashboard?.current_password
                    )}
                    name="currentPassword"
                    type="password"
                    autocomplete="current-password"
                    placeholder={showingTranslateValue(
                      storeCustomizationSetting?.dashboard?.current_password
                    )}
                  />
                  <Error errorName={errors.currentPassword} />
                </div>
                <div className="col-span-6 sm:col-span-6">
                  <InputArea
                    register={register}
                    label={showingTranslateValue(
                      storeCustomizationSetting?.dashboard?.new_password
                    )}
                    name="newPassword"
                    type="password"
                    autocomplete="new-password"
                    placeholder={showingTranslateValue(
                      storeCustomizationSetting?.dashboard?.new_password
                    )}
                    // The server's rule, not a stricter one of our own: at least 10
                    // characters, mixing letters with digits or symbols. The old pattern
                    // demanded 8 with capitals and symbols, so the page and the API disagreed.
                    pattern={/^(?=.*\p{L})(?=.*[^\p{L}]).{10,}$/u}
                    patternMessage="Au moins 10 caractères, avec des lettres et au moins un chiffre ou symbole."
                  />
                  <Error errorName={errors.newPassword} />
                </div>
                <div className="col-span-6 sm:col-span-6">
                  <InputArea
                    register={register}
                    label="Confirmer le nouveau mot de passe"
                    name="confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    placeholder="Ressaisissez le nouveau mot de passe"
                  />
                  <Error errorName={errors.confirmPassword} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 text-end">
          {loading ? (
            <button
              disabled={loading}
              type="submit"
              className="md:text-sm leading-5 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-medium text-center justify-center border-0 border-transparent rounded-md placeholder-white focus-visible:outline-none focus:outline-none bg-emerald-500 text-white px-5 md:px-6 lg:px-8 py-2 md:py-3 lg:py-3 hover:text-white hover:bg-emerald-600 h-12 mt-1 text-sm lg:text-sm w-full sm:w-auto"
            >
              <img
                src="/loader/spinner.gif"
                alt="Chargement"
                width={20}
                height={10}
              />
              <span className="font-serif ms-2 font-light">{t("account.saving")}</span>
            </button>
          ) : (
            <button
              type="submit"
              className="md:text-sm leading-5 inline-flex items-center cursor-pointer transition ease-in-out duration-300 font-medium text-center justify-center border-0 border-transparent rounded-md placeholder-white focus-visible:outline-none focus:outline-none bg-emerald-500 text-white px-5 md:px-6 lg:px-8 py-2 md:py-3 lg:py-3 hover:text-white hover:bg-emerald-600 h-12 mt-1 text-sm lg:text-sm w-full sm:w-auto"
            >
              {showingTranslateValue(
                storeCustomizationSetting?.dashboard?.change_password
              )}
            </button>
          )}
        </div>
      </form>
    </Dashboard>
  );
};

export default ChangePassword;
