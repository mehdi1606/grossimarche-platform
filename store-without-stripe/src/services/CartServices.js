import requests from "./httpServices";

// Grossimarché keeps the cart server-side (checkout reads it). The storefront uses
// react-use-cart for UX, then syncs to the server right before validating a coupon or
// placing the order. Product id == Grossimarché product UUID (see adapters.adaptProduct).
const CartServices = {
  getCart: async () => requests.get("/cart"),

  setItem: async (productId, quantity) =>
    requests.put(`/cart/items/${productId}`, { quantity }),

  clearCart: async () => requests.delete("/cart"),

  // Push the whole local cart to the server cart (sequentially, so stock errors surface).
  syncFromLocal: async (items = []) => {
    for (const item of items) {
      await CartServices.setItem(item.id, item.quantity);
    }
    return CartServices.getCart();
  },
};

export default CartServices;
