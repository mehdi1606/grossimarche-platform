import Head from "next/head";
import { useRouter } from "next/router";
import { ToastContainer } from "react-toastify";

//internal import

import Navbar from "@layout/navbar/Navbar";
import Footer from "@layout/footer/Footer";
import NavBarTop from "./navbar/NavBarTop";
import MobileFooter from "@layout/footer/MobileFooter";
import FeatureCard from "@components/feature-card/FeatureCard";
import { isRtl } from "@lib/i18n";

const Layout = ({ title, description, children }) => {
  const router = useRouter();
  // Toasts render in their own corner of the DOM, outside the tree that inherits `dir`, so
  // the container is told the direction rather than left to guess it.
  const rtl = isRtl(router?.locale);

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        rtl={rtl}
        theme="light"
      />

      <div className="font-sans">
        <Head>
          <title>
            {title
              ? `Grossimarché | ${title}`
              : "Grossimarché - Marché de gros en ligne au Maroc"}
          </title>
          {description && <meta name="description" content={description} />}
          <link ref="icon" href="/favicon.png" />
        </Head>
        <NavBarTop />
        <Navbar />
        <div className="min-h-[60vh] bg-cream">{children}</div>
        <MobileFooter />
        {/*
          Everything above the fixed bottom bar has to clear it, not just the page body.
          The padding used to sit on `children` alone, so the footer - which comes after -
          ran underneath the bar and lost its last line on every phone.

          `pb-16` matches the bar's own h-16; the safe-area inset is added by the body rule
          in custom.css, so a notched phone clears the home indicator too.
        */}
        <div className="w-full pb-16 lg:pb-0">
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
