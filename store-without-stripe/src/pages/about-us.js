import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { FiTag, FiTruck, FiCreditCard, FiUsers, FiArrowRight } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";

// Keys, not sentences: both lists are built at module load, before any hook exists, so the
// words are resolved at render time instead of being frozen in French here.
const STATS = ["online", "country", "cod", "wholesale"];

const VALUES = [
  { Icon: FiTag, key: "price" },
  { Icon: FiTruck, key: "delivery" },
  { Icon: FiCreditCard, key: "trust" },
  { Icon: FiUsers, key: "human" },
];

const AboutUs = () => {
  const { t } = useTranslation();

  return (
    <Layout title={t("about.title")} description={t("about.meta")}>
      {/* Hero */}
      <section
        data-no-translate
        className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500"
      >
        <div className="mx-auto max-w-screen-2xl px-4 py-16 text-center sm:px-10 lg:py-24">
          <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t("about.hero_title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-emerald-50">
            {t("about.hero_text")}
          </p>
        </div>
      </section>

      {/* Stats - same overlap as the home page: `relative z-10` keeps the cards above the
          positioned hero they are pulled onto with -mt-8. */}
      <section
        data-no-translate
        className="relative z-10 mx-auto max-w-screen-2xl px-4 sm:px-10"
      >
        <div className="-mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {STATS.map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm"
            >
              <p className="font-serif text-2xl font-bold text-emerald-600">
                {t(`about.stat_${key}_value`)}
              </p>
              <p className="mt-1 text-xs text-gray-500">{t(`about.stat_${key}_label`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section data-no-translate className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-10">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-2xl font-bold text-gray-800">
            {t("about.mission_title")}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            {t("about.mission_text")}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ Icon, key }) => (
            <div key={key} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-500">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="text-base font-semibold text-gray-800">
                {t(`about.value_${key}_title`)}
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                {t(`about.value_${key}_text`)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl bg-gray-900 px-8 py-10 text-center sm:flex-row sm:text-start">
          <div>
            <h3 className="font-serif text-xl font-bold text-white">
              {t("about.cta_title")}
            </h3>
            <p className="mt-1 text-sm text-gray-300">{t("about.cta_text")}</p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            {t("about.cta_button")} <FiArrowRight className="gm-dir-icon" />
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default AboutUs;
