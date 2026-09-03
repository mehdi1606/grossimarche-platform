import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiClock, FiMail } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";

/**
 * What a shop sees after applying.
 *
 * The screen exists because the alternative is worse: an applicant redirected to a login form
 * would try their brand-new password, be refused, and conclude the site is broken. Here the
 * wait is the message, and the next step is named.
 */
const Pending = () => {
  const { t } = useTranslation();

  return (
    <Layout title={t("auth.pending_title")} description={t("auth.pending_meta")}>
      <div data-no-translate className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="flex w-full justify-center py-10">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white px-6 py-10 text-center shadow-luxe sm:p-12">
            <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <FiCheckCircle className="h-8 w-8" />
            </span>

            <h1 className="font-display text-3xl font-semibold text-ink-900">
              {t("auth.pending_title")}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500 md:text-base">
              {t("auth.pending_text")}
            </p>

            <div className="mt-8 grid gap-3 text-start">
              <div className="flex items-start gap-3 rounded-xl bg-cream p-4">
                <FiClock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm text-ink-600">{t("auth.pending_delay")}</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-cream p-4">
                <FiMail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm text-ink-600">{t("auth.pending_email")}</p>
              </div>
            </div>

            <Link
              href="/"
              className="mt-8 inline-block rounded-xl border border-line px-6 py-3 text-sm font-semibold text-ink-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              {t("auth.back_to_shop")}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pending;
