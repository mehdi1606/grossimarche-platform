import React, { useContext } from "react";
import dynamic from "next/dynamic";
import Drawer from "rc-drawer";

//internal import
import Cart from "@components/cart/Cart";
import { SidebarContext } from "@context/SidebarContext";
import { useTranslate } from "@context/TranslationContext";

const CartDrawer = () => {
  const { cartDrawerOpen, closeCartDrawer } = useContext(SidebarContext);
  // In a right-to-left language the cart belongs on the left, mirroring where the eye
  // expects it - a drawer pinned to the right in Arabic reads as the wrong side of the page.
  const { isRTL } = useTranslate();

  return (
    <Drawer
      open={cartDrawerOpen}
      onClose={closeCartDrawer}
      parent={null}
      level={null}
      placement={isRTL ? "left" : "right"}
    >
      <Cart />
    </Drawer>
  );
};
export default dynamic(() => Promise.resolve(CartDrawer), { ssr: false });
