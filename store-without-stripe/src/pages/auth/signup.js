import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheck,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiUser,
} from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import Error from "@components/form/Error";
import InputArea from "@components/form/InputArea";
import CustomerServices from "@services/CustomerServices";
import { clientTypeIcon } from "@utils/clientTypeIcons";
import { notifyError } from "@utils/toast";

/**
 * Applying for a trade account, in two steps.
 *
 * The trade comes first, on its own screen, because it is the question that decides everything
 * else: it selects the price list, and a shop that picks the wrong one is quoted the wrong
 * prices from its first order. Buried as the second field of a long form it was answered
 * without being read - so it now gets the whole screen, as cards rather than a dropdown, where
 * the choice is a picture and a name instead of a line of text you scroll past.
 *
 * Only then does the form appear, with the choice still on screen and still changeable.
 */
const Signup = () => {
  const router = useRouter();
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selected, setSelected] = useState(null);
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
        if (cancelled) return;
        const list = res || [];
        setTypes(list);
        // Arriving from a chooser elsewhere on the site: honour it and go straight to the form
        // rather than asking the same question twice.
        const preset = list.find((t) => t.id === router.query.type);
        if (preset) setSelected(preset);
      })
      .catch(() => {
        if (!cancelled) {
          notifyError("Impossible de charger les activites. Rechargez la page.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router.query.type]);

  const submitHandler = async (data) => {
    setLoading(true);
    try {
      await CustomerServices.register({
        fullName: data.fullName.trim(),
        businessName: data.businessName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        city: data.city?.trim() || null,
        clientTypeId: selected.id,
        password: data.password,
      });
      router.push("/auth/pending");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message || "Inscription impossible.");
    } finally {
      setLoading(false);
    }
  };

  const SelectedIcon = selected ? clientTypeIcon(selected.icon) : null;

  return (
    <Layout title="Ouvrir un compte" description="Demande de compte professionnel">
      <div className="mx-auto max-w-screen-2xl px-3 py-8 sm:px-10 lg:py-14">
        {!selected ? (
          /* ---- Step 1: the trade ---- */
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-brass-50 px-3 py-1 text-2xs font-semibold uppercase tracking-luxe text-brass-600 ring-1 ring-inset ring-brass-200">
                Etape 1 sur 2
              </span>
              <h1 className="mt-4 font-display text-3xl font-semibold text-ink-900 lg:text-4xl">
                Quelle est votre activite ?
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-500 md:text-base">
                Nos tarifs de gros dependent de votre metier. Choisissez le votre pour
                continuer.
              </p>
            </div>

            {loadingTypes ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] animate-pulse rounded-2xl bg-sand"
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : types.length === 0 ? (
              <p className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-ink-500">
                Aucune activite n&apos;est proposee pour le moment. Contactez-nous et nous
                ouvrirons votre compte manuellement.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {types.map((type) => {
                  const Icon = clientTypeIcon(type.icon);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelected(type)}
                      className="group flex aspect-[4/3] flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-white p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-luxe focus:outline-none focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/30"
                    >
                      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cream text-emerald-700 transition duration-300 group-hover:bg-emerald-600 group-hover:text-white">
                        <Icon className="h-7 w-7" strokeWidth={1.5} />
                      </span>
                      <span className="text-sm font-semibold leading-tight text-ink-800">
                        {type.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="mt-10 text-center text-sm text-ink-500">
              Vous avez deja un compte ?{" "}
              <Link href="/auth/login" className="font-semibold text-emerald-700 hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        ) : (
          /* ---- Step 2: the business ---- */
          <div className="mx-auto w-full max-w-xl">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition hover:text-emerald-700"
            >
              <FiArrowLeft className="h-4 w-4" />
              Changer d&apos;activite
            </button>

            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-luxe">
              {/* The choice stays on screen: it decides the prices, so it should not become
                  invisible the moment it is made. */}
              <div className="flex items-center gap-4 border-b border-line bg-cream px-6 py-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
                  <SelectedIcon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-2xs font-semibold uppercase tracking-luxe text-ink-400">
                    Votre activite
                  </p>
                  <p className="truncate font-display text-lg font-semibold text-ink-900">
                    {selected.name}
                  </p>
                </div>
                <FiCheck className="ml-auto h-5 w-5 shrink-0 text-emerald-600" />
              </div>

              <div className="px-6 py-8 sm:px-10">
                <div className="mb-6">
                  <span className="text-2xs font-semibold uppercase tracking-luxe text-brass-600">
                    Etape 2 sur 2
                  </span>
                  <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900">
                    Votre commerce
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">
                    Votre demande est validee par notre equipe, puis vous recevez un e-mail
                    pour vous connecter.
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
        )}
      </div>
    </Layout>
  );
};

export default Signup;
