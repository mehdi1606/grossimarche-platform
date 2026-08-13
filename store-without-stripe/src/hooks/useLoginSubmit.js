import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

//internal import
import { notifyError, notifySuccess } from "@utils/toast";
import CustomerServices from "@services/CustomerServices";

// Passwordless OTP login: step 1 sends a code to the chosen channel (SMS/EMAIL),
// step 2 verifies it via NextAuth signIn("credentials").
const useLoginSubmit = () => {
  const router = useRouter();
  const redirectUrl = useSearchParams().get("redirectUrl");

  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState("SMS"); // "SMS" | "EMAIL"
  const [codeSent, setCodeSent] = useState(false);
  const [destination, setDestination] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const resetFlow = () => {
    setCodeSent(false);
    setDestination("");
  };

  const sendCode = async (dest) => {
    setLoading(true);
    try {
      const res = await CustomerServices.requestOtp({ channel, destination: dest });
      setDestination(dest);
      setCodeSent(true);
      notifySuccess(
        res?.message || `Un code a été envoyé (${res?.maskedDestination || dest}).`
      );
    } catch (error) {
      notifyError(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        channel,
        destination,
        code,
        callbackUrl: "/user/dashboard",
      });
      if (result?.error) {
        notifyError(result.error);
      } else if (result?.ok) {
        notifySuccess("Connexion réussie.");
        router.push(redirectUrl ? "/checkout" : "/user/dashboard");
      }
    } catch (error) {
      notifyError(error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  // One form, two phases: no code yet => request it; code present => verify it.
  const submitHandler = async ({ destination: dest, code }) => {
    if (!codeSent) {
      return sendCode(dest);
    }
    return verifyCode(code);
  };

  const resendCode = () => sendCode(getValues("destination") || destination);

  return {
    register,
    errors,
    loading,
    handleSubmit,
    submitHandler,
    channel,
    setChannel,
    codeSent,
    resetFlow,
    resendCode,
  };
};

export default useLoginSubmit;
