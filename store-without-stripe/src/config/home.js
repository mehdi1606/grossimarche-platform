// -----------------------------------------------------------------------------
// Homepage & global store config (Grossimarché)
//
// Grossimarché has no CMS/settings API, so store-wide settings live here as editable
// config instead of being fetched. Edit this file to change currency, company details,
// and formatting. Homepage layout content (banners, sliders, section titles, limits)
// lives in `src/utils/storeCustomizationSetting.js` and is returned as-is by
// SettingServices.getStoreCustomizationSetting().
// -----------------------------------------------------------------------------

export const globalSetting = {
  default_currency: "DH ", // Moroccan Dirham, shown before the amount (e.g. "DH 289.00")
  default_date_format: "DD/MM/YYYY",
  floating_number: 2,
  company_name: "Grossimarché",
  vat_number: "",
  website: "https://grossimarche.ma",
  address: "Casablanca, Maroc",
  contact: "+212 5 22 00 00 00",
  email: "contact@grossimarche.ma",
  from_email: "no-reply@grossimarche.ma",
  email_to_customer: true,
  meta_title: "Grossimarché — Vente en gros",
  meta_url: "https://grossimarche.ma",
};

export const storeSetting = {
  allow_guest_checkout: false, // Grossimarché checkout requires an authenticated user
  cod_status: true, // cash on delivery (paiement à la livraison)
  default_language: "en",
};

export const seoSetting = {
  meta_title: globalSetting.meta_title,
  meta_description: "Supermarché de gros en ligne au Maroc.",
  meta_url: globalSetting.meta_url,
};
