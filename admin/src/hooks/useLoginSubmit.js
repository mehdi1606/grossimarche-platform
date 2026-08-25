import Cookies from "js-cookie";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";

//internal import
import { AdminContext } from "@/context/AdminContext";
import AdminServices from "@/services/AdminServices";
import { notifyError, notifySuccess } from "@/utils/toast";
import cookieOptions from "@/utils/cookieOptions";

const STAFF_ROLES = ["ADMIN", "STORE_MANAGER"];

/**
 * Back-office sign-in: e-mail + password.
 *
 * Staff open the back-office many times a day, and a one-time code each time was friction
 * that bought no extra safety for an account already restricted by role. Customers are
 * unaffected - the storefront still signs in with a one-time code.
 *
 * The role is checked here as well as on the server: a CLIENT that somehow reached this
 * endpoint would 403 on every admin call anyway, and failing at the door gives a clear
 * message instead of a dashboard full of errors.
 */
const useLoginSubmit = () => {
  const [loading, setLoading] = useState(false);
  const { dispatch } = useContext(AdminContext);
  const history = useHistory();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await AdminServices.login({ email, password });
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
        // True while the account is still on the password that was generated for it; the
        // password screen uses this to insist on a change before anything else.
        mustChangePassword: !!user.mustChangePassword,
      };
      dispatch({ type: "USER_LOGIN", payload: adminInfo });
      Cookies.set("adminInfo", JSON.stringify(adminInfo), cookieOptions({ expires: 0.5 }));

      if (adminInfo.mustChangePassword) {
        notifySuccess("Connexion réussie. Choisissez un nouveau mot de passe.");
        history.replace("/edit-profile");
        return;
      }
      notifySuccess("Connexion réussie.");
      history.replace("/dashboard");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    onSubmit,
    register,
    handleSubmit,
    errors,
    loading,
  };
};

export default useLoginSubmit;
