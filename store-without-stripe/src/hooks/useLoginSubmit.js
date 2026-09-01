import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

//internal import
import { notifyError, notifySuccess } from "@utils/toast";

/**
 * Sign-in with e-mail and password.
 *
 * Nothing is dispatched to UserContext here: it already syncs itself from the NextAuth session
 * (see its useEffect), and writing the user twice is how the two copies drift apart.
 *
 * The API's own message is shown verbatim on failure. It deliberately says something different
 * for "waiting for validation" than for a bad password, and flattening the two into one
 * friendly sentence would leave an approved-but-impatient customer retyping a password that was
 * right the first time.
 */
const useLoginSubmit = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const submitHandler = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: (email || "").trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        notifyError(res.error);
        return;
      }

      notifySuccess("Connexion reussie.");
      const { redirectUrl } = router.query;
      router.push(redirectUrl ? `/${redirectUrl}` : "/user/dashboard");
    } catch (err) {
      notifyError(err?.message || "Echec de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, submitHandler, register, errors, loading };
};

export default useLoginSubmit;
