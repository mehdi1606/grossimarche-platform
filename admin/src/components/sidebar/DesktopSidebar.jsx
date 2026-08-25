import React, { useContext } from "react";
import { FiMenu } from "react-icons/fi";
import SidebarContent from "@/components/sidebar/SidebarContent";
import { SidebarContext } from "@/context/SidebarContext";

/**
 * Desktop rail. The collapse toggle lives inside the sidebar, next to the logo. Instead of
 * unmounting the sidebar (which made it vanish in one frame) the aside animates its width
 * and the content fades and slides with it. The inner wrapper keeps a fixed w-64 so the
 * menu does not reflow - text re-wrapping mid-collapse is what makes this look cheap.
 *
 * Once collapsed there is nothing left to click, so a small handle appears against the left
 * edge of the page to bring it back.
 */
const DesktopSidebar = () => {
  const { navBar, setNavBar } = useContext(SidebarContext);

  return (
    <>
      <aside
        aria-hidden={!navBar}
        className={`z-30 hidden flex-shrink-0 overflow-hidden bg-white shadow-sm transition-[width] duration-300 ease-in-out motion-reduce:transition-none dark:bg-gray-800 lg:block ${
          navBar ? "w-64" : "w-0"
        }`}
      >
        <div
          className={`h-full w-64 overflow-y-auto transition-all duration-300 ease-in-out motion-reduce:transition-none ${
            navBar ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
          }`}
        >
          <SidebarContent onToggle={() => setNavBar(false)} />
        </div>
      </aside>

      {!navBar && (
        <button
          type="button"
          onClick={() => setNavBar(true)}
          aria-label="Open menu"
          title="Open menu"
          className="fixed left-0 top-24 z-40 hidden rounded-r-xl border border-l-0 border-gray-200 bg-white p-2.5 text-gray-500 shadow-md transition-colors hover:text-emerald-600 dark:border-gray-700 dark:bg-gray-800 dark:hover:text-emerald-400 lg:block"
        >
          <FiMenu className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

export default DesktopSidebar;
