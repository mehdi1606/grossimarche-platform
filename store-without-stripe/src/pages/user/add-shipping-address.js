import { useEffect } from "react";
import { useRouter } from "next/router";

//internal imports
import Loading from "@components/preloader/Loading";

/**
 * Kept only so old links and bookmarks keep working.
 *
 * Addresses are added and edited inside the account page now: keeping a second, full-page copy
 * of the same form would mean two places to change and two ways to be inconsistent.
 */
const AddShippingAddress = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/user/my-account#adresses");
  }, [router]);

  return <Loading loading={true} />;
};

export default AddShippingAddress;
