// Grossimarché has no global attribute/variant catalogue (product attributes are simple
// informational key/values on each product). These return empty so the variant UI stays
// dormant until Phase B (variant SKUs) is wired.
const AttributeServices = {
  getAllAttributes: async () => [],
  getShowingAttributes: async () => [],
  getAttributeById: async () => ({}),
};

export default AttributeServices;
