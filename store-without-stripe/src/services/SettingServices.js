// Store settings come from local config (see src/config/home.js), not an API — Grossimarché
// has no CMS/settings endpoint. Homepage layout content stays in the existing
// storeCustomizationSetting util so it remains the one place to edit the homepage.
import { storeCustomization } from "@utils/storeCustomizationSetting";
import { globalSetting, storeSetting, seoSetting } from "@config/home";

const SettingServices = {
  getStoreSetting: async () => storeSetting,

  getStoreSeoSetting: async () => seoSetting,

  getStoreCustomizationSetting: async () => storeCustomization,

  getShowingLanguage: async () => [{ name: "English", iso_code: "en" }],

  getGlobalSetting: async () => globalSetting,
};

export default SettingServices;
