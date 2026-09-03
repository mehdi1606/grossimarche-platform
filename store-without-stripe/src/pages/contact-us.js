import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import Label from "@components/form/Label";
import Error from "@components/form/Error";
import { notifySuccess } from "@utils/toast";
import InputArea from "@components/form/InputArea";

// The address and the heading are translated; the e-mail and the phone number are not - they
// are literals, and `gm-ltr` keeps them reading left-to-right inside an Arabic page.
const CONTACT = [
  {
    Icon: FiMail,
    key: "email",
    lines: ["contact@grossimarche.ma"],
    href: "mailto:contact@grossimarche.ma",
    literal: true,
  },
  {
    Icon: FiPhone,
    key: "phone",
    lines: ["+212 5 22 00 00 00"],
    href: "tel:+2125220000000",
    literal: true,
  },
  {
    Icon: FiMapPin,
    key: "address",
    lineKeys: ["contact.address_line1", "contact.address_line2"],
  },
];

const ContactUs = () => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const submitHandler = () => {
    notifySuccess(t("contact.sent"));
    reset();
  };

  const field =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";

  return (
    <Layout title={t("contact.title")} description={t("contact.meta")}>
      {/* Hero */}
      <section
        data-no-translate
        className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500"
      >
        <div className="mx-auto max-w-screen-2xl px-4 py-14 text-center sm:px-10 lg:py-20">
          <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            {t("contact.hero_title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-emerald-50">
            {t("contact.hero_text")}
          </p>
        </div>
      </section>

      <div data-no-translate className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-10">
        {/* Info cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {CONTACT.map(({ Icon, key, lines, lineKeys, href, literal }) => (
            <div
              key={key}
              className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm"
            >
              <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-500">
                <Icon className="h-6 w-6" />
              </span>
              <h5 className="text-lg font-semibold text-gray-800">{t(`contact.${key}`)}</h5>
              <div className={`mt-1 text-sm text-gray-500 ${literal ? "gm-ltr" : ""}`}>
                {href ? (
                  <a href={href} className="text-emerald-600 hover:underline">
                    {lines[0]}
                  </a>
                ) : (
                  lineKeys.map((k) => <p key={k}>{t(k)}</p>)
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
          <h3 className="mb-6 font-serif text-2xl font-semibold text-gray-800">
            {t("contact.form_title")}
          </h3>
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <InputArea
                  register={register}
                  label={t("contact.name")}
                  name="name"
                  type="text"
                  placeholder={t("contact.name_placeholder")}
                />
                <Error errorName={errors.name} />
              </div>
              <div>
                <InputArea
                  register={register}
                  label={t("contact.email")}
                  name="email"
                  type="email"
                  placeholder={t("contact.email_placeholder")}
                />
                <Error errorName={errors.email} />
              </div>
            </div>
            <div>
              <InputArea
                register={register}
                label={t("contact.subject")}
                name="subject"
                type="text"
                placeholder={t("contact.subject_placeholder")}
              />
              <Error errorName={errors.subject} />
            </div>
            <div>
              <Label label={t("contact.message")} />
              <textarea
                {...register("message", { required: t("contact.message_required") })}
                className={field}
                rows="5"
                placeholder={t("contact.message_placeholder")}
              />
              <Error errorName={errors.message} />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-500 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-emerald-600"
            >
              {t("contact.send")}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ContactUs;
