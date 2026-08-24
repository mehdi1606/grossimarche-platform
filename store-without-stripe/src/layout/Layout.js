import Head from "next/head";
import { ToastContainer } from "react-toastify";

//internal import

import Navbar from "@layout/navbar/Navbar";
import Footer from "@layout/footer/Footer";
import NavBarTop from "./navbar/NavBarTop";
import MobileFooter from "@layout/footer/MobileFooter";
import FeatureCard from "@components/feature-card/FeatureCard";

const Layout = ({ title, description, children }) => {
  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      <div className="font-sans">
        <Head>
          <title>
            {title
              ? `Grossimarché | ${title}`
              : "Grossimarché — Marché de gros en ligne au Maroc"}
          </title>
          {description && <meta name="description" content={description} />}
          <link ref="icon" href="/favicon.png" />
        </Head>
        <NavBarTop />
        <Navbar />
        <div className="min-h-[60vh] bg-cream pb-16 lg:pb-0">{children}</div>
        <MobileFooter />
        <div className="w-full">
          {/* The reassurance strip sits on the page ground, not in a box of its own. */}
          <div className="relative mx-auto hidden max-w-screen-2xl px-3 py-12 sm:px-10 lg:block">
            <FeatureCard />
          </div>
          {/* No border here: the footer is dark and provides its own edge. */}
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Layout;
