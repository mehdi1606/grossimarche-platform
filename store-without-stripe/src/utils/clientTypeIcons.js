import {
  TbApple,
  TbBottle,
  TbBread,
  TbBuildingHospital,
  TbBuildingStore,
  TbBuildingWarehouse,
  TbCake,
  TbCandy,
  TbCheese,
  TbCoffee,
  TbEgg,
  TbFish,
  TbIceCream,
  TbMeat,
  TbMilk,
  TbSchool,
  TbShoppingCart,
  TbSoup,
  TbToolsKitchen2,
  TbTruckDelivery,
} from "react-icons/tb";

/**
 * The icons a client type can carry.
 *
 * Line icons rather than emoji, deliberately. An emoji is a font: it renders as a different
 * picture on Windows, Android and iOS, and a shop sign that changes shape depending on the
 * phone is not a shop sign. These are vectors that inherit the current text colour and size,
 * so one set works on a light card, on a dark header, at 16px and at 48px.
 *
 * The key is what the database stores. Keeping the key stable means restyling - or swapping the
 * whole icon family - is a change here, not a migration.
 */
export const CLIENT_TYPE_ICONS = [
  { key: "bakery", label: "Boulangerie", Icon: TbBread },
  { key: "pastry", label: "Patisserie", Icon: TbCake },
  { key: "grocery", label: "Epicerie", Icon: TbBuildingStore },
  { key: "dairy", label: "Laiterie", Icon: TbMilk },
  { key: "cheese", label: "Fromagerie", Icon: TbCheese },
  { key: "butcher", label: "Boucherie", Icon: TbMeat },
  { key: "fish", label: "Poissonnerie", Icon: TbFish },
  { key: "produce", label: "Primeur", Icon: TbApple },
  { key: "eggs", label: "Oeufs et volaille", Icon: TbEgg },
  { key: "restaurant", label: "Restaurant", Icon: TbToolsKitchen2 },
  { key: "snack", label: "Snack", Icon: TbSoup },
  { key: "cafe", label: "Cafe", Icon: TbCoffee },
  { key: "sweets", label: "Confiserie", Icon: TbCandy },
  { key: "icecream", label: "Glacier", Icon: TbIceCream },
  { key: "drinks", label: "Boissons", Icon: TbBottle },
  { key: "supermarket", label: "Supermarche", Icon: TbShoppingCart },
  { key: "wholesale", label: "Grossiste", Icon: TbBuildingWarehouse },
  { key: "distributor", label: "Distributeur", Icon: TbTruckDelivery },
  { key: "canteen", label: "Cantine / ecole", Icon: TbSchool },
  { key: "hospitality", label: "Hotel / clinique", Icon: TbBuildingHospital },
];

const BY_KEY = CLIENT_TYPE_ICONS.reduce((acc, entry) => {
  acc[entry.key] = entry.Icon;
  return acc;
}, {});

/**
 * The component for a key, with a neutral storefront as the fallback.
 *
 * Never returns null: types created before icons existed have none, and a missing icon has to
 * leave a card that still looks deliberate rather than a hole where a picture should be.
 */
export const clientTypeIcon = (key) => BY_KEY[key] || TbBuildingStore;

export default CLIENT_TYPE_ICONS;
