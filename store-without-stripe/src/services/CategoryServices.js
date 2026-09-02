import requests from "./httpServices";
import { adaptCategoryTree, pageContent } from "./adapters";
import { authHeader } from "@lib/server-token";

const CategoryServices = {
  /**
   * The categories this shopper is offered.
   *
   * Takes a token for the same reason the product reads do: the API returns only the categories
   * holding something priced for the caller's segment, and a server-rendered page runs where the
   * sign-in header does not exist. Called without it, the aisle list comes back as an anonymous
   * visitor's - which is how a pastry shop ended up with "Poisson" in the sidebar filter while
   * the header menu, fetched in the browser, had it right.
   */
  getShowingCategory: async (token = null) => {
    const res = await requests.get("/categories", authHeader(token));
    return adaptCategoryTree(pageContent(res));
  },
};

export default CategoryServices;
