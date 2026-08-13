import React from "react";
import { Button } from "@windmill/react-ui";

//internal import
import Error from "@/components/form/others/Error";
import LabelArea from "@/components/form/selectOption/LabelArea";
import InputArea from "@/components/form/input/InputArea";
import ImageLight from "@/assets/img/login-office.jpeg";
import ImageDark from "@/assets/img/login-office-dark.jpeg";
import useLoginSubmit from "@/hooks/useLoginSubmit";
import CMButton from "@/components/form/button/CMButton";

const Login = () => {
  const {
    onSubmit,
    register,
    handleSubmit,
    errors,
    loading,
    channel,
    setChannel,
    codeSent,
    resetFlow,
    resendCode,
  } = useLoginSubmit();

  const isSms = channel === "SMS";

  return (
    <div className="flex items-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <div className="flex flex-col overflow-y-auto md:flex-row">
          <div className="h-32 md:h-auto md:w-1/2">
            <img
              aria-hidden="true"
              className="object-cover w-full h-full dark:hidden"
              src={ImageLight}
              alt="Office"
            />
            <img
              aria-hidden="true"
              className="hidden object-cover w-full h-full dark:block"
              src={ImageDark}
              alt="Office"
            />
          </div>
          <main className="flex items-center justify-center p-6 sm:p-12 md:w-1/2">
            <div className="w-full">
              <h1 className="mb-1 text-2xl font-semibold text-gray-700 dark:text-gray-200">
                Back-office
              </h1>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Connexion par code à usage unique — réservé au personnel.
              </p>

              {!codeSent && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setChannel("EMAIL")}
                    className={`py-2 rounded border text-sm font-medium ${
                      !isSms
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("SMS")}
                    className={`py-2 rounded border text-sm font-medium ${
                      isSms
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    Téléphone
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <LabelArea label={isSms ? "Téléphone" : "Email"} />
                <InputArea
                  required={true}
                  register={register}
                  label={isSms ? "Téléphone" : "Email"}
                  name="destination"
                  type={isSms ? "tel" : "email"}
                  disabled={codeSent}
                  placeholder={isSms ? "+2126XXXXXXXX" : "admin@grossimarche.ma"}
                />
                <Error errorName={errors.destination} />

                {codeSent && (
                  <>
                    <div className="mt-4"></div>
                    <LabelArea label="Code à 6 chiffres" />
                    <InputArea
                      required={true}
                      register={register}
                      label="Code"
                      name="code"
                      type="text"
                      placeholder="______"
                    />
                    <Error errorName={errors.code} />
                    <div className="flex justify-between mt-2 text-sm">
                      <button
                        type="button"
                        onClick={resetFlow}
                        className="text-gray-500 underline"
                      >
                        Changer
                      </button>
                      <button
                        type="button"
                        onClick={resendCode}
                        className="text-emerald-600 underline"
                      >
                        Renvoyer le code
                      </button>
                    </div>
                  </>
                )}

                {loading ? (
                  <CMButton
                    disabled={loading}
                    type="submit"
                    className="bg-emerald-600 rounded-md mt-4 h-12 w-full"
                    to="/dashboard"
                  />
                ) : (
                  <Button
                    disabled={loading}
                    type="submit"
                    className="mt-4 h-12 w-full"
                    to="/dashboard"
                  >
                    {codeSent ? "Vérifier & se connecter" : "Envoyer le code"}
                  </Button>
                )}
              </form>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Login;
