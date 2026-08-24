import dayjs from "dayjs";
import useGetSetting from "./useGetSetting";
import { useTranslate } from "@context/TranslationContext";

const useUtilsFunction = () => {
  const { translateValue, t, locale, isRTL } = useTranslate();
  const lang = locale;

  const { globalSetting } = useGetSetting();

  const currency = globalSetting?.default_currency || "$";

  //for date and time format
  const showTimeFormat = (data, timeFormat) => {
    return dayjs(data).format(timeFormat);
  };

  const showDateFormat = (data) => {
    return dayjs(data).format(globalSetting?.default_date_format);
  };

  const showDateTimeFormat = (data, date, time) => {
    return dayjs(data).format(`${date} ${time}`);
  };

  //for formatting number

  const getNumber = (value = 0) => {
    return Number(parseFloat(value || 0).toFixed(2));
  };

  const getNumberTwo = (value = 0) => {
    return parseFloat(value || 0).toFixed(globalSetting?.floating_number || 2);
  };

  //for translation — routed through the machine-translation engine (see TranslationContext)
  const showingTranslateValue = (data) => translateValue(data);

  const showingImage = (data) => {
    return data !== undefined && data;
  };

  const showingUrl = (data) => {
    return data !== undefined ? data : "!#";
  };

  return {
    lang,
    locale,
    isRTL,
    t,
    currency,
    getNumber,
    getNumberTwo,
    showTimeFormat,
    showDateFormat,
    showingImage,
    showingUrl,
    globalSetting,
    showDateTimeFormat,
    showingTranslateValue,
  };
};

export default useUtilsFunction;
