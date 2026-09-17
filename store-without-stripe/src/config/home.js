// -----------------------------------------------------------------------------
// Homepage & global store config (Market Food)
//
// Market Food has no CMS/settings API, so store-wide settings live here as editable
// config instead of being fetched. Edit this file to change currency, company details,
// and formatting. Homepage layout content (banners, sliders, section titles, limits)
// lives in `src/utils/storeCustomizationSetting.js` and is returned as-is by
// SettingServices.getStoreCustomizationSetting().
// -----------------------------------------------------------------------------

export const globalSetting = {
  default_currency: "DH ", // Moroccan Dirham, shown before the amount (e.g. "DH 289.00")
  default_date_format: "DD/MM/YYYY",
  floating_number: 2,
  company_name: "Market Food",
  vat_number: "",
  website: "https://grossimarche.ma",
  address: "EL Alia N 141, Mohammedia",
  contact: "+212 605 477 544",
  email: "Marketfood26@gmail.com",
  from_email: "Marketfood26@gmail.com",
  email_to_customer: true,
  meta_title: "Market Food - Vente en gros",
  meta_url: "https://grossimarche.ma",
};

export const storeSetting = {
  allow_guest_checkout: false, // Market Food checkout requires an authenticated user
  cod_status: true, // cash on delivery (paiement à la livraison)
  default_language: "en",
};

export const seoSetting = {
  meta_title: globalSetting.meta_title,
  meta_description: "Supermarché de gros en ligne au Maroc.",
  meta_url: globalSetting.meta_url,
};
