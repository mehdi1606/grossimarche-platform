import Cookies from "js-cookie";
import { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router";

//internal import
import AdminServices from "@/services/AdminServices";
import { AdminContext } from "@/context/AdminContext";
import { SidebarContext } from "@/context/SidebarContext";
import { notifyError, notifySuccess } from "@/utils/toast";

// Grossimarché staff accounts are passwordless (OTP): a staff member is just a User with role
// ADMIN or STORE_MANAGER. So the form is only name, email, phone and role — no password, no
// per-user route access list (access is derived from the role, see utils/access.js). The
// backend update endpoint only changes role/status.
const useStaffSubmit = (id) => {
  const { state, dispatch } = useContext(AdminContext);
  const { adminInfo } = state;
  const { isDrawerOpen, closeDrawer, setIsUpdate } = useContext(SidebarContext);
  const [resData, setResData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      if (id) {
        const res = await AdminServices.updateStaff(id, { role: data.role });
        const isSameAdmin = adminInfo?._id === id;
        if (isSameAdmin && res) {
          const updated = { ...adminInfo, role: res.role || adminInfo.role };
          dispatch({ type: "USER_LOGIN", payload: updated });
          Cookies.set("adminInfo", JSON.stringify(updated), {
            expires: 0.5,
            sameSite: "None",
            secure: true,
          });
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
        notifySuccess(res?.message || "Staff added successfully!");
      }
      setIsSubmitting(false);
      closeDrawer();
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
  };
};

export default useStaffSubmit;
