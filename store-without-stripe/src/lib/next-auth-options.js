import Credentials from "next-auth/providers/credentials";

import CustomerServices from "@services/CustomerServices";

/**
 * Storefront sign-in: e-mail + password, through NextAuth's session machinery.
 *
 * The session carries `status` and the client type as well as the token. The storefront cannot
 * render itself without them - a PENDING customer gets the waiting screen rather than the shop,
 * and the segment is what the entire catalogue is priced against - and re-fetching that on
 * every page would be a request per navigation.
 *
 * The API is the authority: it refuses tokens to an account that is not ACTIVE, so a stale
 * session cannot buy anything even if the storefront were fooled.
 */
export const getDynamicAuthOptions = async () => {
  const providers = [
    Credentials({
      name: "Password",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async ({ email, password }) => {
        try {
          const res = await CustomerServices.login({ email, password });
          const u = res?.user || {};
          return {
            _id: u.id,
            name: u.fullName || "",
            businessName: u.businessName || "",
            email: u.email || "",
            phone: u.phone || "",
            role: u.role || "CLIENT",
            status: u.status || "ACTIVE",
            clientTypeId: u.clientTypeId || "",
            clientTypeName: u.clientTypeName || "",
            image: "",
            address: "",
            token: res?.accessToken,
            refreshToken: res?.refreshToken,
          };
        } catch (error) {
          // The API distinguishes "wrong password" from "waiting for validation" on purpose;
          // passing its message through is the whole point, so the shopper is not left
          // retyping a password that was correct all along.
          const message =
            error.response?.data?.message || "Echec de la connexion. Reessayez.";
          throw new Error(message);
        }
      },
    }),
  ];

  const authOptions = {
    providers,
    pages: { signIn: "/auth/login" },
    callbacks: {
      async jwt({ token, user, trigger, session }) {
        if (user) {
          token.id = user._id;
          token.name = user.name;
          token.businessName = user.businessName;
          token.email = user.email;
          token.phone = user.phone;
          token.role = user.role;
          token.status = user.status;
          token.clientTypeId = user.clientTypeId;
          token.clientTypeName = user.clientTypeName;
          token.image = user.image;
          token.address = user.address;
          token.token = user.token;
          token.refreshToken = user.refreshToken;
        }
        if (trigger === "update" && session) {
          return { ...token, ...session.user };
        }
        return token;
      },
      async session({ session, token }) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.businessName = token.businessName;
        session.user.email = token.email;
        session.user.phone = token.phone;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.clientTypeId = token.clientTypeId;
        session.user.clientTypeName = token.clientTypeName;
        session.user.image = token.image;
        session.user.address = token.address;
        session.user.token = token.token;
        session.user.refreshToken = token.refreshToken;
        return session;
      },
      async redirect({ url, baseUrl }) {
        return url.startsWith(baseUrl) ? url : `${baseUrl}/user/dashboard`;
      },
    },
    secret: process.env.NEXTAUTH_SECRET,
  };

  return authOptions;
};
