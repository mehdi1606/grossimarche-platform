import React, { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { FiAlertTriangle, FiKey, FiLock, FiMail, FiPhone, FiUser } from "react-icons/fi";

//internal import
import { AdminContext } from "@/context/AdminContext";
import AdminServices from "@/services/AdminServices";
import PageTitle from "@/components/Typography/PageTitle";
import { notifyError, notifySuccess } from "@/utils/toast";
import cookieOptions from "@/utils/cookieOptions";

const ROLE_LABEL = {
  ADMIN: "Administrator",
  STORE_MANAGER: "Store manager",
};

const ROLE_STYLE = {
  ADMIN: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  STORE_MANAGER: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
};

/**
 * Own-profile page. Only the full name is editable: PATCH /me takes nothing else, e-mail and
 * phone are the sign-in identity (a change requires verifying the new destination with a
 * code), and the role is granted from the Staff page - never self-assigned. Those three are
 * therefore shown read-only instead of being offered as inputs that quietly do nothing,
 * which is what the previous version did.
 */
const EditProfile = () => {
  const {
    state: { adminInfo },
    dispatch,
  } = useContext(AdminContext);

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change. `mustChangePassword` is set by the server while the account is still on
  // the password that was generated for it when it was created.
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const mustChangePassword =
    profile?.mustChangePassword ?? adminInfo?.mustChangePassword ?? false;

  useEffect(() => {
    let active = true;
    AdminServices.getProfile()
      .then((res) => {
        if (!active) return;
        setProfile(res);
        setFullName(res?.fullName || "");
      })
      .catch((err) =>
        notifyError(err?.response?.data?.message || err?.message)
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const initial = (fullName || profile?.email || "?").charAt(0).toUpperCase();
  const role = profile?.role || adminInfo?.role;
  const dirty = fullName.trim() !== (profile?.fullName || "");

  const save = async (e) => {
    e.preventDefault();
    if (!dirty || !fullName.trim()) return;
    setSaving(true);
    try {
      const updated = await AdminServices.updateProfile({
        fullName: fullName.trim(),
      });
      setProfile(updated);
      // Keep the header avatar and the session cookie in step with the new name.
      const next = { ...adminInfo, name: updated?.fullName || adminInfo?.name };
      dispatch({ type: "USER_LOGIN", payload: next });
      Cookies.set("adminInfo", JSON.stringify(next), cookieOptions({ expires: 0.5 }));
      notifySuccess("Profile updated.");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return notifyError("Les deux mots de passe ne correspondent pas.");
    }
    setChangingPassword(true);
    try {
      await AdminServices.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // The flag lives in three places (server, cookie, context); clear all of them so the
      // banner disappears without needing a fresh sign-in.
      setProfile((p) => (p ? { ...p, mustChangePassword: false } : p));
      const next = { ...adminInfo, mustChangePassword: false };
      dispatch({ type: "USER_LOGIN", payload: next });
      Cookies.set("adminInfo", JSON.stringify(next), cookieOptions({ expires: 0.5 }));
      notifySuccess("Mot de passe mis à jour.");
    } catch (err) {
      notifyError(err?.response?.data?.message || err?.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const passwordReady =
    currentPassword.length > 0 &&
    newPassword.length >= 10 &&
    confirmPassword.length > 0;

  const inputCls =
    "w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 placeholder-gray-400 transition-colors hover:border-gray-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder-gray-500";

  const readOnlyCls =
    "flex h-11 w-full items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400";

  if (loading) {
    return (
      <>
        <PageTitle>Edit profile</PageTitle>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-2xl bg-white dark:bg-gray-800" />
          <div className="h-64 animate-pulse rounded-2xl bg-white lg:col-span-2 dark:bg-gray-800" />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle>Edit profile</PageTitle>

      {mustChangePassword && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <FiAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              Choisissez un nouveau mot de passe
            </p>
            <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300/90">
              Votre compte utilise encore le mot de passe provisoire reçu par e-mail.
              Remplacez-le ci-dessous.
            </p>
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        {/* identity summary */}
        <section className="rounded-2xl bg-white p-6 text-center shadow-sm dark:bg-gray-800">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl font-semibold text-white shadow-lg shadow-emerald-500/30">
            {initial}
          </span>
          <h3 className="mt-4 font-serif text-lg font-semibold text-gray-800 dark:text-gray-100">
            {profile?.fullName || "Unnamed staff"}
          </h3>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
              ROLE_STYLE[role] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {ROLE_LABEL[role] || role || "-"}
          </span>
          <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Signed in with
            <br />
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {profile?.email || profile?.phone || "-"}
            </span>
          </p>
        </section>

        {/* editable details */}
        <section className="rounded-2xl bg-white shadow-sm dark:bg-gray-800 lg:col-span-2">
          <form onSubmit={save}>
            <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-700">
              <h3 className="font-serif text-base font-semibold text-gray-800 dark:text-gray-100">
                Personal information
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The name shown across the back-office and on the orders you handle.
              </p>
            </div>

            <div className="space-y-5 px-6 py-5">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Full name
                </span>
                <div className="relative">
                  <FiUser className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className={`${inputCls} pl-10`}
                    placeholder="Mehdi Houari"
                    value={fullName}
                    maxLength={150}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </label>
            </div>

            <div className="border-t border-gray-100 px-6 py-5 dark:border-gray-700">
              <h3 className="font-serif text-base font-semibold text-gray-800 dark:text-gray-100">
                Sign-in details
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                These identify your account, so they cannot be edited here - changing one
                requires verifying the new address or number with a code.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="text-sm">
                  <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                    Email
                  </span>
                  <div className={readOnlyCls}>
                    <FiMail className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{profile?.email || "-"}</span>
                    <FiLock className="h-3.5 w-3.5 shrink-0" />
                  </div>
                </div>
                <div className="text-sm">
                  <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                    Phone
                  </span>
                  <div className={readOnlyCls}>
                    <FiPhone className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{profile?.phone || "-"}</span>
                    <FiLock className="h-3.5 w-3.5 shrink-0" />
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Your role is{" "}
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {ROLE_LABEL[role] || role || "-"}
                </span>
                . Roles are granted from the Staff page by an administrator.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/60">
              <button
                type="button"
                onClick={() => setFullName(profile?.fullName || "")}
                disabled={!dirty || saving}
                className="h-11 rounded-lg px-4 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={!dirty || !fullName.trim() || saving}
                className="h-11 rounded-lg bg-emerald-500 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* password */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="hidden lg:block" />
        <section className="rounded-2xl bg-white shadow-sm dark:bg-gray-800 lg:col-span-2">
          <form onSubmit={changePassword}>
            <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-700">
              <h3 className="flex items-center gap-2 font-serif text-base font-semibold text-gray-800 dark:text-gray-100">
                <FiKey className="h-4 w-4" />
                Mot de passe
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Au moins 10 caractères, mêlant lettres et chiffres ou symboles.
              </p>
            </div>

            <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Mot de passe actuel
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  className={inputCls}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Nouveau mot de passe
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputCls}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-gray-600 dark:text-gray-300">
                  Confirmer
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  className={inputCls}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                  <span className="mt-1 block text-xs text-red-500">
                    Les deux mots de passe ne correspondent pas.
                  </span>
                )}
              </label>
            </div>

            <div className="flex items-center justify-end rounded-b-2xl border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/60">
              <button
                type="submit"
                disabled={!passwordReady || changingPassword}
                className="h-11 rounded-lg bg-emerald-500 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changingPassword ? "Enregistrement…" : "Changer le mot de passe"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
};

export default EditProfile;
