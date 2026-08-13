import Cookies from "js-cookie";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";

//internal import
import { AdminContext } from "@/context/AdminContext";
import AdminServices from "@/services/AdminServices";
import { notifyError, notifySuccess } from "@/utils/toast";

const STAFF_ROLES = ["ADMIN", "STORE_MANAGER"];

// Passwordless OTP login for the back-office. Only ADMIN/STORE_MANAGER accounts are allowed
// in — a CLIENT who verifies a code is rejected here (and would 403 on every admin call).
const useLoginSubmit = () => {
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState("EMAIL"); // "SMS" | "EMAIL"
  const [codeSent, setCodeSent] = useState(false);
  const [destination, setDestination] = useState("");
  const { dispatch } = useContext(AdminContext);
  const history = useHistory();
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
      const res = await AdminServices.requestOtp({ channel, destination: dest });
      setDestination(dest);
      setCodeSent(true);
      notifySuccess(res?.message || `Code envoyé (${res?.maskedDestination || dest}).`);
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (code) => {
    setLoading(true);
    try {
      const res = await AdminServices.verifyOtp({ channel, destination, code });
      const user = res?.user || {};
      if (!STAFF_ROLES.includes(user.role)) {
        return notifyError("Accès réservé au personnel (admin / gérant).");
      }
      const adminInfo = {
        _id: user.id,
        name: user.fullName || "Staff",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        token: res.accessToken,
        refreshToken: res.refreshToken,
      };
      dispatch({ type: "USER_LOGIN", payload: adminInfo });
      Cookies.set("adminInfo", JSON.stringify(adminInfo), {
        expires: 0.5,
        sameSite: "None",
        secure: true,
      });
      notifySuccess("Connexion réussie.");
      history.replace("/dashboard");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async ({ destination: dest, code }) => {
    if (!codeSent) return sendCode(dest);
    return verifyCode(code);
  };

  const resendCode = () => sendCode(getValues("destination") || destination);

  return {
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
  };
};

export default useLoginSubmit;
