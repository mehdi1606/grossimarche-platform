import Credentials from "next-auth/providers/credentials";

import CustomerServices from "@services/CustomerServices";

// Grossimarché passwordless auth wired through NextAuth's session/token machinery.
// The storefront sends { channel, destination, code } to signIn("credentials", …);
// authorize() verifies the OTP and returns the user + tokens, which the jwt/session
// callbacks propagate to session.user.token (read by UserContext -> setToken).
export const getDynamicAuthOptions = async () => {
  const providers = [
    Credentials({
      name: "OTP",
      credentials: {
        channel: { label: "Channel", type: "text" },
        destination: { label: "Destination", type: "text" },
        code: { label: "Code", type: "text" },
      },
      authorize: async ({ channel, destination, code }) => {
        try {
          const res = await CustomerServices.verifyOtp({ channel, destination, code });
          const u = res?.user || {};
          return {
            _id: u.id,
            name: u.fullName || "",
            email: u.email || "",
            phone: u.phone || "",
            role: u.role || "CLIENT",
            image: "",
            address: "",
            token: res?.accessToken,
            refreshToken: res?.refreshToken,
          };
        } catch (error) {
          const message =
            error.response?.data?.message || "Échec de la connexion. Réessayez.";
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
          token.email = user.email;
          token.phone = user.phone;
          token.role = user.role;
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
        session.user.email = token.email;
        session.user.phone = token.phone;
        session.user.role = token.role;
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
