import requests from "./httpService";
import { adaptStaff, pageContent } from "./adapters";

// Grossimarché back-office auth is passwordless OTP; only ADMIN/STORE_MANAGER may use the
// admin. The role gate lives in useLoginSubmit. Staff management maps to /admin/staff.
const AdminServices = {
  requestOtp: async ({ channel, destination }) => {
    return requests.post("/auth/otp/request", { channel, destination });
  },
  verifyOtp: async ({ channel, destination, code }) => {
    return requests.post("/auth/otp/verify", { channel, destination, code });
  },

  // Staff (ADMIN only on the backend).
  getAllStaff: async () => {
    const res = await requests.get("/admin/staff?size=100");
    // The Staff page + useFilter expect a plain array (they call data.map).
    return pageContent(res).map(adaptStaff);
  },
  addStaff: async (body) => {
    return requests.post("/admin/staff", {
      fullName: body.name || body.fullName,
      phone: body.phone || null,
      email: body.email || null,
      role: body.role === "Super Admin" || body.role === "Admin" ? "ADMIN" : "STORE_MANAGER",
    });
  },
  updateStaff: async (id, body) => {
    return requests.patch(`/admin/staff/${id}`, {
      role: body.role
        ? body.role === "Admin" || body.role === "Super Admin"
          ? "ADMIN"
          : "STORE_MANAGER"
        : null,
      status: body.status || null,
    });
  },
  updateStaffStatus: async (id, body) => {
    return requests.patch(`/admin/staff/${id}`, {
      status: body.status === "Active" ? "ACTIVE" : "BLOCKED",
    });
  },
  deleteStaff: async (id) => {
    return requests.delete(`/admin/staff/${id}`);
  },
  // Signed-in user's own profile. PATCH /me only accepts fullName — changing the e-mail or
  // the phone goes through an OTP verification of the new destination, not this call.
  getProfile: async () => requests.get("/me"),
  updateProfile: async (body) => requests.patch("/me", body),

  // The backend exposes no single-staff endpoint, so resolve the row from the list.
  getStaffById: async (id) => {
    if (!id) return {};
    const res = await requests.get("/admin/staff?size=100");
    const match = pageContent(res).map(adaptStaff).find((s) => s._id === id);
    return match || {};
  },
};

export default AdminServices;
