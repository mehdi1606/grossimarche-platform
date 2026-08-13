import requests from "./httpServices";
import { adaptCategoryTree, pageContent } from "./adapters";

const CategoryServices = {
  getShowingCategory: async () => {
    const res = await requests.get("/categories");
    return adaptCategoryTree(pageContent(res));
  },
};

export default CategoryServices;
