import React, { useContext } from "react";
import dynamic from "next/dynamic";
import Drawer from "rc-drawer";

import Category from "@components/category/Category";
import { SidebarContext } from "@context/SidebarContext";
import { useTranslate } from "@context/TranslationContext";

const CategoryDrawer = () => {
  const { categoryDrawerOpen, closeCategoryDrawer } =
    useContext(SidebarContext);
  // The categories slide in from the side the page starts on - the same side as the button
  // that opened them. In Arabic that is the right, mirroring the cart drawer opposite it.
  const { isRTL } = useTranslate();

  return (
    <Drawer
      open={categoryDrawerOpen}
      onClose={closeCategoryDrawer}
      parent={null}
      level={null}
      placement={isRTL ? "right" : "left"}
    >
      <Category />
    </Drawer>
  );
};
export default dynamic(() => Promise.resolve(CategoryDrawer), { ssr: false });
