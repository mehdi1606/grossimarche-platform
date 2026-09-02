import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { FiArrowLeft, FiCheckCircle, FiLock, FiMail, FiShield } from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import CustomerServices from "@services/CustomerServices";
import { notifyError, notifySuccess } from "@utils/toast";

const STEPS = ["Votre e-mail", "Le code reçu", "Nouveau mot de passe"];

/**
 * Forgotten password, in three steps on one page.
 *
 * One page rather than three routes because the e-mail and the code have to survive from the
 * first step to the last: split across routes, a refresh or a back button loses them and the
 * shopper starts over - after already waiting for an e-mail.
 *
 * The code is checked before the password field appears. Asking someone to invent a password
 * and only then telling them the code was wrong wastes the one thing they had to think about.
 *
 * Customers only. Back-office passwords are reissued by an administrator, so nothing here
 * accepts a staff address - the API answers the first step identically either way, which is
 * what stops this page from revealing which addresses are staff.
 */
const ForgetPassword = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const inputCls =
    "h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink-800 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15";

  const sendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return notifyError("Saisissez votre adresse e-mail.");
    setLoading(true);
    try {
      const res = await CustomerServices.forgotPassword(email.trim());
      // The API deliberately says the same thing for an unknown address, so the message is
      // shown as it comes rather than turned into "code envoyé" - which would be a claim we
      // cannot make.
      notifySuccess(res?.message || "Si un compte existe, un code vient d'être envoyé.");
      setStep(1);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Envoi impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const checkCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return notifyError("Saisissez le code reçu par e-mail.");
    setLoading(true);
    try {
      await CustomerServices.verifyResetCode({ email: email.trim(), code: code.trim() });
      setStep(2);
    } catch (err) {
      notifyError(err?.response?.data?.message || "Code invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (password.length < 10) {
      return notifyError("Le mot de passe doit contenir au moins 10 caractères.");
    }
    if (password !== confirm) {
      return notifyError("Les deux mots de passe ne correspondent pas.");
    }
    setLoading(true);
    try {
      await CustomerServices.resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword: password,
      });
      notifySuccess("Mot de passe mis à jour. Connectez-vous.");
      router.push("/auth/login");
    } catch (err) {
      notifyError(err?.response?.data?.message || "Réinitialisation impossible.");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setLoading(true);
    try {
      await CustomerServices.forgotPassword(email.trim());
      notifySuccess("Un nouveau code a été envoyé.");
    } catch (err) {
      notifyError(err?.response?.data?.message || "Envoi impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Mot de passe oublié" description="Réinitialisez votre mot de passe">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="flex w-full justify-center py-8 lg:py-14">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white px-4 py-8 shadow-luxe sm:p-10">
            <div className="mb-8 text-center">
              <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                {step === 0 && <FiMail className="h-6 w-6" />}
                {step === 1 && <FiShield className="h-6 w-6" />}
                {step === 2 && <FiLock className="h-6 w-6" />}
              </span>
              <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                Mot de passe oublié
              </h1>
              <p className="mt-2 text-sm text-ink-500">{STEPS[step]}</p>
            </div>

            {/* Progress. Three dots rather than a bar: the steps are few enough to count, and a
                shopper who has waited for an e-mail wants to see how much is left. */}
            <div className="mb-8 flex items-center justify-center gap-2">
              {STEPS.map((label, i) => (
                <span
                  key={label}
                  className={`h-1.5 rounded-full transition-all ${
                    i < step
                      ? "w-8 bg-emerald-600"
                      : i === step
                      ? "w-8 bg-emerald-400"
                      : "w-4 bg-sand"
                  }`}
                />
              ))}
            </div>

            {step === 0 && (
              <form onSubmit={sendCode} className="grid gap-5">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                    Adresse e-mail du compte
                  </span>
                  <input
                    type="email"
                    autoFocus
                    className={inputCls}
                    placeholder="vous@votre-commerce.ma"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <p className="text-xs leading-relaxed text-ink-400">
                  Nous vous enverrons un code à 6 chiffres, valable 15 minutes.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {loading ? "Envoi…" : "Recevoir le code"}
                </button>
              </form>
            )}

            {step === 1 && (
              <form onSubmit={checkCode} className="grid gap-5">
                <p className="rounded-xl bg-cream px-4 py-3 text-sm text-ink-600">
                  Code envoyé à <strong className="text-ink-800">{email}</strong>. Pensez à
                  vérifier vos spams.
                </p>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                    Code à 6 chiffres
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    className={`${inputCls} text-center font-display text-2xl tracking-[0.5em]`}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {loading ? "Vérification…" : "Vérifier le code"}
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="flex items-center gap-1.5 text-ink-500 transition hover:text-ink-800"
                  >
                    <FiArrowLeft className="h-3.5 w-3.5" />
                    Changer d&apos;adresse
                  </button>
                  <button
                    type="button"
                    onClick={resend}
                    disabled={loading}
                    className="font-medium text-emerald-700 transition hover:underline disabled:opacity-60"
                  >
                    Renvoyer le code
                  </button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={savePassword} className="grid gap-5">
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <FiCheckCircle className="h-4 w-4 shrink-0" />
                  Code vérifié. Choisissez votre nouveau mot de passe.
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                    Nouveau mot de passe
                  </span>
                  <input
                    type="password"
                    autoFocus
                    autoComplete="new-password"
                    className={inputCls}
                    placeholder="10 caractères minimum"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-ink-700">
                    Confirmer le mot de passe
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    className={inputCls}
                    placeholder="Ressaisissez-le"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </label>
                <p className="text-xs leading-relaxed text-ink-400">
                  Toutes vos sessions ouvertes seront fermées : vous devrez vous reconnecter,
                  ici et sur vos autres appareils.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
                </button>
              </form>
            )}

            <div className="mt-8 border-t border-line pt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-emerald-700 hover:underline"
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ForgetPassword;
