import { AdminContext } from "@/context/AdminContext";
import { useLocation } from "react-router-dom";
import { useContext } from "react";
import { accessListForRole } from "@/utils/access";

// Back-office access is role-based. The signed-in user's role (ADMIN | STORE_MANAGER) comes
// from the OTP login (stored on adminInfo.role); the set of reachable routes is derived from
// utils/access.js — there is no per-user encrypted access list anymore.
const useGetCData = () => {
  const { state } = useContext(AdminContext);
  const { adminInfo } = state;

  const location = useLocation();
  const path = location?.pathname?.split("?")[0].split("/")[1];

  const role = adminInfo?.role;
  const accessList = accessListForRole(role);

  return {
    role,
    path,
    accessList,
  };
};

export default useGetCData;
