import React from "react";
import useGetCData from "@/hooks/useGetCData";
import NotFoundPage from "@/components/common/NotFoundPage";

const Main = ({ children }) => {
  const { path, accessList } = useGetCData();

  // Empty path is the root ("/"), which the router redirects to /dashboard - let it through.
  // Any other route the current role cannot reach renders the 404 page (defence in depth on
  // top of the backend's role checks).
  if (path && !accessList?.includes(path)) {
    return <NotFoundPage />;
  }
  return (
    <main className="h-full overflow-y-auto">
      <div className="sm:container grid lg:px-6 sm:px-4 px-2 mx-auto">
        {children}
      </div>
    </main>
  );
};

export default Main;
