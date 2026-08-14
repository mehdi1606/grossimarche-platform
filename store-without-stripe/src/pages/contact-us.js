import React from "react";
import { useForm } from "react-hook-form";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import Label from "@components/form/Label";
import Error from "@components/form/Error";
import { notifySuccess } from "@utils/toast";
import InputArea from "@components/form/InputArea";

const CONTACT = [
  {
    Icon: FiMail,
    title: "Email",
    lines: ["contact@grossimarche.ma"],
    href: "mailto:contact@grossimarche.ma",
  },
  {
    Icon: FiPhone,
    title: "Téléphone",
    lines: ["+212 5 22 00 00 00"],
    href: "tel:+2125220000000",
  },
  {
    Icon: FiMapPin,
    title: "Adresse",
    lines: ["Zone Industrielle Sidi Bernoussi", "Casablanca, Maroc"],
  },
];

const ContactUs = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const submitHandler = () => {
    notifySuccess("Votre message a bien été envoyé. Nous vous répondrons rapidement.");
    reset();
  };

  const field =
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100";

  return (
    <Layout title="Contact" description="Contactez Grossimarché">
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500">
        <div className="mx-auto max-w-screen-2xl px-4 py-14 text-center sm:px-10 lg:py-20">
          <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            Contactez-nous
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-emerald-50">
            Une question sur une commande, un produit ou un partenariat ? Notre équipe est là
            pour vous aider.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-10">
        {/* Info cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {CONTACT.map(({ Icon, title, lines, href }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm"
            >
              <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-500">
                <Icon className="h-6 w-6" />
              </span>
              <h5 className="text-lg font-semibold text-gray-800">{title}</h5>
              <div className="mt-1 text-sm text-gray-500">
                {href ? (
                  <a href={href} className="text-emerald-600 hover:underline">
                    {lines[0]}
                  </a>
                ) : (
                  lines.map((l) => <p key={l}>{l}</p>)
                )}
                {href && lines.slice(1).map((l) => <p key={l}>{l}</p>)}
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-10">
          <h3 className="mb-6 font-serif text-2xl font-semibold text-gray-800">
            Envoyez-nous un message
          </h3>
          <form onSubmit={handleSubmit(submitHandler)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <InputArea register={register} label="Nom" name="name" type="text" placeholder="Votre nom" />
                <Error errorName={errors.name} />
              </div>
              <div>
                <InputArea register={register} label="Email" name="email" type="email" placeholder="vous@email.com" />
                <Error errorName={errors.email} />
              </div>
            </div>
            <div>
              <InputArea register={register} label="Sujet" name="subject" type="text" placeholder="Sujet de votre message" />
              <Error errorName={errors.subject} />
            </div>
            <div>
              <Label label="Message" />
              <textarea
                {...register("message", { required: "Le message est requis." })}
                className={field}
                rows="5"
                placeholder="Comment pouvons-nous vous aider ?"
              />
              <Error errorName={errors.message} />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-emerald-500 px-8 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-emerald-600"
            >
              Envoyer le message
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ContactUs;
