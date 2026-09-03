import Cookies from "js-cookie";
import { signOut, useSession } from "next-auth/react";
import React, { createContext, useEffect, useReducer } from "react";

//internal imports
import { setToken } from "@services/httpServices";
import LoadingForSession from "@components/preloader/LoadingForSession";
import cookieOptions from "@utils/cookieOptions";

export const UserContext = createContext();

const initialState = {
  userInfo: Cookies.get("userInfo")
    ? JSON.parse(Cookies.get("userInfo"))
    : null,
  shippingAddress: Cookies.get("shippingAddress")
    ? JSON.parse(Cookies.get("shippingAddress"))
    : {},
  couponInfo: Cookies.get("couponInfo")
    ? JSON.parse(Cookies.get("couponInfo"))
    : {},
};

function reducer(state, action) {
  switch (action.type) {
    case "USER_LOGIN":
      return { ...state, userInfo: action.payload };

    case "USER_LOGOUT":
      return {
        ...state,
        userInfo: null,
      };

    case "SAVE_SHIPPING_ADDRESS":
      return { ...state, shippingAddress: action.payload };

    case "SAVE_COUPON":
      return { ...state, couponInfo: action.payload };
  }
}

export const UserProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { data: session, status } = useSession();
  // const status = "loading";

  useEffect(() => {
    // The session survived but its tokens did not: the refresh was refused, so the account was
    // blocked, rejected, or signed out elsewhere. Ending it here beats leaving the shopper to
    // click through a shop that will refuse every request they make.
    if (session?.error === "RefreshFailed") {
      setToken(null);
      dispatch({ type: "USER_LOGOUT" });
      Cookies.remove("userInfo");
      signOut({ redirect: false });
      return;
    }

    if (status === "authenticated" && session?.user) {
      setToken(session.user.token);
      // Mirror the session into userInfo (cookie + state) so components that read
      // state.userInfo (navbar, dashboard) show the signed-in user.
      dispatch({ type: "USER_LOGIN", payload: session.user });
      Cookies.set("userInfo", JSON.stringify(session.user), cookieOptions());
    } else if (status === "unauthenticated") {
      setToken(null);
      dispatch({ type: "USER_LOGOUT" });
      Cookies.remove("userInfo");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  if (status === "loading") {
    return <LoadingForSession />;
  }

  const value = { state, dispatch };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
