import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FiLock, FiMail, FiShoppingBag } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import Error from "@components/form/Error";
import useLoginSubmit from "@hooks/useLoginSubmit";
import InputArea from "@components/form/InputArea";

const Login = () => {
  const { t } = useTranslation();
  const { handleSubmit, submitHandler, register, errors, loading } = useLoginSubmit();

  // Coming from the cart: say why the sign-in is being asked for, instead of dropping the
  // shopper on a bare form mid-purchase.
  const fromCheckout = useSearchParams().get("redirectUrl") === "checkout";

  return (
    <Layout title={t("auth.login_title")} description={t("auth.login_meta")}>
      {/* Translated from the catalogue, so the LibreTranslate DOM pass leaves it alone. */}
      <div data-no-translate className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="flex w-full flex-col py-4 lg:flex-row">
          <div className="w-full sm:p-5 lg:p-8">
            <div className="mx-auto w-full max-w-lg justify-center overflow-hidden rounded-2xl border border-line bg-white px-4 py-8 text-start align-middle shadow-luxe transition-all sm:p-10">
              {fromCheckout && (
                <div className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                  <FiShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm text-emerald-800">
                    <span className="font-semibold">{t("auth.cart_kept")}</span>{" "}
                    {t("auth.cart_kept_text")}
                  </p>
                </div>
              )}

              <div className="mb-8 text-center">
                <h2 className="font-display text-3xl font-semibold text-ink-900">
                  {fromCheckout ? t("auth.finish_order") : t("auth.login_title")}
                </h2>
                <p className="mt-2 text-sm text-ink-500 md:text-base">
                  {t("auth.login_subtitle")}
                </p>
              </div>

              <form onSubmit={handleSubmit(submitHandler)} className="flex flex-col gap-5">
                <div>
                  <InputArea
                    register={register}
                    label={t("auth.email")}
                    name="email"
                    type="email"
                    placeholder={t("auth.email_placeholder")}
                    Icon={FiMail}
                  />
                  <Error errorName={errors.email} />
                </div>

                <div>
                  <InputArea
                    register={register}
                    label={t("auth.password")}
                    name="password"
                    type="password"
                    placeholder={t("auth.password_placeholder")}
                    Icon={FiLock}
                  />
                  <Error errorName={errors.password} />
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/auth/forget-password"
                    className="text-sm text-emerald-700 transition hover:underline"
                  >
                    {t("auth.forgot")}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {loading ? t("auth.signing_in") : t("auth.sign_in")}
                </button>
              </form>

              <div className="mt-8 border-t border-line pt-6 text-center">
                <p className="text-sm text-ink-500">{t("auth.no_account")}</p>
                <Link
                  href="/auth/signup"
                  className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline"
                >
                  {t("auth.request_account")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
