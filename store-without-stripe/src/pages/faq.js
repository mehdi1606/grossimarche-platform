import React from "react";
import { Disclosure } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import { ChevronUpIcon } from "@heroicons/react/solid";

//internal import
import Layout from "@layout/Layout";

// Keys, not sentences: the list is built at module load, before any hook exists, so each
// question is resolved at render time in the reader's language.
const FAQS = [
  "order",
  "cod",
  "tiers",
  "delivery",
  "minimum",
  "promo",
  "tracking",
  "contact",
];

const Faq = () => {
  const { t } = useTranslation();

  return (
    <Layout title={t("faq.title")} description={t("faq.meta")}>
      {/* Hero */}
      <section
        data-no-translate
        className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500"
      >
        <div className="mx-auto max-w-screen-2xl px-4 py-14 text-center sm:px-10 lg:py-20">
          <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            {t("faq.hero_title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-emerald-50">
            {t("faq.hero_text")}
          </p>
        </div>
      </section>

      <div data-no-translate className="mx-auto max-w-3xl px-4 py-14 sm:px-10">
        <div className="space-y-3">
          {FAQS.map((key) => (
            <Disclosure key={key}>
              {({ open }) => (
                <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                  <Disclosure.Button className="flex w-full items-center justify-between px-5 py-4 text-start text-base font-medium text-gray-800 transition hover:bg-gray-50 focus:outline-none">
                    <span>{t(`faq.q_${key}`)}</span>
                    <ChevronUpIcon
                      className={`${
                        open ? "rotate-180 text-emerald-500" : ""
                      } h-5 w-5 shrink-0 text-gray-400 transition-transform`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-5 pb-5 text-sm leading-7 text-gray-500">
                    {t(`faq.a_${key}`)}
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Faq;
