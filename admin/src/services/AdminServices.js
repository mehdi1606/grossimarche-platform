import requests from "./httpService";
import { adaptStaff, pageContent } from "./adapters";

// Back-office auth is e-mail + password (POST /auth/login). Only ADMIN/STORE_MANAGER accounts
// are accepted - the backend rejects anyone else, and useLoginSubmit checks the role again
// before storing the session. The storefront is unaffected: customers still sign in with a
// one-time code through their own OTP endpoints.
const AdminServices = {
  login: async ({ email, password }) => {
    return requests.post("/auth/login", { email, password });
  },
  changePassword: async ({ currentPassword, newPassword }) => {
    return requests.post("/me/password", { currentPassword, newPassword });
  },

  // Staff (ADMIN only on the backend).
  getAllStaff: async () => {
    const res = await requests.get("/admin/staff?size=100");
    // The Staff page + useFilter expect a plain array (they call data.map).
    return pageContent(res).map(adaptStaff);
  },
  // Creating a staff member does not take a password: the server generates one and e-mails
  // it. The response carries `invitationSent`, and `temporaryPassword` only when the e-mail
  // could not go out - so the admin can still pass the credentials on.
  addStaff: async (body) => {
    return requests.post("/admin/staff", {
      fullName: body.name || body.fullName,
      phone: body.phone || null,
      email: body.email || null,
      role: body.role === "Super Admin" || body.role === "Admin" ? "ADMIN" : "STORE_MANAGER",
    });
  },
  resetStaffPassword: async (id) => {
    return requests.post(`/admin/staff/${id}/reset-password`, {});
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
  // Signed-in user's own profile. PATCH /me only accepts fullName - changing the e-mail or
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
