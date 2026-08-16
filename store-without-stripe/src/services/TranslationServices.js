import requests from "./httpServices";

// Batch machine translation via the backend (LibreTranslate + Redis cache). Best-effort:
// the backend returns the source text unchanged if translation is unavailable.
const TranslationServices = {
  translate: async ({ q, source = "fr", target }) =>
    requests.post("/translate", { q, source, target }),
};

export default TranslationServices;
