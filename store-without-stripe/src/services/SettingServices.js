// Homepage LAYOUT content (hero, banners, section order, SEO copy) is presentation and stays
// in local config (src/config/home.js) - there is no CMS backend for it. Everything that IS
// backed by the API is fetched live: the language list comes from /languages and the active
// currency from /currencies/default.
import requests from "./httpServices";
import { storeCustomization } from "@utils/storeCustomizationSetting";
import { globalSetting, storeSetting, seoSetting } from "@config/home";

const SettingServices = {
  getStoreSetting: async () => storeSetting,

  getStoreSeoSetting: async () => seoSetting,

  getStoreCustomizationSetting: async () => storeCustomization,

  // Enabled UI languages, backend-driven.
  getShowingLanguage: async () => {
    try {
      const res = await requests.get("/languages");
      const list = Array.isArray(res) ? res : res?.content ?? [];
      return list.map((l) => ({
        name: l.name,
        iso_code: l.isoCode,
        flag: l.flag || "",
      }));
    } catch (err) {
      // Fall back to the default locale so the storefront still renders if the API is down.
      return [{ name: "Français", iso_code: "fr", flag: "🇫🇷" }];
    }
  },

  // Global storefront settings; the active currency symbol is taken from the backend default
  // currency, the rest is presentation config.
  getGlobalSetting: async () => {
    try {
      const res = await requests.get("/currencies/default");
      return { ...globalSetting, default_currency: res?.symbol || globalSetting?.default_currency };
    } catch (err) {
      return globalSetting;
    }
  },
};

export default SettingServices;
