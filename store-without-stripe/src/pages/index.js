import Link from "next/link";
import {
  FiArrowRight,
  FiTruck,
  FiCreditCard,
  FiTag,
  FiPackage,
  FiShoppingBag,
} from "react-icons/fi";

//internal import
import Layout from "@layout/Layout";
import StickyCart from "@components/cart/StickyCart";
import ProductCard from "@components/product/ProductCard";
import ProductServices from "@services/ProductServices";
import CategoryServices from "@services/CategoryServices";
import AttributeServices from "@services/AttributeServices";
import CategoryRail from "@components/category/CategoryRail";

const VALUE_PROPS = [
  { Icon: FiTag, title: "Prix de gros", text: "Tarifs dégressifs à la quantité" },
  { Icon: FiTruck, title: "Livraison rapide", text: "Partout au Maroc" },
  { Icon: FiCreditCard, title: "Paiement à la livraison", text: "Payez en toute confiance" },
  { Icon: FiPackage, title: "Large catalogue", text: "Des milliers de références" },
];

const Home = ({ popularProducts, categories, attributes }) => {
  const cats = categories?.[0]?.children || [];
  const products = popularProducts || [];

  return (
    <Layout>
      <StickyCart />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-white/5" />
        <div className="relative mx-auto max-w-screen-2xl px-4 py-16 sm:px-10 lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <FiShoppingBag /> Marché de gros en ligne
            </span>
            <h1 className="mt-5 font-serif text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Le gros, livré chez vous.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-emerald-50">
              Achetez en gros aux meilleurs prix — produits alimentaires, boissons et
              essentiels, avec des tarifs dégressifs et le paiement à la livraison.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Découvrir les produits <FiArrowRight />
              </Link>
              {cats[0] && (
                <Link
                  href={`/search?category=${cats[0].slug}&_id=${cats[0]._id}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Parcourir les catégories
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Value props — `relative z-10` is what keeps these on top: the cards are pulled onto
          the hero with -mt-8, and the hero is positioned, so a static section here would be
          painted underneath it and lose its titles behind the green. */}
      <section className="relative z-10 mx-auto max-w-screen-2xl px-4 sm:px-10">
        <div className="-mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {VALUE_PROPS.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-500">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories — one scrollable row with arrow controls */}
      <CategoryRail categories={cats} />

      {/* Products */}
      <section className="bg-white">
        <div className="mx-auto max-w-screen-2xl px-4 py-14 sm:px-10">
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-gray-800">Nos produits</h2>
            <p className="mt-1 text-sm text-gray-500">Sélection disponible à la commande.</p>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
              <span className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500">
                <FiShoppingBag className="text-2xl" />
              </span>
              <h3 className="text-lg font-semibold text-gray-800">Catalogue en préparation</h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                De nouveaux produits arrivent très bientôt. Revenez d'ici peu !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} attributes={attributes} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export const getServerSideProps = async (context) => {
  const { cookies } = context.req;
  const { query, _id } = context.query;

  const [data, categories, attributes] = await Promise.all([
    ProductServices.getShowingStoreProducts({
      category: _id ? _id : "",
      title: query ? query : "",
    }),
    CategoryServices.getShowingCategory(),
    AttributeServices.getShowingAttributes(),
  ]);

  return {
    props: {
      cookies: cookies || null,
      popularProducts: data.popularProducts,
      categories,
      attributes,
    },
  };
};

export default Home;
