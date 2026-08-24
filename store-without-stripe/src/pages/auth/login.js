import { useSearchParams } from "next/navigation";
import { FiMail, FiPhone, FiKey, FiShoppingBag } from "react-icons/fi";

//internal  import
import Layout from "@layout/Layout";
import Error from "@components/form/Error";
import useLoginSubmit from "@hooks/useLoginSubmit";
import InputArea from "@components/form/InputArea";
import BottomNavigation from "@components/login/BottomNavigation";

const Login = () => {
  const {
    handleSubmit,
    submitHandler,
    register,
    errors,
    loading,
    channel,
    setChannel,
    codeSent,
    resetFlow,
    resendCode,
  } = useLoginSubmit();

  const isSms = channel === "SMS";
  // Coming from the cart: say why the sign-in is being asked for, instead of dropping the
  // shopper on a bare login form mid-purchase. (An account is required — the order API is
  // authenticated — so the honest move is to explain it, not hide it.)
  const fromCheckout = useSearchParams().get("redirectUrl") === "checkout";

  return (
    <Layout title="Connexion" description="Connexion par code à usage unique">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-10">
        <div className="py-4 flex flex-col lg:flex-row w-full">
          <div className="w-full sm:p-5 lg:p-8">
            <div className="mx-auto w-full max-w-lg justify-center overflow-hidden rounded-2xl border border-line bg-white px-4 py-8 text-left align-middle shadow-luxe transition-all sm:p-10">
              <div className="mx-auto overflow-hidden">
                {fromCheckout && (
                  <div className="mb-6 flex items-start gap-3 rounded-xl bg-emerald-50 p-4">
                    <FiShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <p className="text-sm text-emerald-800">
                      <span className="font-semibold">Votre panier est conservé.</span>{" "}
                      Connectez-vous pour finaliser votre commande — vous reviendrez
                      directement au paiement.
                    </p>
                  </div>
                )}
                <div className="mb-6 text-center">
                  <h2 className="font-display text-3xl font-semibold text-ink-900">
                    {fromCheckout ? "Finaliser ma commande" : "Connexion"}
                  </h2>
                  <p className="mb-6 mt-2 text-sm text-ink-500 md:text-base">
                    Recevez un code à usage unique — pas de mot de passe.
                  </p>
                </div>

                {/* Channel toggle */}
                {!codeSent && (
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    <button
                      type="button"
                      onClick={() => setChannel("SMS")}
                      className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                        isSms
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-line bg-white text-ink-600 hover:border-emerald-400"
                      }`}
                    >
                      Téléphone
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel("EMAIL")}
                      className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                        !isSms
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-line bg-white text-ink-600 hover:border-emerald-400"
                      }`}
                    >
                      Email
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit(submitHandler)}
                  className="flex flex-col justify-center"
                >
                  <div className="grid grid-cols-1 gap-5">
                    {/* Destination (locked once the code is sent) */}
                    <div className="form-group">
                      <InputArea
                        register={register}
                        label={isSms ? "Téléphone" : "Email"}
                        name="destination"
                        type={isSms ? "tel" : "email"}
                        disabled={codeSent}
                        placeholder={isSms ? "+2126XXXXXXXX" : "vous@exemple.ma"}
                        Icon={isSms ? FiPhone : FiMail}
                      />
                      <Error errorName={errors.destination} />
                    </div>

                    {/* Code (second step) */}
                    {codeSent && (
                      <div className="form-group">
                        <InputArea
                          register={register}
                          label="Code à 6 chiffres"
                          name="code"
                          type="text"
                          placeholder="______"
                          Icon={FiKey}
                        />
                        <Error errorName={errors.code} />
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <button
                            type="button"
                            onClick={resetFlow}
                            className="text-gray-500 underline hover:no-underline"
                          >
                            Changer
                          </button>
                          <button
                            type="button"
                            onClick={resendCode}
                            className="text-emerald-600 underline hover:no-underline"
                          >
                            Renvoyer le code
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      disabled={loading}
                      type="submit"
                      className="w-full flex items-center justify-center text-center py-3 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-all focus:outline-none my-1 disabled:opacity-70"
                    >
                      {loading ? (
                        <img
                          src="/loader/spinner.gif"
                          alt="Chargement"
                          width={20}
                          height={10}
                        />
                      ) : codeSent ? (
                        "Vérifier & se connecter"
                      ) : (
                        "Envoyer le code"
                      )}
                    </button>
                  </div>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                  Pas encore de compte ? Saisissez simplement votre téléphone ou e-mail
                  ci-dessus — votre compte est créé automatiquement lors de la première
                  connexion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
