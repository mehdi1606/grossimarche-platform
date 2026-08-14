import requests from "./httpService";

// Grossimarché has no Kachabazar-style global/store "settings" documents. The admin only needs
// a few presentation defaults (currency symbol, date format, timezone). The currency symbol is
// backend-driven (from the default currency); the rest are sensible constants. No dead
// /setting/* endpoints are called anymore.
const DEFAULT_GLOBAL_SETTING = {
  default_currency: "DH",
  default_currency_position: "right",
  default_time_zone: "Africa/Casablanca",
  default_date_format: "MMM D, YYYY",
  floating_number: 2,
  default_language: "fr",
};

const SettingServices = {
  getGlobalSetting: async () => {
    try {
      const res = await requests.get("/currencies/default");
      return { ...DEFAULT_GLOBAL_SETTING, default_currency: res?.symbol || "DH" };
    } catch (err) {
      return DEFAULT_GLOBAL_SETTING;
    }
  },

  // Kept as no-ops so any lingering caller degrades gracefully instead of hitting a 404.
  updateGlobalSetting: async () => ({ ok: true }),
  addGlobalSetting: async () => ({ ok: true }),

  getStoreSetting: async () => ({}),
  addStoreSetting: async () => ({ ok: true }),
  updateStoreSetting: async () => ({ ok: true }),

  getStoreCustomizationSetting: async () => ({}),
  addStoreCustomizationSetting: async () => ({ ok: true }),
  updateStoreCustomizationSetting: async () => ({ ok: true }),
};

export default SettingServices;
