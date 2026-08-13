import { useEffect } from "react";
import { useRouter } from "next/router";

// Grossimarché has no separate sign-up: verifying a one-time code on first login creates
// the account. Redirect any /auth/signup visit to the unified OTP login screen.
const Signup = () => {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/login");
  }, [router]);
  return null;
};

export default Signup;
