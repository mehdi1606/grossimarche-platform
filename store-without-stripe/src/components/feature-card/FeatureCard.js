import React from "react";
import { useTranslation } from "react-i18next";
import { FiTruck, FiHeadphones, FiDollarSign, FiTag } from "react-icons/fi";

// Real Grossimarché value props (Morocco, MAD, cash-on-delivery). No online payment yet, so
// there is no "secure payment" card - the promise is payment on delivery. Keys rather than
// sentences: this list is built at module load, where no hook exists yet.
const FEATURES = [
  { key: "shipping", Icon: FiTruck },
  { key: "support", Icon: FiHeadphones },
  { key: "cod", Icon: FiDollarSign },
  { key: "wholesale", Icon: FiTag },
];

/**
 * The reassurance strip that sits between the page and the footer.
 *
 * Four hairline-separated statements rather than four bordered boxes: a row of outlined cards
 * reads as a table of features, which is what a template does. Removing the boxes and giving
 * each promise a second line turns it into something worth reading - the icon supports the
 * words instead of decorating a container.
 */
const FeatureCard = () => {
  const { t } = useTranslation();

  return (
    <div
      data-no-translate
      className="mx-auto grid grid-cols-2 gap-y-8 divide-y divide-line sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
    >
      {FEATURES.map(({ key, Icon }) => (
        <div
          key={key}
          className="group flex items-center justify-center gap-4 px-6 py-2 text-start"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 transition duration-300 group-hover:bg-emerald-600 group-hover:text-white">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-5 text-ink-800">
              {t(`features.${key}_title`)}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">{t(`features.${key}_text`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeatureCard;
