import React from "react";
import { FiTruck, FiHeadphones, FiDollarSign, FiTag } from "react-icons/fi";

// Real Grossimarché value props (Morocco, MAD, cash-on-delivery). No online payment yet, so
// there is no "secure payment" card — the promise is payment on delivery.
const FEATURES = [
  { id: 1, title: "Livraison offerte dès 1000 DH", Icon: FiTruck },
  { id: 2, title: "Support 7j/7", Icon: FiHeadphones },
  { id: 3, title: "Paiement à la livraison", Icon: FiDollarSign },
  { id: 4, title: "Prix de gros dégressifs", Icon: FiTag },
];

const FeatureCard = () => {
  return (
    <div className="mx-auto grid grid-cols-2 md:grid-cols-4">
      {FEATURES.map((promo) => (
        <div
          key={promo.id}
          className="flex items-center justify-center gap-3 border-r border-gray-200 bg-white py-3 last:border-r-0"
        >
          <promo.Icon className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span className="block font-serif text-sm font-medium leading-5 text-gray-700">
            {promo.title}
          </span>
        </div>
      ))}
    </div>
  );
};

export default FeatureCard;
