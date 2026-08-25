import Cookies from "js-cookie";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router";

//internal import
import AdminServices from "@/services/AdminServices";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import { notifyError, notifySuccess } from "@/utils/toast";
import cookieOptions from "@/utils/cookieOptions";

// A staff member is a User with role ADMIN or STORE_MANAGER. The form is name, email, phone
// and role — never a password: the server generates one, stores only its hash and e-mails it,
// so nobody (not even the admin creating the account) chooses someone else's password. There
// is no per-user route list either; access is derived from the role (see utils/access.js).
// The backend update endpoint only changes role/status.
const useStaffSubmit = (id) => {
  const { state, dispatch } = useContext(AdminContext);
  const { adminInfo } = state;
  const { isDrawerOpen, closeDrawer, setIsUpdate } = useContext(SidebarContext);
  const [resData, setResData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Only populated when the invitation e-mail could not be delivered (see onSubmit).
  const [credentials, setCredentials] = useState(null);

  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    // Set when the account was created but its password could not be e-mailed: the drawer
    // then stays open so the admin can copy it. A state value would still be the previous
    // one at the point we decide, so this is tracked locally.
    let keepDrawerOpen = false;
    try {
      setIsSubmitting(true);
      if (id) {
        const res = await AdminServices.updateStaff(id, { role: data.role });
        const isSameAdmin = adminInfo?._id === id;
        if (isSameAdmin && res) {
          const updated = { ...adminInfo, role: res.role || adminInfo.role };
          dispatch({ type: "USER_LOGIN", payload: updated });
          Cookies.set("adminInfo", JSON.stringify(updated), cookieOptions({ expires: 0.5 }));
        }
        setIsUpdate(true);
        notifySuccess("Staff Updated Successfully!");
      } else {
        const res = await AdminServices.addStaff({
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role,
        });
        setIsUpdate(true);
        if (res?.invitationSent === false && res?.temporaryPassword) {
          keepDrawerOpen = true;
          // Mail is not configured on this deployment. The password is shown once, here, and
          // is unreadable afterwards — so it is surfaced rather than lost with the account.
          setCredentials({
            email: res.email,
            password: res.temporaryPassword,
          });
          notifyError(
            "Compte créé, mais l'e-mail n'a pas pu être envoyé. Transmettez le mot de passe affiché."
          );
        } else {
          notifySuccess(
            `Compte créé. Le mot de passe a été envoyé à ${res?.email || data.email}.`
          );
        }
      }
      setIsSubmitting(false);
      // Closing the drawer would destroy the only copy of the password.
      if (!keepDrawerOpen) closeDrawer();
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
      setIsSubmitting(false);
    }
  };

  const getStaffData = async () => {
    try {
      const res = await AdminServices.getStaffById(id);
      if (res && res._id) {
        setResData(res);
        setValue("name", typeof res.name === "object" ? res.name?.en : res.name);
        setValue("email", res.email);
        setValue("phone", res.phone);
        setValue("role", res.role);
      }
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    }
  };

  useEffect(() => {
    if (!isDrawerOpen) {
      setCredentials(null);
      setResData({});
      setValue("name");
      setValue("email");
      setValue("phone");
      setValue("role");
      clearErrors(["name", "email", "phone", "role"]);
      return;
    }
    if (id) {
      getStaffData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, setValue, isDrawerOpen, clearErrors]);

  useEffect(() => {
    if (location.pathname === "/edit-profile" && Cookies.get("adminInfo")) {
      getStaffData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, setValue]);

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    adminInfo,
    resData,
    isSubmitting,
    credentials,
    dismissCredentials: () => {
      setCredentials(null);
      closeDrawer();
    },
  };
};

export default useStaffSubmit;
