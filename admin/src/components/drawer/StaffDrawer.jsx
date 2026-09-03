import React from "react";
import { Scrollbars } from "react-custom-scrollbars-2";
import { Card, CardBody } from "@windmill/react-ui";
import { useTranslation } from "react-i18next";
import { FiAlertTriangle, FiMail } from "react-icons/fi";

//internal import
import Error from "@/components/form/others/Error";
import Title from "@/components/form/others/Title";
import InputArea from "@/components/form/input/InputArea";
import useStaffSubmit from "@/hooks/useStaffSubmit";
import SelectRole from "@/components/form/selectOption/SelectRole";
import DrawerButton from "@/components/form/button/DrawerButton";
import LabelArea from "@/components/form/selectOption/LabelArea";

// Name, e-mail and role - no password field. The server generates the password and e-mails
// it, so an admin never sets (or sees) another person's credentials. Access to the various
// panels is decided by the role, not a per-user route list.
const StaffDrawer = ({ id }) => {
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    isSubmitting,
    credentials,
    dismissCredentials,
  } = useStaffSubmit(id);
  const { t } = useTranslation();

  // Only reached when the invitation e-mail could not be sent. Shown once - the password is
  // stored as a hash and cannot be retrieved again.
  if (credentials) {
    return (
      <div className="flex h-full w-full flex-col p-6">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Compte créé - e-mail non envoyé
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300/90">
              L'envoi d'e-mails n'est pas configuré sur ce serveur. Notez ces
              identifiants et transmettez-les : ils ne seront plus affichés.
            </p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Identifiant
            </dt>
            <dd className="mt-0.5 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
              <FiMail className="h-4 w-4 shrink-0 text-gray-400" />
              {credentials.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Mot de passe provisoire
            </dt>
            <dd className="mt-0.5 select-all font-mono text-lg font-bold tracking-wide text-emerald-600">
              {credentials.password}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={dismissCredentials}
          className="mt-6 h-11 rounded-lg bg-emerald-500 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
        >
          J'ai noté le mot de passe
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-full relative p-6 border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {id ? (
          <Title
            title={t("UpdateStaff")}
            description={t("UpdateStaffdescription")}
          />
        ) : (
          <Title
            title={t("AddStaffTitle")}
            description={t("AddStaffdescription")}
          />
        )}
      </div>
      <Scrollbars className="w-full md:w-7/12 lg:w-8/12 xl:w-8/12 relative dark:bg-gray-700 dark:text-gray-200">
        <Card className="overflow-y-scroll flex-grow scrollbar-hide w-full max-h-full">
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="px-6 pt-8 flex-grow scrollbar-hide w-full max-h-full pb-40">
                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="Nom" />
                  <div className="col-span-8 sm:col-span-4">
                    <InputArea
                      required={true}
                      register={register}
                      label="Nom"
                      name="name"
                      type="text"
                      autoComplete="username"
                      placeholder="Nom du membre"
                    />
                    <Error errorName={errors.name} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="E-mail" />
                  <div className="col-span-8 sm:col-span-4">
                    <InputArea
                      required={true}
                      register={register}
                      label="E-mail"
                      name="email"
                      type="text"
                      autoComplete="username"
                      pattern={
                        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
                      }
                      placeholder="E-mail"
                    />
                    <Error errorName={errors.email} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="Contact Number" />
                  <div className="col-span-8 sm:col-span-4">
                    <InputArea
                      register={register}
                      label="Contact Number"
                      name="phone"
                      pattern={/^[+]?\d*$/}
                      minLength={6}
                      maxLength={15}
                      type="text"
                      placeholder="Numéro de téléphone"
                    />
                    <Error errorName={errors.phone} />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3 md:gap-5 xl:gap-6 lg:gap-6 mb-6">
                  <LabelArea label="Rôle" />
                  <div className="col-span-8 sm:col-span-4">
                    <SelectRole register={register} label="Rôle" name="role" />
                    <Error errorName={errors.role} />
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Un mot de passe provisoire est généré et envoyé à cette adresse
                  e-mail. Le nouveau membre devra le remplacer à sa première
                  connexion. L'accès à chaque panneau dépend du rôle.
                </p>
              </div>

              <DrawerButton
                id={id}
                title="Membre"
                zIndex="z-5"
                isSubmitting={isSubmitting}
              />
            </form>
          </CardBody>
        </Card>
      </Scrollbars>
    </>
  );
};

export default StaffDrawer;
