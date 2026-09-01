import Link from "next/link";
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
  return (
    <Layout title="Demande envoyee" description="Votre demande de compte est en cours d examen">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="flex w-full justify-center py-10">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white px-6 py-10 text-center shadow-luxe sm:p-12">
            <span className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
              <FiCheckCircle className="h-8 w-8" />
            </span>

            <h1 className="font-display text-3xl font-semibold text-ink-900">
              Demande envoyee
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500 md:text-base">
              Merci. Votre compte est cree et attend la validation de notre equipe.
            </p>

            <div className="mt-8 grid gap-3 text-left">
              <div className="flex items-start gap-3 rounded-xl bg-cream p-4">
                <FiClock className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm text-ink-600">
                  Nous verifions votre commerce, generalement sous 24 a 48 heures ouvrables.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-cream p-4">
                <FiMail className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-sm text-ink-600">
                  Vous recevrez un e-mail des que votre compte sera actif. Vos tarifs
                  apparaitront alors automatiquement.
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="mt-8 inline-block rounded-xl border border-line px-6 py-3 text-sm font-semibold text-ink-700 transition hover:border-emerald-400 hover:text-emerald-700"
            >
              Retour a la boutique
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Pending;
