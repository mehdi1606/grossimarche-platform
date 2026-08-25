import React, { useState } from "react";
import { Button } from "@windmill/react-ui";
import { FiEye, FiEyeOff } from "react-icons/fi";

//internal import
import Error from "@/components/form/others/Error";
import LabelArea from "@/components/form/selectOption/LabelArea";
import InputArea from "@/components/form/input/InputArea";
// The file is saved with a double extension (login-img.JPG.jpeg) - import it as it is on disk.
import LoginImage from "@/assets/img/login-img.JPG.jpeg";
import useLoginSubmit from "@/hooks/useLoginSubmit";
import CMButton from "@/components/form/button/CMButton";

const Login = () => {
  const { onSubmit, register, handleSubmit, errors, loading } = useLoginSubmit();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex items-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 h-full max-w-4xl mx-auto overflow-hidden bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <div className="flex flex-col overflow-y-auto md:flex-row">
          {/* Brand panel: the trolley photo, in place of the stock office picture that came
              with the template (it showed a Kachabazar dashboard on the laptop screen). */}
          <div className="relative h-40 overflow-hidden bg-emerald-50 md:h-auto md:w-1/2">
            <img
              aria-hidden="true"
              className="h-full w-full object-cover"
              src={LoginImage}
              alt=""
            />
            {/* Light emerald wash so the photo sits in the brand palette; drop this span to
                show it untouched. */}
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-900/20 via-transparent to-transparent" />
          </div>
          <main className="flex items-center justify-center p-6 sm:p-12 md:w-1/2">
            <div className="w-full">
              <h1 className="mb-1 text-2xl font-semibold text-gray-700 dark:text-gray-200">
                Back-office
              </h1>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                Connexion réservée au personnel.
              </p>

              <form onSubmit={handleSubmit(onSubmit)}>
                <LabelArea label="Email" />
                <InputArea
                  required={true}
                  register={register}
                  label="Email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@grossimarche.ma"
                />
                <Error errorName={errors.email} />

                <div className="mt-4" />
                <LabelArea label="Mot de passe" />
                {/* A reveal toggle: a generated password is retyped from an e-mail, and being
                    unable to check what was typed is where those sign-ins go wrong. */}
                <div className="relative">
                  <InputArea
                    required={true}
                    register={register}
                    label="Mot de passe"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-emerald-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <Error errorName={errors.password} />

                {loading ? (
                  <CMButton
                    disabled={loading}
                    type="submit"
                    className="bg-emerald-600 rounded-md mt-6 h-12 w-full"
                    to="/dashboard"
                  />
                ) : (
                  <Button
                    disabled={loading}
                    type="submit"
                    className="mt-6 h-12 w-full"
                    to="/dashboard"
                  >
                    Se connecter
                  </Button>
                )}
              </form>

              <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                Mot de passe oublié ? Demandez à un administrateur de vous en
                envoyer un nouveau par e-mail.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Login;
