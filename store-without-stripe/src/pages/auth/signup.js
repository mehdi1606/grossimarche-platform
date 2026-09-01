import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { FiBriefcase, FiLock, FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import Error from "@components/form/Error";
import InputArea from "@components/form/InputArea";
import CustomerServices from "@services/CustomerServices";
import { notifyError } from "@utils/toast";

/**
 * Applying for a trade account.
 *
 * Not a signup that logs you in: it opens a request. Grossimarche sells at wholesale, and what
 * a shop pays depends on what kind of shop it is, so the merchant recognises the business
 * before any price is shown. The form says so up front rather than letting someone fill it in
 * expecting to shop immediately.
 *
 * The client type is asked here because it decides the whole price list. An admin can correct
 * it at validation - applicants do pick the wrong trade - but it cannot be left empty.
 */
const Signup = () => {
  const router = useRouter();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    let cancelled = false;
    CustomerServices.getClientTypes()
      .then((res) => {
        if (!cancelled) setTypes(res || []);
      })
      .catch(() => {
        // A failed lookup must not leave a form that cannot be submitted with no explanation.
        if (!cancelled) notifyError("Impossible de charger les categories. Rechargez la page.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The chooser on the landing page only pre-selects here; it has no effect on prices, which
  // nobody sees before validation anyway.
  const preselected = router.query.type;

  const submitHandler = async (data) => {
    setLoading(true);
    try {
      await CustomerServices.register({
        fullName: data.fullName.trim(),
        businessName: data.businessName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        city: data.city?.trim() || null,
        clientTypeId: data.clientTypeId,
        password: data.password,
      });
      router.push("/auth/pending");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message || "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Ouvrir un compte" description="Demande de compte professionnel">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="flex w-full flex-col py-4 lg:flex-row">
          <div className="w-full sm:p-5 lg:p-8">
            <div className="mx-auto w-full max-w-xl justify-center overflow-hidden rounded-2xl border border-line bg-white px-4 py-8 text-left align-middle shadow-luxe transition-all sm:p-10">
              <div className="mb-6 text-center">
                <h2 className="font-display text-3xl font-semibold text-ink-900">
                  Ouvrir un compte professionnel
                </h2>
                <p className="mt-2 text-sm text-ink-500 md:text-base">
                  Nos tarifs dependent de votre activite. Votre demande est validee par notre
                  equipe, puis vous recevez un e-mail pour vous connecter.
                </p>
              </div>

              <form onSubmit={handleSubmit(submitHandler)} className="flex flex-col gap-5">
                <div>
                  <InputArea
                    register={register}
                    label="Nom du commerce"
                    name="businessName"
                    type="text"
                    placeholder="Patisserie Al Manar"
                    Icon={FiBriefcase}
                  />
                  <Error errorName={errors.businessName} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700">
                    Type d&apos;activite
                  </label>
                  <select
                    {...register("clientTypeId", { required: "Choisissez votre activite" })}
                    defaultValue={preselected || ""}
                    className="mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="" disabled>
                      Choisissez votre activite
                    </option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <Error errorName={errors.clientTypeId} />
                </div>

                <div>
                  <InputArea
                    register={register}
                    label="Votre nom"
                    name="fullName"
                    type="text"
                    placeholder="Prenom et nom"
                    Icon={FiUser}
                  />
                  <Error errorName={errors.fullName} />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <InputArea
                      register={register}
                      label="Telephone"
                      name="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      Icon={FiPhone}
                    />
                    <Error errorName={errors.phone} />
                  </div>
                  <div>
                    <InputArea
                      register={register}
                      label="Ville"
                      name="city"
                      type="text"
                      required={false}
                      placeholder="Casablanca"
                      Icon={FiMapPin}
                    />
                    <Error errorName={errors.city} />
                  </div>
                </div>

                <div>
                  <InputArea
                    register={register}
                    label="Adresse e-mail"
                    name="email"
                    type="email"
                    placeholder="vous@votre-commerce.ma"
                    Icon={FiMail}
                  />
                  <Error errorName={errors.email} />
                </div>

                <div>
                  <InputArea
                    register={register}
                    label="Mot de passe"
                    name="password"
                    type="password"
                    placeholder="10 caracteres minimum"
                    Icon={FiLock}
                  />
                  <Error errorName={errors.password} />
                  <p className="mt-1.5 text-xs text-ink-400">
                    Au moins 10 caracteres. C&apos;est vous qui le choisissez.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {loading ? "Envoi..." : "Envoyer ma demande"}
                </button>
              </form>

              <div className="mt-8 border-t border-line pt-6 text-center">
                <p className="text-sm text-ink-500">Vous avez deja un compte ?</p>
                <Link
                  href="/auth/login"
                  className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;
